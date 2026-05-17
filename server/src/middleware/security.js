const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const prisma = require("../config/prisma");

const waf = helmet();

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Zbyt wiele zapytań, spróbuj później.",
});

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 100,
  handler: (req, res) => {
    res.status(429).json({
      error: "Limit prób logowania wyczerpany. Spróbuj ponownie za godzinę.",
    });
  },
});

const checkCommunityPermission = (requiredPermission = null) => {
  return async (req, res, next) => {
    const { communityId } = req.params;
    const userId = req.user.id;

    if (!communityId) {
      return res
        .status(400)
        .json({ error: "Brak identyfikatora społeczności" });
    }

    try {
      const member = await prisma.community_members.findFirst({
        where: {
          community_id: communityId,
          user_id: userId,
        },
      });

      if (!member) {
        return res
          .status(403)
          .json({ error: "Nie jesteś członkiem tej społeczności" });
      }

      if (member.role === "owner") return next();

      if (!requiredPermission) {
        if (
          member.can_delete_posts ||
          member.can_ban_users ||
          member.can_manage_mods
        ) {
          return next();
        }
        return res
          .status(403)
          .json({ error: "Brak uprawnień moderacyjnych w tej społeczności" });
      }

      if (member[requiredPermission] === true) return next();

      return res
        .status(403)
        .json({ error: "Brak wymaganych uprawnień do tej akcji" });
    } catch (err) {
      console.error("Błąd w checkCommunityPermission:", err);
      return res
        .status(500)
        .json({ error: "Błąd serwera podczas weryfikacji uprawnień" });
    }
  };
};
module.exports = { waf, globalLimiter, authLimiter, checkCommunityPermission };
