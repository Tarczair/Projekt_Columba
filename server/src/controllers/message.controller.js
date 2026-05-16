const pool = require("../config/db");
const prisma = require("../config/prisma");

exports.sendMessage = async (req, res) => {
  const content = req.body.content;
  const conversationId = req.body.conversationId || req.body.conversation_id;
  const senderId = req.user.userId;

  if (!conversationId) {
    return res.status(400).json({ error: "Brak wymaganych pól wiadomości." });
  }

  try {
    const newMessage = await prisma.messages.create({
      data: {
        sender_id: senderId,
        conversation_id: conversationId,
        content: content || "",
        media: req.file
          ? {
              create: {
                user_id: senderId,
                url: `http://localhost:5000/uploads/${req.file.filename}`,
                type: req.file.mimetype,
              },
            }
          : undefined,
      },
      include: {
        users: { select: { username: true } },
        media: { select: { url: true, type: true } },
      },
    });

    const formattedMessage = {
      id: newMessage.id,
      sender_id: String(newMessage.sender_id),
      conversation_id: String(newMessage.conversation_id),
      content: newMessage.content,
      created_at: newMessage.created_at,
      sender_name: newMessage.users?.username || "Nieznany Użytkownik",
      media: newMessage.media[0] || null,
    };

    const io = req.app.get("socketio");
    if (io) {
      io.to(`room_${conversationId}`).emit("receiveMessage", formattedMessage);

      const participant = await prisma.conversation_participants.findFirst({
        where: {
          conversation_id: conversationId,
          NOT: { user_id: senderId },
        },
        select: { user_id: true },
      });

      if (participant?.user_id) {
        io.to(String(participant.user_id)).emit(
          "receiveMessage",
          formattedMessage,
        );
      }
    }

    return res.json(formattedMessage);
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ error: "Błąd podczas zapisu i wysyłania wiadomości." });
  }
};

exports.getConversationByFriendId = async (req, res) => {
  const userId = req.user.userId;
  const { friendId } = req.params;

  try {
    const participant = await prisma.conversation_participants.findFirst({
      where: {
        user_id: userId,
        conversations: {
          conversation_participants: {
            some: {
              user_id: friendId,
            },
          },
          type: "dm",
        },
      },
      select: {
        conversation_id: true,
      },
    });

    let conversationId;

    if (!participant) {
      const newConv = await prisma.conversations.create({
        data: {
          type: "dm",
          conversation_participants: {
            create: [{ user_id: userId }, { user_id: friendId }],
          },
        },
      });
      conversationId = newConv.id;
    } else {
      conversationId = participant.conversation_id;
    }

    const messages = await prisma.messages.findMany({
      where: {
        conversation_id: conversationId,
      },
      include: {
        users: {
          select: { username: true },
        },
        media: {
          select: { url: true, type: true },
        },
      },
      orderBy: {
        created_at: "asc",
      },
    });

    const formattedMessages = messages.map((m) => ({
      id: m.id,
      sender_id: String(m.sender_id),
      conversation_id: String(m.conversation_id),
      content: m.content,
      created_at: m.created_at,
      sender_name: m.users?.username || "Nieznany Użytkownik",
      media: m.media[0] || null,
    }));

    res.json({
      conversation_id: conversationId,
      messages: formattedMessages,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Nie udało się otworzyć konwersacji." });
  }
};
