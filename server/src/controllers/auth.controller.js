const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "twoj_bardzo_tajny_klucz_123";

exports.register = async (req, res) => {
  const { email, username, password } = req.body;
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = await pool.query(
      `INSERT INTO users (email, username, password_hash, search_vector) 
       VALUES ($1, $2, $3, to_tsvector('simple', $2)) RETURNING id, username, email`,
      [email, username, hashedPassword],
    );
    res
      .status(201)
      .json({ message: "Użytkownik stworzony!", user: newUser.rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Błąd rejestracji (możliwe zajęte dane)" });
  }
};

exports.login = async (req, res) => {
  const { identity, password } = req.body;
  try {
    const userResult = await pool.query(
      "SELECT * FROM users WHERE email = $1 OR username = $1",
      [identity],
    );
    if (userResult.rows.length === 0)
      return res.status(401).json({ error: "Nieprawidłowe dane" });

    const user = userResult.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(401).json({ error: "Nieprawidłowe dane" });

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: "24h" },
    );
    res.json({ token, user: { id: user.id, username: user.username } });
  } catch (err) {
    res.status(500).json({ error: "Błąd serwera" });
  }
};
