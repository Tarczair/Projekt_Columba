const pool = require("../config/db");
const prisma = require("../config/prisma");

exports.getMe = async (req, res) => {
  try {
    const userId = req.user.userId;

    const userQuery = await pool.query(
      "SELECT id, username, email, bio, avatar_url as avatar, created_at FROM users WHERE id = $1",
      [userId],
    );

    if (userQuery.rows.length === 0)
      return res.status(404).json({ error: "Nie ma takiego użytkownika" });

    const userData = userQuery.rows[0];

    const commsQuery = await pool.query(
      `SELECT c.id, c.name, c.avatar_url as avatar 
       FROM communities c 
       JOIN community_members cm ON c.id = cm.community_id 
       WHERE cm.user_id = $1 AND c.owner_id != $1
         AND NOT EXISTS (
           SELECT 1 FROM users_banned ub 
           WHERE ub.community_id = c.id AND ub.user_id = $1 
             AND ub.is_active = true 
             AND (ub.expires_at IS NULL OR ub.expires_at > NOW())
         )`,
      [userId],
    );

    const postsQuery = await pool.query(
      `SELECT p.id, c.name AS "communityName", p.title, p.created_at AS "createdAt", 
              p.comments_count AS "comments", p.upvotes_count AS "upvotes", c.avatar_url AS "communityAvatar" 
       FROM posts p JOIN communities c ON c.id = p.community_id WHERE p.user_id = $1`,
      [userId],
    );

    const createdCommsQuery = await pool.query(
      "SELECT c.id, c.name, c.avatar_url as avatar FROM communities c WHERE c.owner_id = $1",
      [userId],
    );

    res.json({
      ...userData,
      communities: commsQuery.rows,
      posts: postsQuery.rows,
      createdCommunities: createdCommsQuery.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getUserProfile = async (req, res) => {
  const { username } = req.params;
  const currentUserId = req.user.userId;

  try {
    const userRes = await pool.query(
      "SELECT id, username, bio, avatar_url, created_at FROM users WHERE username ILIKE $1",
      [username],
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: "Użytkownik nie znaleziony" });
    }

    const targetUser = userRes.rows[0];

    const friendRes = await pool.query(
      `SELECT * FROM friendships 
       WHERE (user_id_1 = $1 AND user_id_2 = $2) 
          OR (user_id_1 = $2 AND user_id_2 = $1)`,
      [currentUserId, targetUser.id],
    );

    let friendshipStatus = "none";

    if (String(currentUserId) === String(targetUser.id)) {
      friendshipStatus = "self";
    } else if (friendRes.rows.length > 0) {
      const f = friendRes.rows[0];

      if (f.status === "accepted") {
        friendshipStatus = "friends";
      } else if (f.status === "pending") {
        friendshipStatus =
          String(f.user_id_1) === String(currentUserId)
            ? "request_sent"
            : "request_received";
      }
    }

    res.json({
      id: targetUser.id,
      username: targetUser.username,
      bio: targetUser.bio,
      avatar: targetUser.avatar_url,
      created_at: targetUser.created_at,
      friendshipStatus: friendshipStatus,
      communities: [],
      posts: [],
      createdCommunities: [],
    });
  } catch (err) {
    console.error("Błąd GET profile:", err);
    res.status(500).json({ error: "Błąd serwera" });
  }
};

exports.toggleFriendship = async (req, res) => {
  try {
    const currentUserId = Number(req.user.userId);
    const { username } = req.params;

    // 1. Znajdź użytkownika, którego profil przeglądamy
    const targetUser = await prisma.users.findUnique({
      where: { username: username },
    });

    if (!targetUser) {
      return res.status(404).json({ error: "Nie znaleziono użytkownika." });
    }

    const targetUserId = Number(targetUser.id);

    if (currentUserId === targetUserId) {
      return res.status(400).json({ friendshipStatus: "self" });
    }

    // 2. Sprawdź, czy relacja (zaproszenie/znajomość) już istnieje
    const existingFriendship = await prisma.friendships.findFirst({
      where: {
        OR: [
          { user_id_1: currentUserId, user_id_2: targetUserId },
          { user_id_1: targetUserId, user_id_2: currentUserId },
        ],
      },
    });

    // 3. Jeśli relacja istnieje – usuwamy ją (cofnięcie zaproszenia / usunięcie ze znajomych)
    if (existingFriendship) {
      await prisma.friendships.delete({
        where: { id: existingFriendship.id },
      });
      return res.json({ friendshipStatus: "none" });
    }

    // 4. Jeśli relacja nie istnieje – tworzymy nowe zaproszenie
    else {
      await prisma.friendships.create({
        data: {
          user_id_1: currentUserId,
          user_id_2: targetUserId,
          status: "pending",
        },
      });
      return res.json({ friendshipStatus: "request_sent" });
    }
  } catch (err) {
    console.error("Błąd w toggleFriendship:", err);
    res.status(500).json({ error: "Wystąpił błąd serwera." });
  }
};

exports.updateProfile = async (req, res) => {
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
       SET username = $1, bio = $2, avatar_url = $3, 
           search_vector = setweight(to_tsvector('simple', COALESCE($1, '')), 'A') || setweight(to_tsvector('simple', COALESCE($2, '')), 'B')
       WHERE id = $4 
       RETURNING id, username, email, bio, avatar_url AS avatar, created_at`,
      [username, bio, avatarUrl, userId],
    );

    res.json({ message: "Profil zaktualizowany", user: userQuery.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
