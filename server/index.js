const express = require("express");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const app = express();

const JWT_SECRET = process.env.JWT_SECRET || "twoj_bardzo_tajny_klucz_123";

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Wyciąga "TOKEN" z "Bearer TOKEN"

  if (!token) return res.status(401).json({ error: "Brak dostępu" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Token nieważny" });
    req.user = user;
    next();
  });
};

app.use(cors());
app.use(express.json());
app.use(express.text());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.post("/api/register", async (req, res) => {
  const { email, username, password } = req.body;

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await pool.query(
      "INSERT INTO users (email, username, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email",
      [email, username, hashedPassword],
    );

    res
      .status(201)
      .json({ message: "Użytkownik stworzony!", user: newUser.rows[0] });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Błąd rejestracji (może email/nazwa już zajęta?)" });
  }
});

app.post("/api/login", async (req, res) => {
  const { identity, password } = req.body;
  try {
    const userResult = await pool.query(
      "SELECT * FROM users WHERE email = $1 OR username = $1",
      [identity],
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: "Nieprawidłowe dane logowania" });
    }

    const user = userResult.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: "Nieprawidłowe dane logowania" });
    }

    const commsQuery = await pool.query(
      "SELECT c.id, c.name, c.avatar_url as avatar FROM communities c JOIN community_members cm ON c.id = cm.community_id WHERE cm.user_id = $1",
      [user.id],
    );

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: "24h" },
    );

    res.json({
      message: "Zalogowano pomyślnie!",
      token: token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        bio: user.bio,
        avatar: user.avatar_url,
        communities: commsQuery.rows,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Błąd serwera" });
  }
});

app.get("/", (req, res) => res.send("Backend działa i słucha!"));

// 1. Pobieranie listy członków danej społeczności (do listy w panelu)
app.get("/api/communities/:communityId/members", authenticateToken, async (req, res) => {
  try {
    const { communityId } = req.params;
    const members = await pool.query(
      `SELECT u.id, u.username, u.avatar_url, cm.role, cm.status, 
              cm.can_delete_posts, cm.can_ban_users, cm.can_manage_mods
       FROM community_members cm
       JOIN users u ON cm.user_id = u.id
       WHERE cm.community_id = $1`,
      [communityId]
    );
    res.json(members.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Aktualizacja uprawnień moderatora
app.post("/api/communities/:communityId/members/:userId/permissions", authenticateToken, async (req, res) => {
  const { communityId, userId } = req.params;
  const { can_delete_posts, can_ban_users, can_manage_mods, role } = req.body;
  const requesterId = req.user.userId;

  try {
    // Sprawdzenie czy żądający to owner
    const ownerCheck = await pool.query(
      "SELECT 1 FROM communities WHERE id = $1 AND owner_id = $2",
      [communityId, requesterId]
    );

    if (ownerCheck.rows.length === 0) {
      return res.status(403).json({ error: "Tylko właściciel może to robić" });
    }

    await pool.query(
      `UPDATE community_members 
       SET role = $1, can_delete_posts = $2, can_ban_users = $3, can_manage_mods = $4
       WHERE community_id = $5 AND user_id = $6`,
      [role, can_delete_posts, can_ban_users, can_manage_mods, communityId, userId]
    );

    res.json({ message: "Uprawnienia zaktualizowane!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Pobieranie zgłoszeń dla danej społeczności (do dolnej tabeli)
app.get("/api/communities/:communityId/reports", authenticateToken, async (req, res) => {
  try {
    const { communityId } = req.params;
    const reports = await pool.query(
      `SELECT 
        r.id, 
        u.username as reporter, 
        p.title as "postTitle", 
        COALESCE(ru.rule_title, r.description) as rule, -- Jeśli brak zasady, weź opis "Inne"
        r.reported_user_id,
        r.status
       FROM reports r
       JOIN users u ON r.reporter_id = u.id
       JOIN posts p ON r.post_id = p.id
       LEFT JOIN rules ru ON r.rule_id = ru.id -- Zmienione na LEFT JOIN, żeby nie ignorować NULLi
       WHERE r.community_id = $1 AND r.status = 'pending'`,
      [communityId]
    );
    res.json(reports.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// USUNIĘCIE (IGNOROWANIE) ZGŁOSZENIA
app.delete("/api/reports/:reportId", authenticateToken, async (req, res) => {
  try {
    const { reportId } = req.params;
    // Zmieniamy status na 'resolved', żeby nie wisiał w panelu
    await pool.query("UPDATE reports SET status = 'resolved' WHERE id = $1", [reportId]);
    res.json({ message: "Zgłoszenie usunięte" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// BANOWANIE Z POZIOMU ZGŁOSZENIA
app.post("/api/communities/:communityId/ban-reported", authenticateToken, async (req, res) => {
  const { communityId } = req.params;
  const { userId, reportId } = req.body;

  try {
    await pool.query("BEGIN");

    // 1. Ban (reaktywuje jeśli już był)
    await pool.query(
      `INSERT INTO users_banned (user_id, community_id, description, is_active)
       VALUES ($1, $2, $3, true)
       ON CONFLICT (user_id, community_id)
       DO UPDATE SET 
         is_active = true,
         description = EXCLUDED.description,
         expires_at = NULL`,
      [userId, communityId, "Zbanowany z panelu zgłoszeń"]
    );

    // 2. Zamknij WSZYSTKIE zgłoszenia na tego usera w tej community
    await pool.query(
      `UPDATE reports
       SET status = 'resolved'
       WHERE community_id = $1
         AND reported_user_id = $2
         AND status = 'pending'`,
      [communityId, userId]
    );

    await pool.query("COMMIT");

    res.json({ message: "Użytkownik zbanowany, wszystkie zgłoszenia zamknięte" });
  } catch (err) {
    await pool.query("ROLLBACK");
    console.error("BAN REPORTED ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// Pobieranie szczegółów społeczności po ID
app.get("/api/communities-by-id/:communityId", authenticateToken, async (req, res) => {
  try {
    const { communityId } = req.params;
    const result = await pool.query(
      "SELECT name, description, avatar_url FROM communities WHERE id = $1",
      [communityId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Nie znaleziono społeczności" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// BANOWANIE UŻYTKOWNIKA Z PANELU ADMINA
app.post("/api/communities/:communityId/ban-user", authenticateToken, async (req, res) => {
  const { communityId } = req.params;
  const { userId } = req.body;

  try {
    await pool.query("BEGIN");

    // Sprawdź, czy użytkownik jest już zbanowany
    const existingBan = await pool.query(
      "SELECT id, is_active FROM users_banned WHERE user_id = $1 AND community_id = $2",
      [userId, communityId]
    );

    if (existingBan.rows.length > 0) {
      const ban = existingBan.rows[0];
      if (ban.is_active) {
        // Jeśli już aktywny ban, to odbanuj (toggle)
        await pool.query(
          "UPDATE users_banned SET is_active = false WHERE id = $1",
          [ban.id]
        );
        await pool.query("COMMIT");
        return res.json({ message: "Użytkownik został odbanowany" });
      } else {
        // Jeśli nieaktywny, aktywuj ponownie
        await pool.query(
          "UPDATE users_banned SET is_active = true, description = 'Zbanowany z panelu admina' WHERE id = $1",
          [ban.id]
        );
        await pool.query("COMMIT");
        return res.json({ message: "Użytkownik został ponownie zbanowany" });
      }
    } else {
      // Nowy ban
      await pool.query(
        `INSERT INTO users_banned (user_id, community_id, description, is_active, banned_by_id)
         VALUES ($1, $2, $3, true, $4)`,
        [userId, communityId, "Zbanowany z panelu admina", req.user.userId]
      );
      await pool.query("COMMIT");
      return res.json({ message: "Użytkownik został zbanowany" });
    }
  } catch (err) {
    await pool.query("ROLLBACK");
    console.error("BAN USER ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(5000, "0.0.0.0", () => {
  console.log("Serwer Node śmiga na porcie 5000");
});



app.get("/api/me", authenticateToken, async (req, res) => {
  try {
    const userQuery = await pool.query(
      "SELECT id, username, email, bio, avatar_url as avatar, created_at FROM users WHERE id = $1",
      [req.user.userId],
    );

    if (userQuery.rows.length === 0)
      return res.status(404).json({ error: "Nie ma takiego użytkownika" });

    const userData = userQuery.rows[0];

    //Pobieramy społeczności, do których należy
    const commsQuery = await pool.query(
      "SELECT c.id, c.name, c.avatar_url as avatar FROM communities c JOIN community_members cm ON c.id = cm.community_id WHERE cm.user_id = $1 AND c.owner_id != $1;",
      [req.user.userId],
    );

    //Pobieramy posty, ktore stworzyl uzytkownik
    const postsQueryQuery = await pool.query(
      `SELECT 
        p.id, 
        c.name AS "communityName", 
        p.title, 
        p.created_at AS "createdAt", 
        p.comments_count AS "comments", 
        p.upvotes_count AS "upvotes", 
        c.avatar_url AS "communityAvatar" 
      FROM posts p 
      JOIN communities c ON c.id = p.community_id 
      WHERE p.user_id = $1`,
      [req.user.userId],
    );

    //Pobieramy spolecznosci, ktore stworzyl uzytkownik
    const createdCommsQuery = await pool.query(
      "SELECT c.id, c.name, c.avatar_url as avatar FROM communities c JOIN community_members cm ON c.id = cm.community_id WHERE cm.user_id = $1 AND c.owner_id = $1;",
      [req.user.userId],
    );

    res.json({
      ...userData,
      communities: commsQuery.rows,
      posts: postsQueryQuery.rows,
      createdCommunities: createdCommsQuery.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.post(
  "/api/update_profile",
  authenticateToken,
  upload.single("avatar"),
  async (req, res) => {
    try {
      const { username, bio } = req.body;
      const userId = req.user.userId;

      let avatarUrl = req.body.avatar_url;
      if (req.file) {
        avatarUrl = `http://localhost:5000/uploads/${req.file.filename}`;
      }

      const nameCheck = await pool.query(
        "SELECT id FROM users WHERE username = $1 AND id != $2",
        [username, userId],
      );

      if (nameCheck.rows.length > 0) {
        return res
          .status(400)
          .json({ error: "Ta nazwa użytkownika jest już zajęta" });
      }

      const userQuery = await pool.query(
        `UPDATE users 
       SET username = $1, bio = $2, avatar_url = $3 
       WHERE id = $4 
       RETURNING id, username, email, bio, avatar_url AS avatar, created_at`,
        [username, bio, avatarUrl, userId],
      );

      res.json({ message: "Profil zaktualizowany", user: userQuery.rows[0] });
    } catch (err) {
      console.error("Błąd bazy:", err);
      res.status(500).json({ error: err.message });
    }
  },
);

app.delete("/api/communities/:name", authenticateToken, async (req, res) => {
  const { name } = req.params;
  const userId = req.user.userId;

  try {
    const communityRes = await pool.query(
      "SELECT id, owner_id FROM communities WHERE LOWER(name) = LOWER($1)",
      [name],
    );

    if (communityRes.rows.length === 0)
      return res.status(404).json({ error: "Brak społeczności" });

    if (String(communityRes.rows[0].owner_id) !== String(userId)) {
      return res.status(403).json({ error: "Nie jesteś właścicielem!" });
    }

    await pool.query("DELETE FROM communities WHERE id = $1", [
      communityRes.rows[0].id,
    ]);
    res.json({ message: "Usunięto" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/tags", async (req, res) => {
  try {
    const result = await pool.query("SELECT name FROM tags ORDER BY name ASC");
    const tags = result.rows.map((row) => row.name);
    res.json(tags);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Błąd pobierania tagów z bazy" });
  }
});

app.post(
  "/api/communities",
  authenticateToken,
  upload.single("avatar"),
  async (req, res) => {
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
         VALUES ($1, $2, $3, $4) 
         RETURNING id`,
        [name, description, avatarUrl, userId],
      );

      const communityId = communityResult.rows[0].id;

      await client.query(
        `INSERT INTO community_members (community_id, user_id, role) 
         VALUES ($1, $2, 'owner')`,
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
    }
  },
);

app.post(
  "/api/leavecommunity",
  authenticateToken,
  express.json(),
  async (req, res) => {
    const client = await pool.connect();
    try {
      const { name } = req.body;
      const userId = req.user.userId;

      if (!name) {
        return res
          .status(400)
          .json({ error: "Brak nazwy społeczności w body." });
      }

      await client.query("BEGIN");

      const result = await client.query(
        "SELECT id FROM communities WHERE name = $1",
        [name],
      );

      if (result.rows.length === 0) {
        throw new Error("Społeczność o tej nazwie nie istnieje.");
      }

      const communityId = result.rows[0].id;

      await client.query(
        "DELETE FROM community_members WHERE community_id=$1 AND user_id=$2",
        [communityId, userId],
      );

      await client.query("COMMIT");

      res.status(200).json({
        message: "Opuściłeś społeczność!",
        communityId: communityId,
      });
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("Błąd API leavecommunity:", err.message);

      res.status(500).json({
        error: err.message,
      });
    } finally {
      client.release();
    }
  },
);

app.post(
  "/api/joincommunity",
  authenticateToken,
  express.json(),
  async (req, res) => {
    const client = await pool.connect();

    try {
      const { name } = req.body;
      const userId = req.user.userId;

      if (!name) {
        return res.status(400).json({ error: "Brak nazwy społeczności." });
      }

      await client.query("BEGIN");

      const communityRes = await client.query(
        `SELECT id, owner_id FROM communities WHERE name = $1`,
        [name],
      );

      if (communityRes.rows.length === 0) {
        throw new Error("Społeczność nie istnieje.");
      }

      const community = communityRes.rows[0];

      if (String(community.owner_id) === String(userId)) {
        return res.status(403).json({
          error: "Właściciel nie może dołączać do swojej społeczności",
        });
      }

      const check = await client.query(
        `SELECT 1 FROM community_members 
         WHERE community_id = $1 AND user_id = $2`,
        [community.id, userId],
      );

      if (check.rows.length > 0) {
        return res.status(400).json({
          error: "Już jesteś członkiem tej społeczności",
        });
      }

      await client.query(
        `INSERT INTO community_members (community_id, user_id) 
         VALUES ($1, $2)`,
        [community.id, userId],
      );

      await client.query("COMMIT");

      return res.json({ message: "Dołączono do społeczności!" });
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("JOIN error:", err);

      return res.status(500).json({ error: err.message });
    } finally {
      client.release();
    }
  },
);

const slugify = require("slugify");

app.post(
  "/api/addpost",
  authenticateToken,
  upload.single("image"),
  async (req, res) => {
    const client = await pool.connect();

    try {
      const { title, post, community_name } = req.body;
      const userId = req.user.userId;

      if (!title || !post || !community_name) {
        return res
          .status(400)
          .json({ error: "Tytuł, treść i nazwa społeczności są wymagane." });
      }

      let imageUrl = null;
      if (req.file) {
        imageUrl = `http://localhost:5000/uploads/${req.file.filename}`;
      }

      await client.query("BEGIN");

      const communityRes = await client.query(
        "SELECT id FROM communities WHERE name = $1",
        [community_name],
      );

      if (communityRes.rows.length === 0) {
        throw new Error("Społeczność nie istnieje.");
      }

      const communityId = communityRes.rows[0].id;

    
      const banCheck = await client.query(
        "SELECT 1 FROM users_banned WHERE user_id = $1 AND community_id = $2 AND is_active = true",
        [userId, communityId]
      );
      if (banCheck.rows.length > 0) {
        await client.query("ROLLBACK");
        return res.status(403).json({ error: "Nie możesz postować – masz bana." });
      }

      const baseSlug = slugify(title, { lower: true, strict: true });
      const uniqueSlug = `${baseSlug}-${Date.now()}`;

      const postResult = await client.query(
        `INSERT INTO posts (title, post, main_image_url, slug, user_id, community_id, is_spoiler) 
   VALUES ($1, $2, $3, $4, $5, $6, $7) 
   RETURNING id, slug`,
        [
          title,
          post,
          imageUrl,
          uniqueSlug,
          userId,
          communityId,
          req.body.is_spoiler === "true",
        ],
      );

      const newPostId = postResult.rows[0].id;

      if (req.body.tags) {
        const parsedTags = JSON.parse(req.body.tags);
        if (parsedTags.length > 0) {
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

      res.status(201).json({
        message: "Post został dodany!",
        postId: postResult.rows[0].id,
        slug: postResult.rows[0].slug,
      });
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("Błąd dodawania posta:", err);
      res.status(500).json({ error: err.message });
    } finally {
      client.release();
    }
  },
);

app.get("/api/communities/:name/posts", async (req, res) => {
  try {
    const { name } = req.params;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    let userId = null;

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded.userId;
      } catch (err) {
        console.log("Nieprawidłowy token, traktuję jako gościa");
      }
    }

    if (userId) {
      const banCheck = await pool.query(
        `SELECT id FROM users_banned 
         WHERE user_id = $1 
         AND community_id = (SELECT id FROM communities WHERE name ILIKE $2)
         AND is_active = true 
         AND (expires_at IS NULL OR expires_at > NOW())`,
        [userId, name],
      );

      if (banCheck.rows.length > 0) {
        return res.status(403).json({
          error: "Jesteś zbanowany w tej społeczności.",
          isBanned: true,
        });
      }
    }

    const posts = await pool.query(
      `SELECT 
        p.id, p.title, p.post as text, p.main_image_url as image, 
        p.created_at, p.slug, p.upvotes_count, p.comments_count,
        u.username, u.avatar_url as author_avatar
       FROM posts p
       JOIN communities c ON p.community_id = c.id
       LEFT JOIN users u ON p.user_id = u.id
       WHERE c.name ILIKE $1 AND p.deleted_at IS NULL
       ORDER BY p.created_at DESC
       LIMIT $2 OFFSET $3`,
      [name, limit, offset],
    );

    res.json(posts.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Błąd serwera podczas pobierania postów" });
  }
});

app.get("/api/homefeed", async (req, res) => {
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
});

app.get("/api/communities/:name/posts", async (req, res) => {
  try {
    const { name } = req.params;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    const userId = req.user?.userId;

    if (userId) {
      const banCheck = await pool.query(
        `SELECT id FROM users_banned 
         WHERE user_id = $1 
         AND community_id = (SELECT id FROM communities WHERE name ILIKE $2)
         AND is_active = true 
         AND (expires_at IS NULL OR expires_at > NOW())`,
        [userId, name],
      );
      if (banCheck.rows.length > 0) {
        return res
          .status(403)
          .json({ error: "Jesteś zbanowany.", isBanned: true });
      }
    }

    const posts = await pool.query(
      `SELECT 
        p.id, p.title, p.post as text, p.main_image_url as image, 
        p.created_at, p.slug, u.username, u.avatar_url as author_avatar,
        p.upvotes_count AS upvotes, 
        p.comments_count AS comments,
        COALESCE(v.value, 0) AS "userVoteValue"
       FROM posts p
       JOIN communities c ON p.community_id = c.id
       LEFT JOIN users u ON p.user_id = u.id
       LEFT JOIN votes v ON v.post_id = p.id AND v.user_id = $4
       WHERE c.name ILIKE $1 AND p.deleted_at IS NULL
       ORDER BY p.created_at DESC
       LIMIT $2 OFFSET $3`,
      [name, limit, offset, userId || null],
    );

    res.json(posts.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Błąd serwera" });
  }
});

app.post("/api/posts/:postId/vote", authenticateToken, async (req, res) => {
  const { postId } = req.params;
  const { value } = req.body; // Może być -1, 0, 1
  const userId = req.user.userId;

  try {
    await pool.query("BEGIN");

    const oldVoteRes = await pool.query(
      "SELECT value FROM votes WHERE user_id = $1 AND post_id = $2",
      [userId, postId],
    );
    const oldValue = oldVoteRes.rows.length > 0 ? oldVoteRes.rows[0].value : 0;

    if (value === 0) {
      await pool.query(
        "DELETE FROM votes WHERE user_id = $1 AND post_id = $2",
        [userId, postId],
      );
    } else {
      await pool.query(
        `INSERT INTO votes (user_id, post_id, value) 
         VALUES ($1, $2, $3) 
         ON CONFLICT (user_id, post_id) 
         DO UPDATE SET value = EXCLUDED.value`,
        [userId, postId, value],
      );
    }

    const diff = value - oldValue;

    if (diff !== 0) {
      await pool.query(
        "UPDATE posts SET upvotes_count = COALESCE(upvotes_count, 0) + $1 WHERE id = $2",
        [diff, postId],
      );
    }

    await pool.query("COMMIT");
    res.status(200).json({ message: "Głos zapisany", currentVote: value });
  } catch (err) {
    await pool.query("ROLLBACK");
    console.error("BŁĄD SQL VOTE:", err.message); // <--- Zobacz to w terminalu!
    res.status(500).json({ error: "Błąd bazy danych" });
  }
});

app.post("/api/reports", authenticateToken, async (req, res) => {
  // 1. Dodajemy 'description' do wyciąganych danych z body
  const { post_id, rule_id, community_id, description } = req.body;
  const reporter_id = req.user.userId;

  try {
    const postRes = await pool.query(
      "SELECT user_id FROM posts WHERE id = $1",
      [post_id],
    );

    if (postRes.rows.length === 0) {
      return res.status(404).json({ error: "Post nie istnieje" });
    }

    const reported_user_id = postRes.rows[0].user_id;

    // 2. Aktualizujemy zapytanie INSERT o kolumnę 'description' ($6)
    // Używamy || null, żeby mieć pewność, że jeśli pole jest puste, do bazy trafi NULL
    await pool.query(
      `INSERT INTO reports (reporter_id, post_id, reported_user_id, rule_id, community_id, description, status) 
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')`,
      [
        reporter_id, 
        post_id, 
        reported_user_id, 
        rule_id || null,      // Ważne: null jeśli wybrano "Inne"
        community_id, 
        description || null   // Ważne: tekst zgłoszenia
      ],
    );

    res.status(201).json({ message: "Zgłoszenie zostało wysłane" });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Błąd serwera podczas wysyłania zgłoszenia" });
  }
});

app.get("/api/communities/:name", async (req, res) => {
  try {
    const { name } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    const cursor = req.query.cursor;

    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    let userId = null;

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded.userId;
      } catch (e) {}
    }

    const communityRes = await pool.query(
      "SELECT id, name, description, avatar_url, created_at, owner_id FROM communities WHERE name ILIKE $1",
      [name],
    );

    if (communityRes.rows.length === 0)
      return res.status(404).json({ error: "Brak społeczności" });
    const community = communityRes.rows[0];

    // --- DODAJ TO: Blokada dla zbanowanych ---
    if (userId) {
      const banCheck = await pool.query(
        "SELECT 1 FROM users_banned WHERE user_id = $1 AND community_id = $2 AND is_active = true",
        [userId, community.id]
      );
      if (banCheck.rows.length > 0) {
        return res.status(403).json({ error: "Jesteś zbanowany w tej społeczności.", isBanned: true });
      }
    }

    let postsQuery = `
      SELECT 
        p.id, p.title, p.post AS text, p.main_image_url AS image, 
        p.upvotes_count AS upvotes, p.comments_count AS comments,
        p.is_spoiler, p.created_at,
        u.username AS "userName", u.avatar_url AS "avatarPath",
        COALESCE(v.value, 0) AS "userVoteValue"
      FROM posts p
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN votes v ON v.post_id = p.id AND v.user_id = $2
      WHERE p.community_id = $1
    `;

    const rulesRes = await pool.query(
      "SELECT id, rule_title, description FROM rules WHERE community_id = $1",
      [community.id],
    );

    const params = [community.id, userId];

    if (cursor) {
      postsQuery += ` AND p.created_at < $3`;
      params.push(cursor);
    }

    postsQuery += ` ORDER BY p.created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const postsRes = await pool.query(postsQuery, params);

    const formattedPosts = postsRes.rows.map((p) => ({
      ...p,
      avatarPath: p.avatarPath || "/img/pepe_placeholder.png",
      createdAt: p.created_at,
      displayDate: new Date(p.created_at).toLocaleDateString(),
      tags: [],
      userVoteValue: parseInt(p.userVoteValue),
    }));

    const nextCursor =
      postsRes.rows.length === limit
        ? postsRes.rows[postsRes.rows.length - 1].created_at
        : null;

    res.json({
      ...community,
      posts: formattedPosts,
      nextCursor: nextCursor,
      rules: rulesRes.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Błąd serwera" });
  }
});
