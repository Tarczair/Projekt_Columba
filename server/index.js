const express = require("express");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const app = express();

const JWT_SECRET = process.env.JWT_SECRET || "twoj_bardzo_tajny_klucz_123";

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

app.listen(5000, "0.0.0.0", () => {
  console.log("Serwer Node śmiga na porcie 5000");
});

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

app.get("/api/me", authenticateToken, async (req, res) => {
  try {
    const userQuery = await pool.query(
      "SELECT id, username, email, bio, avatar_url as avatar, created_at FROM users WHERE id = $1",
      [req.user.userId],
    );

    if (userQuery.rows.length === 0)
      return res.status(404).json({ error: "Nie ma takiego użytkownika" });

    const userData = userQuery.rows[0];

    //Pobieramy społeczności, do których należy (uproszczony przykład)
    const commsQuery = await pool.query(
      "SELECT c.id, c.name, c.avatar_url as avatar FROM communities c JOIN community_members cm ON c.id = cm.community_id WHERE cm.user_id = $1",
      [req.user.userId],
    );

    res.json({
      ...userData,
      communities: commsQuery.rows,
      posts: [],
      createdCommunities: [],
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

app.get("/api/communities/:name", async (req, res) => {
  try {
    const { name } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    const cursor = req.query.cursor; // To będzie data (ISO string) ostatniego posta

    // 1. Pobierz dane społeczności
    const communityRes = await pool.query(
      "SELECT id, name, description, avatar_url, created_at, owner_id FROM communities WHERE name ILIKE $1",
      [name],
    );

    if (communityRes.rows.length === 0)
      return res.status(404).json({ error: "Brak społeczności" });
    const community = communityRes.rows[0];

    // 2. Budowanie zapytania o posty z kursorem
    let postsQuery = `
      SELECT 
        p.id, p.title, p.post AS text, p.main_image_url AS image, 
        p.upvotes_count AS upvotes, p.comments_count AS comments,
        p.is_spoiler, p.created_at,
        u.username AS "userName", u.avatar_url AS "avatarPath"
      FROM posts p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.community_id = $1
    `;

    const rulesRes = await pool.query(
      "SELECT rule_title, description FROM rules WHERE community_id = $1",
      [community.id],
    );

    const params = [community.id];

    if (cursor) {
      // Pobieramy tylko posty STARSZE niż kursor
      postsQuery += ` AND p.created_at < $2`;
      params.push(cursor);
    }

    postsQuery += ` ORDER BY p.created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const postsRes = await pool.query(postsQuery, params);

    // 3. Formatowanie wyników
    const formattedPosts = postsRes.rows.map((p) => ({
      ...p,
      avatarPath: p.avatarPath || "/img/pepe_placeholder.png",
      createdAt: p.created_at, // Wysyłamy surową datę do kursora
      displayDate: new Date(p.created_at).toLocaleDateString(), // A tę do wyświetlenia
      tags: [],
    }));

    // Wyznaczamy nowy kursor (data utworzenia ostatniego pobranego posta)
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

app.delete("/api/communities/:name", async (req, res) => {
  const { name } = req.params;

  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Brak tokena" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    const communityRes = await pool.query(
      `SELECT id, owner_id 
       FROM communities 
       WHERE LOWER(name) = LOWER($1)`,
      [name],
    );

    if (communityRes.rows.length === 0) {
      return res.status(404).json({ error: "Nie ma takiej społeczności" });
    }

    const community = communityRes.rows[0];

    // WAŻNE: owner_id vs userId z JWT
    if (String(community.owner_id) !== String(decoded.userId)) {
      return res.status(403).json({ error: "Tylko właściciel może to zrobić" });
    }

    await pool.query(`DELETE FROM communities WHERE id = $1`, [community.id]);

    return res.json({ message: "Społeczność usunięta pomyślnie" });
  } catch (err) {
    console.error("DELETE community error:", err);

    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Nieprawidłowy token" });
    }

    return res.status(500).json({ error: err.message });
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

      // 1. znajdź community
      const communityRes = await client.query(
        `SELECT id, owner_id FROM communities WHERE name = $1`,
        [name],
      );

      if (communityRes.rows.length === 0) {
        throw new Error("Społeczność nie istnieje.");
      }

      const community = communityRes.rows[0];

      // 🔥 2. BLOKADA: owner NIE MOŻE DOŁĄCZAĆ
      if (String(community.owner_id) === String(userId)) {
        return res.status(403).json({
          error: "Właściciel nie może dołączać do swojej społeczności",
        });
      }

      // 3. sprawdź czy już jest członkiem (opcjonalnie ale polecam)
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

      // 4. insert
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

    // Pobieramy posty dołączając dane autora
    const posts = await pool.query(
      `SELECT 
        p.id, p.title, p.post as text, p.main_image_url as image, 
        p.created_at, p.slug, u.username, u.avatar_url as author_avatar
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
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/homefeed", async (req, res) => {
  try {
    // Zwraca do 10 społeczności, a z każdej najnowszy post (o ile istnieje)
    const result = await pool.query(`
      SELECT 
        c.id AS community_id,
        c.owner_id,
        c.name AS community_name, 
        c.avatar_url AS community_avatar,
        p.id AS post_id, 
        p.title, 
        p.post AS text, 
        p.main_image_url AS image, 
        p.created_at, 
        p.is_spoiler,
        u.username AS user_name, 
        u.avatar_url AS author_avatar
      FROM communities c
      JOIN LATERAL (
          SELECT * FROM posts 
          WHERE community_id = c.id 
          ORDER BY created_at DESC 
          LIMIT 1
      ) p ON true
      LEFT JOIN users u ON p.user_id = u.id
      ORDER BY RANDOM() 
      LIMIT 10;
    `);

    const feedData = result.rows.map((row) => ({
      communityId: row.community_id,
      owner_id: row.owner_id,

      communityName: row.community_name,
      avatar: row.community_avatar || "/img/pepe_placeholder.png",
      post: {
        id: row.post_id,
        avatarPath: row.author_avatar || "/img/pepe_placeholder.png",
        userName: row.user_name || "Anonim",
        title: row.title,
        text: row.text,
        tags: [],
        image: row.image || "",
        upvotes: 0,
        isRemoved: false,
        createdAt: new Date(row.created_at).toLocaleDateString(),
        comments: 0,
      },
    }));

    res.json(feedData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Błąd ładowania homefeed" });
  }
});
