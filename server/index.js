const express = require("express");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const app = express();

const JWT_SECRET = process.env.JWT_SECRET || "twoj_bardzo_tajny_klucz_123";

app.use(cors());
app.use(express.json());

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

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: "24h" },
    );

    res.json({
      message: "Zalogowano pomyślnie!",
      token: token,
      user: { id: user.id, username: user.username },
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

app.use("/uploads", express.static("uploads"));

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

    const community = await pool.query(
      "SELECT * FROM communities WHERE name ILIKE $1",
      [name],
    );

    if (community.rows.length === 0)
      return res.status(404).json({ error: "Brak" });

    const communityId = community.rows[0].id;

    const rules = await pool.query(
      "SELECT rule_title, description FROM rules WHERE community_id = $1",
      [communityId],
    );

    const tags = await pool.query(
      "SELECT name FROM tags WHERE community_id = $1",
      [communityId],
    );

    res.json({
      ...community.rows[0],
      rules: rules.rows,
      tags: tags.rows.map((t) => t.name),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
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
        for (const tag of tags) {
          const tagName = typeof tag === "string" ? tag : tag.name;

          await client.query(
            `INSERT INTO tags (community_id, name) 
             VALUES ($1, $2)`,
            [communityId, tagName],
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
