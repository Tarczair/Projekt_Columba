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
    // 1. Szukamy użytkownika po mailu lub loginie
    const userResult = await pool.query(
      "SELECT * FROM users WHERE email = $1 OR username = $1",
      [identity],
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: "Nieprawidłowe dane logowania" });
    }

    const user = userResult.rows[0];

    // 2. Sprawdzamy hasło
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: "Nieprawidłowe dane logowania" });
    }

    // 3. Generujemy token JWT
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

// 1. Middleware do weryfikacji tokena
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Wyciąga "TOKEN" z "Bearer TOKEN"

  if (!token) return res.status(401).json({ error: "Brak dostępu" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Token nieważny" });
    req.user = user; // Tu mamy userId zdekodowany z tokena
    next();
  });
};

// 2. Endpoint profilu
app.get("/api/me", authenticateToken, async (req, res) => {
  try {
    // Pobieramy dane użytkownika
    const userQuery = await pool.query(
      "SELECT id, username, email, bio, avatar_url as avatar, created_at FROM users WHERE id = $1",
      [req.user.userId],
    );

    if (userQuery.rows.length === 0)
      return res.status(404).json({ error: "Nie ma takiego użytkownika" });

    const userData = userQuery.rows[0];

    // Pobieramy społeczności, do których należy (uproszczony przykład)
    const commsQuery = await pool.query(
      "SELECT c.id, c.name, c.avatar_url as avatar FROM communities c JOIN community_members cm ON c.id = cm.community_id WHERE cm.user_id = $1",
      [req.user.userId],
    );

    res.json({
      ...userData,
      communities: commsQuery.rows,
      posts: [], // Tu możesz dopisać query do postów analogicznie
      createdCommunities: [], // Tu query do owned_id
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
