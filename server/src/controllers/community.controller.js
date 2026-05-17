const prisma = require("../config/prisma");
const pool = require("../config/db");
const jwt = require("jsonwebtoken");

exports.getTags = async (req, res) => {
  try {
    const result = await pool.query("SELECT name FROM tags ORDER BY name ASC");
    const tags = result.rows.map((row) => row.name);
    res.json(tags);
  } catch (err) {
    console.error("Błąd pobierania tagów:", err);
    res.status(500).json({ error: "Błąd pobierania tagów z bazy" });
  }
};

exports.getMembers = async (req, res) => {
  try {
    const { communityId } = req.params;

    const members = await pool.query(
      `SELECT 
        u.id, 
        u.username, 
        u.avatar_url,
        cm.role,
        cm.can_delete_posts,
        cm.can_ban_users,
        cm.can_manage_mods,
        COALESCE(ub.is_active, false) AS is_banned
       FROM users u
       LEFT JOIN community_members cm ON u.id = cm.user_id AND cm.community_id = $1
       LEFT JOIN users_banned ub ON u.id = ub.user_id AND ub.community_id = $1 AND ub.is_active = true
       WHERE cm.community_id = $1 OR ub.is_active = true`,
      [communityId],
    );

    res.json(members.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.resolveReport = async (req, res) => {
  try {
    const { reportId } = req.params;

    await prisma.reports.delete({
      where: { id: reportId },
    });

    res.json({ success: true, message: "Zgłoszenie zostało usunięte." });
  } catch (err) {
    console.error("Błąd usuwania zgłoszenia:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.getReports = async (req, res) => {
  try {
    const { communityId } = req.params;
    const reports = await pool.query(
      `SELECT 
        r.id, 
        u.username as reporter, 
        r.post_id,
        p.title as "postTitle", 
        COALESCE(ru.rule_title, r.description) as rule, 
        r.reported_user_id,
        r.status
       FROM reports r
       JOIN users u ON r.reporter_id = u.id
       JOIN posts p ON r.post_id = p.id
       LEFT JOIN rules ru ON r.rule_id = ru.id 
       WHERE r.community_id = $1 AND r.status = 'pending'`,
      [communityId],
    );
    res.json(reports.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createCommunity = async (req, res) => {
  const client = await pool.connect();

  try {
    const { name, description, rules: rulesJson } = req.body;
    const tags = req.body.tags ? JSON.parse(req.body.tags) : [];
    const userId = req.user.userId;

    const rules = rulesJson ? JSON.parse(rulesJson) : [];

    let avatarUrl = null;
    if (req.file) {
      avatarUrl = `http://localhost:5000/uploads/${req.file.filename}`;
    }

    await client.query("BEGIN");

    const communityResult = await client.query(
      `INSERT INTO communities (name, description, avatar_url, owner_id) 
   VALUES ($1, $2, $3, $4::uuid) 
   RETURNING id`,
      [name, description, avatarUrl, userId],
    );

    const communityId = communityResult.rows[0].id;

    await client.query(
      `INSERT INTO community_members (community_id, user_id, role) 
       VALUES ($1::uuid, $2::uuid, 'owner')`,
      [communityId, userId],
    );

    if (rules && rules.length > 0) {
      for (const rule of rules) {
        await client.query(
          `INSERT INTO rules (community_id, rule_title, description) 
           VALUES ($1, $2, $3)`,
          [communityId, rule.rule_title, rule.description],
        );
      }
    }

    if (tags.length > 0) {
      const tagIdsRes = await client.query(
        "SELECT id FROM tags WHERE name = ANY($1)",
        [tags],
      );
      for (const row of tagIdsRes.rows) {
        await client.query(
          "INSERT INTO community_tags (community_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
          [communityId, row.id],
        );
      }
    }

    await client.query("COMMIT");

    res.status(201).json({
      message: "Stworzono społeczność!",
      communityId: communityId,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Błąd tworzenia społeczności:", err);

    if (err.code === "23505") {
      return res.status(400).json({
        error: "Społeczność o tej nazwie już istnieje",
      });
    }

    res.status(500).json({
      error: err.message,
    });
  } finally {
    client.release();
  }
};

exports.handleToggleBan = async (req, res) => {
  try {
    const { communityId, action } = req.params;
    const { userId: targetUserId } = req.body;
    const requesterId = req.user.userId;

    const community = await prisma.communities.findUnique({
      where: { id: communityId },
    });

    if (!community) {
      return res.status(404).json({ error: "Nie znaleziono społeczności" });
    }

    if (action === "ban" && targetUserId === community.owner_id) {
      return res
        .status(400)
        .json({ error: "Nie możesz zbanować właściciela tej społeczności!" });
    }

    const memberCheck = await prisma.community_members.findFirst({
      where: { community_id: communityId, user_id: requesterId },
    });

    const isOwner = community.owner_id === requesterId;
    const canBan =
      memberCheck?.can_ban_users === true || memberCheck?.role === "moderator";

    if (!isOwner && !canBan) {
      return res.status(403).json({
        error: "Brak uprawnień do zarządzania blokadami w tej społeczności.",
      });
    }

    if (action === "ban") {
      await prisma.$transaction([
        prisma.users_banned.upsert({
          where: {
            user_id_community_id: {
              user_id: targetUserId,
              community_id: communityId,
            },
          },
          update: {
            is_active: true,
            description: "Złamanie regulaminu panelu",
            banned_by_id: requesterId,
          },
          create: {
            user_id: targetUserId,
            community_id: communityId,
            banned_by_id: requesterId,
            description: "Złamanie regulaminu panelu",
            is_active: true,
          },
        }),
        prisma.community_members.deleteMany({
          where: { community_id: communityId, user_id: targetUserId },
        }),
        prisma.reports.deleteMany({
          where: { community_id: communityId, reported_user_id: targetUserId },
        }),
      ]);

      return res.json({ message: "Użytkownik został pomyślnie zbanowany." });
    } else if (action === "unban") {
      const updateResult = await prisma.users_banned.updateMany({
        where: {
          user_id: targetUserId,
          community_id: communityId,
          is_active: true,
        },
        data: { is_active: false },
      });

      if (updateResult.count === 0) {
        return res
          .status(400)
          .json({ error: "Użytkownik nie posiada aktywnego bana." });
      }

      return res.json({ message: "Użytkownik został pomyślnie odbanowany." });
    } else {
      return res.status(400).json({ error: "Nieprawidłowa akcja." });
    }
  } catch (err) {
    console.error("Błąd podczas operacji ban/unban:", err);
    res
      .status(500)
      .json({ error: "Błąd serwera podczas modyfikacji blokady." });
  }
};

exports.getCommunityDetails = async (req, res) => {
  try {
    const { name } = req.params;
    const highlight = req.query.highlight;
    const limit = parseInt(req.query.limit) || 10;
    const cursor = req.query.cursor;
    const effectiveLimit = highlight && !cursor ? limit - 1 : limit;

    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    let userId = null;

    if (token) {
      try {
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || "twoj_bardzo_tajny_klucz_123",
        );
        userId = decoded.userId;
      } catch (e) {}
    }

    const communityRes = await pool.query(
      "SELECT id, name, description, avatar_url, created_at, owner_id FROM communities WHERE name ILIKE $1",
      [name],
    );

    if (communityRes.rows.length === 0) {
      return res.status(404).json({ error: "Brak społeczności" });
    }
    const community = communityRes.rows[0];

    let currentUserRole = null;
    if (userId) {
      const roleRes = await pool.query(
        `SELECT role, can_delete_posts, can_ban_users, can_manage_mods 
         FROM community_members 
         WHERE community_id = $1 AND user_id = $2`,
        [community.id, userId],
      );

      if (roleRes.rows.length > 0) {
        currentUserRole = roleRes.rows[0];
      } else if (community.owner_id === userId) {
        currentUserRole = {
          role: "owner",
          can_delete_posts: true,
          can_ban_users: true,
          can_manage_mods: true,
        };
      }
    }

    if (userId) {
      const banCheck = await pool.query(
        "SELECT 1 FROM users_banned WHERE user_id = $1 AND community_id = $2 AND is_active = true",
        [userId, community.id],
      );
      if (banCheck.rows.length > 0) {
        return res.status(403).json({
          error: "Jesteś zbanowany w tej społeczności.",
          isBanned: true,
        });
      }
    }

    let postsQuery = `
      SELECT p.*, u.username AS "userName", u.avatar_url AS "avatarPath",
             COALESCE(v.value, 0) AS "userVoteValue",
             (SELECT json_agg(t.name) FROM post_tags pt JOIN tags t ON t.id = pt.tag_id WHERE pt.post_id = p.id) AS tags_array
      FROM posts p
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN votes v ON v.post_id = p.id AND v.user_id = $2
      WHERE p.community_id = $1 AND p.deleted_at IS NULL
    `;

    const params = [community.id, userId];

    if (highlight && !cursor) {
      postsQuery += ` AND p.id != $3`;
      params.push(highlight);
    } else if (cursor) {
      postsQuery += ` AND p.created_at < $3`;
      params.push(cursor);
    }

    postsQuery += ` ORDER BY p.created_at DESC LIMIT $${params.length + 1}`;
    params.push(effectiveLimit);

    const postsRes = await pool.query(postsQuery, params);
    let finalPosts = postsRes.rows;

    if (highlight && !cursor) {
      const highlightedPostRes = await pool.query(
        `SELECT p.*, u.username AS "userName", u.avatar_url AS "avatarPath",
                COALESCE(v.value, 0) AS "userVoteValue",
                (SELECT json_agg(t.name) FROM post_tags pt JOIN tags t ON t.id = pt.tag_id WHERE pt.post_id = p.id) AS tags_array
         FROM posts p 
         LEFT JOIN users u ON p.user_id = u.id
         LEFT JOIN votes v ON v.post_id = p.id AND v.user_id = $2
         WHERE p.id = $1`,
        [highlight, userId],
      );

      if (highlightedPostRes.rows.length > 0) {
        finalPosts = [highlightedPostRes.rows[0], ...finalPosts];
      }
    }

    const rulesRes = await pool.query(
      "SELECT id, rule_title, description FROM rules WHERE community_id = $1",
      [community.id],
    );

    const formattedPosts = finalPosts.map((p) => ({
      ...p,
      image: p.main_image_url || p.image || "",
      avatarPath: p.avatarPath || "/img/pepe_placeholder.png",
      createdAt: p.created_at,
      displayDate: new Date(p.created_at).toLocaleDateString(),
      tags: p.tags_array || [],
      userVoteValue: parseInt(p.userVoteValue) || 0,
      upvotes_count: parseInt(p.upvotes_count) || 0,
      comments_count: parseInt(p.comments_count) || 0,
      upvotes: parseInt(p.upvotes_count) || 0,
      comments: parseInt(p.comments_count) || 0,
    }));

    const nextCursor =
      finalPosts.length >= limit
        ? finalPosts[finalPosts.length - 1].created_at
        : null;

    res.json({
      ...community,
      posts: formattedPosts,
      nextCursor: nextCursor,
      rules: rulesRes.rows,
      currentUserRole: currentUserRole,
    });
  } catch (err) {
    console.error("Błąd w get community:", err);
    res.status(500).json({ error: "Błąd serwera" });
  }
};

exports.getCommunityById = async (req, res) => {
  try {
    const { communityId } = req.params;

    const result = await pool.query(
      "SELECT id, name, description, avatar_url, owner_id FROM communities WHERE id = $1",
      [communityId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Nie znaleziono społeczności" });
    }

    const community = result.rows[0];
    let currentUserRole = null;

    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        const roleRes = await pool.query(
          `SELECT role, can_delete_posts, can_ban_users, can_manage_mods 
           FROM community_members 
           WHERE community_id = $1 AND user_id = $2`,
          [communityId, userId],
        );

        if (roleRes.rows.length > 0) {
          currentUserRole = roleRes.rows[0];
        }
      } catch (jwtErr) {
        console.error("JWT Error:", jwtErr.message);
      }
    }

    const tagsRes = await pool.query(
      "SELECT t.name FROM tags t JOIN community_tags ct ON t.id = ct.tag_id WHERE ct.community_id = $1",
      [communityId],
    );

    const rulesRes = await pool.query(
      "SELECT id, rule_title, description FROM rules WHERE community_id = $1",
      [communityId],
    );

    const tagsArray = tagsRes.rows.map((r) => r.name);
    const communityTagsFormatted = tagsArray.map((name) => ({
      tags: { name },
    }));

    res.json({
      ...community,
      tags: tagsArray,
      community_tags: communityTagsFormatted,
      rules: rulesRes.rows,
      role: currentUserRole ? currentUserRole.role : "guest",
      permissions: currentUserRole || {
        can_delete_posts: false,
        can_ban_users: false,
        can_manage_mods: false,
      },
      currentUserRole: currentUserRole,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.joinCommunity = async (req, res) => {
  const { name } = req.body;
  const userId = req.user.userId;

  try {
    if (!name) {
      return res.status(400).json({ error: "Brak nazwy społeczności" });
    }

    const cleanName = name.startsWith("c/") ? name.replace(/^c\//, "") : name;

    const communityResult = await pool.query(
      "SELECT id FROM communities WHERE name = $1",
      [cleanName],
    );

    if (communityResult.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Nie znaleziono społeczności w bazie" });
    }

    const communityId = communityResult.rows[0].id;

    await pool.query(
      `INSERT INTO community_members (community_id, user_id, role) 
       VALUES ($1, $2, 'member') 
       ON CONFLICT (community_id, user_id) DO NOTHING`,
      [communityId, userId],
    );

    const roleRes = await pool.query(
      "SELECT role FROM community_members WHERE community_id = $1 AND user_id = $2",
      [communityId, userId],
    );

    res.json({
      success: true,
      message: "Pomyślnie dołączono do społeczności",
      role: roleRes.rows[0]?.role || "member",
    });
  } catch (err) {
    console.error("Błąd joinCommunity:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.leaveCommunity = async (req, res) => {
  const { name } = req.body;
  const userId = req.user.userId;

  try {
    const communityResult = await pool.query(
      "SELECT id FROM communities WHERE name = $1",
      [name],
    );

    if (communityResult.rows.length === 0) {
      return res.status(404).json({ error: "Nie znaleziono społeczności" });
    }

    const communityId = communityResult.rows[0].id;

    await pool.query(
      "DELETE FROM community_members WHERE community_id = $1 AND user_id = $2",
      [communityId, userId],
    );

    res.json({ success: true, message: "Pomyślnie opuszczono społeczność" });
  } catch (err) {
    console.error("Błąd leaveCommunity:", err);
    res.status(500).json({ error: "Wystąpił wewnętrzny błąd serwera" });
  }
};

exports.updateCommunity = async (req, res) => {
  const { communityId } = req.params;
  const { name, description, rules: rulesJson } = req.body;
  const userId = req.user.userId;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const checkOwner = await client.query(
      "SELECT owner_id FROM communities WHERE id = $1",
      [communityId],
    );

    if (
      checkOwner.rows.length === 0 ||
      checkOwner.rows[0].owner_id !== userId
    ) {
      return res.status(403).json({ error: "Brak uprawnień" });
    }

    let avatarUrl = req.body.avatar_url;
    if (req.file) {
      avatarUrl = `/uploads/${req.file.filename}`;
    }

    await client.query(
      `UPDATE communities SET name = $1, description = $2, avatar_url = COALESCE($3, avatar_url) 
       WHERE id = $4`,
      [name, description, avatarUrl, communityId],
    );

    if (rulesJson) {
      const rules = JSON.parse(rulesJson);
      await client.query("DELETE FROM rules WHERE community_id = $1", [
        communityId,
      ]);
      for (const rule of rules) {
        await client.query(
          "INSERT INTO rules (community_id, rule_title, description) VALUES ($1, $2, $3)",
          [communityId, rule.rule_title, rule.description],
        );
      }
    }

    if (req.body.tags) {
      const tagsArray = JSON.parse(req.body.tags);
      await client.query("DELETE FROM community_tags WHERE community_id = $1", [
        communityId,
      ]);
      for (const tagName of tagsArray) {
        const tagRes = await client.query(
          "INSERT INTO tags (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name=EXCLUDED.name RETURNING id",
          [tagName],
        );
        await client.query(
          "INSERT INTO community_tags (community_id, tag_id) VALUES ($1, $2)",
          [communityId, tagRes.rows[0].id],
        );
      }
    }

    await client.query("COMMIT");
    res.json({ message: "Zaktualizowano pomyślnie", avatar_url: avatarUrl });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

exports.updateMemberPermissions = async (req, res) => {
  const { communityId, userId } = req.params;
  const requesterId = req.user.userId;

  try {
    const comm = await prisma.communities.findUnique({
      where: { id: communityId },
    });

    if (!comm) {
      return res.status(404).json({ error: "Nie znaleziono społeczności" });
    }

    const requesterMember = await prisma.community_members.findFirst({
      where: {
        community_id: communityId,
        user_id: requesterId,
      },
    });

    const hasPermission =
      comm.owner_id === requesterId ||
      (requesterMember && requesterMember.can_manage_mods === true);

    if (!hasPermission) {
      return res.status(403).json({
        error:
          "Nie masz uprawnień do zarządzania moderatorami w tej społeczności.",
      });
    }

    if (userId === comm.owner_id) {
      return res.status(400).json({
        error: "Nie można modyfikować uprawnień właściciela społeczności",
      });
    }

    const can_delete_posts = String(req.body.can_delete_posts) === "true";
    const can_ban_users = String(req.body.can_ban_users) === "true";
    const can_manage_mods = String(req.body.can_manage_mods) === "true";

    const existingMember = await prisma.community_members.findFirst({
      where: {
        community_id: communityId,
        user_id: userId,
      },
    });

    if (existingMember) {
      await prisma.community_members.updateMany({
        where: { community_id: communityId, user_id: userId },
        data: {
          role: "moderator",
          can_delete_posts,
          can_ban_users,
          can_manage_mods,
        },
      });
    } else {
      await prisma.community_members.create({
        data: {
          community_id: communityId,
          user_id: userId,
          role: "moderator",
          can_delete_posts,
          can_ban_users,
          can_manage_mods,
        },
      });
    }

    res.json({ message: "Uprawnienia zaktualizowane pomyślnie!" });
  } catch (err) {
    console.error("Błąd aktualizacji uprawnień:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.deleteCommunity = async (req, res) => {
  try {
    const { name } = req.params;
    const userId = req.user.userId;

    const community = await prisma.communities.findFirst({ where: { name } });
    if (!community || community.owner_id !== userId) {
      return res.status(403).json({ error: "Brak uprawnień do usunięcia" });
    }

    await prisma.communities.delete({ where: { id: community.id } });
    res.json({ message: "Społeczność została usunięta" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
