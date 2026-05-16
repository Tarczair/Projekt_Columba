const pool = require("../config/db");
const prisma = require("../config/prisma");
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "twoj_bardzo_tajny_klucz_123";

exports.vote = async (req, res) => {
  const { postId } = req.params;
  const { value } = req.body;
  const userId = req.user.userId;

  try {
    const oldVote = await prisma.votes.findUnique({
      where: {
        user_id_post_id: {
          user_id: userId,
          post_id: postId,
        },
      },
    });
    const oldValue = oldVote ? oldVote.value : 0;

    if (value === 0) {
      await prisma.votes.deleteMany({
        where: {
          user_id: userId,
          post_id: postId,
        },
      });
    } else {
      await prisma.votes.upsert({
        where: {
          user_id_post_id: {
            user_id: userId,
            post_id: postId,
          },
        },
        update: { value },
        create: {
          user_id: userId,
          post_id: postId,
          value,
        },
      });
    }

    const diff = value - oldValue;
    if (diff !== 0) {
      await prisma.posts.update({
        where: { id: postId },
        data: {
          upvotes_count: {
            increment: diff,
          },
        },
      });
    }

    res.status(200).json({ message: "Głos zapisany", currentVote: value });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Błąd bazy danych" });
  }
};

exports.addPost = async (req, res) => {
  const client = await pool.connect();
  try {
    const { title, post, community_name, is_spoiler } = req.body;
    const userId = req.user.userId;

    if (!title || !post || !community_name) {
      return res
        .status(400)
        .json({ error: "Tytuł, treść i społeczność są wymagane." });
    }

    let imageUrl = req.file
      ? `http://localhost:5000/uploads/${req.file.filename}`
      : null;

    await client.query("BEGIN");

    const communityRes = await client.query(
      "SELECT id FROM communities WHERE name = $1",
      [community_name],
    );
    if (communityRes.rows.length === 0)
      throw new Error("Wybrana społeczność nie istnieje.");
    const communityId = communityRes.rows[0].id;

    const banCheck = await client.query(
      "SELECT 1 FROM users_banned WHERE user_id = $1 AND community_id = $2 AND is_active = true",
      [userId, communityId],
    );
    if (banCheck.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(403).json({
        error: "Nie możesz postować – masz aktywnego bana w tej społeczności.",
      });
    }

    const postResult = await client.query(
      `INSERT INTO posts (title, post, main_image_url, user_id, community_id, is_spoiler) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [
        title,
        post,
        imageUrl,
        userId,
        communityId,
        is_spoiler === "true" || is_spoiler === true,
      ],
    );
    const newPostId = postResult.rows[0].id;

    if (req.body.tags) {
      const parsedTags =
        typeof req.body.tags === "string"
          ? JSON.parse(req.body.tags)
          : req.body.tags;
      if (Array.isArray(parsedTags) && parsedTags.length > 0) {
        const tagIdsRes = await client.query(
          "SELECT id FROM tags WHERE name = ANY($1)",
          [parsedTags],
        );
        for (const row of tagIdsRes.rows) {
          await client.query(
            "INSERT INTO post_tags (post_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
            [newPostId, row.id],
          );
        }
      }
    }

    await client.query("COMMIT");
    res
      .status(201)
      .json({ message: "Post dodany pomyślnie!", postId: newPostId });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

exports.reportPost = async (req, res) => {
  const { post_id, rule_id, community_id, description } = req.body;
  const reporter_id = req.user.userId;

  try {
    if (!post_id || !community_id) {
      return res
        .status(400)
        .json({ error: "Brakujące pola: post_id lub community_id" });
    }

    const postRes = await pool.query(
      "SELECT user_id FROM posts WHERE id = $1",
      [post_id],
    );

    if (postRes.rows.length === 0) {
      return res.status(404).json({ error: "Post nie istnieje" });
    }

    const reported_user_id = postRes.rows[0].user_id;

    await pool.query(
      `INSERT INTO reports (reporter_id, post_id, reported_user_id, rule_id, community_id, description, status) 
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')`,
      [
        reporter_id,
        post_id,
        reported_user_id,
        rule_id || null,
        community_id,
        description || null,
      ],
    );

    res
      .status(201)
      .json({ success: true, message: "Zgłoszenie zostało wysłane" });
  } catch (err) {
    console.error("Błąd podczas wysyłania zgłoszenia:", err);
    res
      .status(500)
      .json({ error: "Błąd serwera podczas wysyłania zgłoszenia" });
  }
};

exports.deleteReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    await pool.query("UPDATE reports SET status = 'resolved' WHERE id = $1", [
      reportId,
    ]);
    res.json({ message: "Zgłoszenie usunięte" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getHomeFeed = async (req, res) => {
  try {
    const limit = 10;
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    let userId = null;

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded.userId;
      } catch (e) {}
    }

    const result = await pool.query(
      `
      SELECT 
        c.id AS community_id,
        c.owner_id,
        c.name AS community_name, 
        c.avatar_url AS community_avatar,
        (
          SELECT json_agg(json_build_object(
            'id', r.id, 
            'rule_title', r.rule_title, 
            'description', r.description
          ))
          FROM rules r 
          WHERE r.community_id = c.id
        ) AS community_rules,
        p.id AS post_id, 
        p.title, 
        p.post AS text, 
        p.main_image_url AS image, 
        p.created_at, 
        p.upvotes_count,
        p.comments_count,
        u.username AS user_name, 
        u.avatar_url AS author_avatar,
        COALESCE(v.value, 0) AS user_vote_value
      FROM communities c
      JOIN LATERAL (
          SELECT * FROM posts 
          WHERE community_id = c.id 
          AND deleted_at IS NULL
          ORDER BY created_at DESC 
          LIMIT 1
      ) p ON true
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN votes v ON v.post_id = p.id AND v.user_id = $2
      WHERE NOT EXISTS (
        SELECT 1
        FROM users_banned ub
        WHERE ub.community_id = c.id
          AND ub.user_id = $2
          AND ub.is_active = true
          AND (ub.expires_at IS NULL OR ub.expires_at > NOW())
      )
      ORDER BY p.created_at DESC 
      LIMIT $1;
    `,
      [limit, userId],
    );

    const feedData = result.rows.map((row) => ({
      communityId: row.community_id,
      owner_id: row.owner_id,
      communityName: row.community_name,
      avatar: row.community_avatar || "/img/pepe_placeholder.png",
      communityRules: row.community_rules || [],
      post: {
        id: row.post_id,
        avatarPath: row.author_avatar || "/img/pepe_placeholder.png",
        userName: row.user_name || "Anonim",
        title: row.title,
        text: row.text,
        tags: [],
        image: row.image || "",
        upvotes: row.upvotes_count || 0,
        isRemoved: false,
        createdAt: row.created_at,
        displayDate: new Date(row.created_at).toLocaleDateString(),
        comments: row.comments_count || 0,
        userVoteValue: parseInt(row.user_vote_value),
      },
    }));

    res.json({
      data: feedData,
      nextCursor: null,
    });
  } catch (err) {
    console.error("Błąd HomeFeed:", err);
    res.status(500).json({ error: "Błąd ładowania homefeed" });
  }
};

exports.search = async (req, res) => {
  const { q, type } = req.query;
  if (!q) return res.json([]);
  const finalQuery = `${q.trim().split(/\s+/).join(" & ")}:*`;

  try {
    let result;
    if (type === "posts") {
      result = await pool.query(
        `SELECT p.id, p.title, c.name as "communityName" FROM posts p 
         JOIN communities c ON c.id = p.community_id 
         WHERE p.search_vector @@ to_tsquery('simple', $1) LIMIT 20`,
        [finalQuery],
      );
    } else if (type === "users") {
      result = await pool.query(
        `SELECT id, username, avatar_url as avatar FROM users 
         WHERE search_vector @@ to_tsquery('simple', $1) LIMIT 20`,
        [finalQuery],
      );
    }
    res.json(result ? result.rows : []);
  } catch (err) {
    console.error("Błąd wyszukiwania:", err);
    res.status(500).json({ error: "Błąd wyszukiwania" });
  }
};

exports.deletePost = async (req, res) => {
  const { postId } = req.params;
  const requesterId = req.user.userId;

  try {
    const post = await prisma.posts.findUnique({
      where: { id: postId },
      include: {
        communities: {
          include: {
            community_members: {
              where: { user_id: requesterId },
            },
          },
        },
      },
    });

    if (!post) {
      return res.status(404).json({ error: "Post nie istnieje" });
    }

    const memberInfo = post.communities?.community_members[0];
    const isAuthor = post.user_id === requesterId;

    const isAuthorized =
      isAuthor ||
      post.communities?.owner_id === requesterId ||
      memberInfo?.role === "owner" ||
      memberInfo?.role === "admin" ||
      memberInfo?.can_delete_posts === true;

    if (!isAuthorized) {
      return res
        .status(403)
        .json({ error: "Brak uprawnień do usunięcia tego posta" });
    }

    await prisma.reports.deleteMany({
      where: { post_id: postId },
    });

    await prisma.posts.delete({
      where: { id: postId },
    });

    res.json({ message: "Post został pomyślnie usunięty" });
  } catch (err) {
    console.error("Błąd podczas usuwania posta:", err);
    res.status(500).json({ error: "Błąd serwera podczas usuwania posta" });
  }
};
