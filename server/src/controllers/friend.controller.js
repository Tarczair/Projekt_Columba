const prisma = require("../config/prisma");
const pool = require("../config/db");

exports.getFriends = async (req, res) => {
  try {
    const userId = req.user.userId;

    const friendships = await prisma.friendships.findMany({
      where: {
        status: "accepted",
        OR: [{ user_id_1: userId }, { user_id_2: userId }],
      },
      include: {
        users_friendships_user_id_1Tousers: {
          select: { id: true, username: true, avatar_url: true },
        },
        users_friendships_user_id_2Tousers: {
          select: { id: true, username: true, avatar_url: true },
        },
      },
    });

    const friends = friendships.map((f) => {
      const u1 = f.users_friendships_user_id_1Tousers;
      const u2 = f.users_friendships_user_id_2Tousers;
      return f.user_id_1 === userId ? u2 : u1;
    });

    res.json(friends);
  } catch (err) {
    console.error("Błąd pobierania znajomych:", err);
    res
      .status(500)
      .json({ error: "Wystąpił błąd podczas pobierania listy znajomych." });
  }
};

exports.getInvites = async (req, res) => {
  try {
    const userId = req.user.userId;

    const invites = await prisma.friendships.findMany({
      where: {
        user_id_2: userId,
        status: "pending",
      },
      include: {
        users_friendships_user_id_1Tousers: {
          select: { id: true, username: true, avatar_url: true },
        },
      },
    });

    const formattedInvites = invites.map((invite) => ({
      friendship_id: invite.id,
      id: invite.users_friendships_user_id_1Tousers.id,
      username: invite.users_friendships_user_id_1Tousers.username,
      avatar_url: invite.users_friendships_user_id_1Tousers.avatar_url,
    }));

    res.json(formattedInvites);
  } catch (err) {
    console.error("Błąd pobierania zaproszeń:", err);
    res.status(500).json({ error: "Błąd podczas pobierania zaproszeń." });
  }
};

exports.respondInvite = async (req, res) => {
  const friendshipId = req.body.friendshipId || req.body.friendship_id;
  let status = req.body.status || req.body.action;

  if (!friendshipId) {
    return res.status(400).json({ error: "Brak ID zaproszenia w żądaniu." });
  }

  if (status === "accept" || status === "accepted") status = "accepted";
  if (status === "reject" || status === "refuse" || status === "rejected")
    status = "rejected";

  try {
    const friendship = await prisma.friendships.findUnique({
      where: { id: friendshipId },
    });

    if (!friendship) {
      return res
        .status(404)
        .json({ error: "Nie znaleziono takiego zaproszenia." });
    }

    if (status === "rejected") {
      await prisma.friendships.delete({
        where: { id: friendshipId },
      });
      return res.json({
        success: true,
        message: "Zaproszenie zostało odrzucone.",
      });
    }

    if (status === "accepted") {
      await prisma.friendships.update({
        where: { id: friendshipId },
        data: { status: "accepted" },
      });
      return res.json({
        success: true,
        message: "Zaproszenie zostało zaakceptowane.",
      });
    }

    return res.status(400).json({ error: `Nieobsługiwany status: ${status}` });
  } catch (err) {
    console.error("BŁĄD RESPOND_INVITE:", err);
    return res.status(500).json({ error: err.message || "Błąd serwera." });
  }
};

exports.sendFriendRequest = async (req, res) => {
  try {
    const userId1 = req.user.userId;
    let userId2 = req.body.userId2 || null;
    const usernameParam = req.params.username;

    if (!userId2 && usernameParam) {
      const targetUser = await prisma.users.findUnique({
        where: { username: usernameParam },
        select: { id: true },
      });
      if (targetUser) {
        userId2 = targetUser.id;
      }
    }

    if (!userId2) {
      return res.status(400).json({
        error: "Brak lub niepoprawne ID użytkownika, którego chcesz zaprosić.",
      });
    }

    if (userId1 === userId2) {
      return res
        .status(400)
        .json({ error: "Nie możesz zaprosić samego siebie." });
    }

    const existingFriendship = await prisma.friendships.findFirst({
      where: {
        OR: [
          { user_id_1: userId1, user_id_2: userId2 },
          { user_id_1: userId2, user_id_2: userId1 },
        ],
      },
    });

    if (existingFriendship) {
      if (existingFriendship.status === "pending") {
        if (existingFriendship.user_id_1 === userId1) {
          await prisma.friendships.delete({
            where: { id: existingFriendship.id },
          });
          return res.json({ friendshipStatus: "none" });
        } else {
          await prisma.friendships.update({
            where: { id: existingFriendship.id },
            data: { status: "accepted" },
          });
          return res.json({ friendshipStatus: "friends" });
        }
      } else if (existingFriendship.status === "accepted") {
        await prisma.friendships.delete({
          where: { id: existingFriendship.id },
        });
        return res.json({ friendshipStatus: "none" });
      }
    }

    const newFriendship = await prisma.friendships.create({
      data: {
        user_id_1: userId1,
        user_id_2: userId2,
        status: "pending",
      },
    });

    res.json({ ...newFriendship, friendshipStatus: "request_sent" });
  } catch (err) {
    console.error("Błąd podczas wysyłania zaproszenia:", err);
    res.status(500).json({ error: "Wystąpił błąd serwera." });
  }
};
