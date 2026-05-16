const router = require("express").Router();
const { verifyToken } = require("../middleware/auth");
const { authLimiter } = require("../middleware/security");
const upload = require("../middleware/upload");

const lazy = (path, method) => (req, res, next) => {
  const ctrl = require(path);
  if (ctrl && typeof ctrl[method] === "function")
    return ctrl[method](req, res, next);
  res.status(501).json({ error: `Metoda ${method} nie istnieje.` });
};

const [AUTH, USER, POST, COMM, FRIEND, MSG] = [
  "../controllers/auth.controller",
  "../controllers/user.controller",
  "../controllers/post.controller",
  "../controllers/community.controller",
  "../controllers/friend.controller",
  "../controllers/message.controller",
];

const fallback = (req, res) =>
  res.json({ success: true, message: "Placeholder" });

router.get("/search", lazy(POST, "search"));
router.get("/tags", lazy(COMM, "getTags"));
router.get("/homefeed", lazy(POST, "getHomeFeed"));

router.post("/login", authLimiter, lazy(AUTH, "login"));
router.post("/register", authLimiter, lazy(AUTH, "register"));
router.get("/me", verifyToken, lazy(USER, "getMe"));
router.put(
  "/user/update",
  verifyToken,
  upload.single("avatar"),
  lazy(USER, "updateProfile"),
);

router.post("/reports", verifyToken, lazy(POST, "reportPost"));

router.post(
  "/createcommunity",
  verifyToken,
  upload.single("avatar"),
  lazy(COMM, "createCommunity"),
);
router.post("/joincommunity", verifyToken, lazy(COMM, "joinCommunity"));
router.post("/leavecommunity", verifyToken, lazy(COMM, "leaveCommunity"));

router.get("/friends", verifyToken, lazy(FRIEND, "getFriends"));
router.get("/friends/invites", verifyToken, lazy(FRIEND, "getInvites"));
router.post("/friends/respond", verifyToken, lazy(FRIEND, "respondInvite"));
router.post("/friends/invite", verifyToken, lazy(FRIEND, "sendFriendRequest"));

router.post(
  "/friends/accept",
  verifyToken,
  lazy(FRIEND, "acceptFriendRequest"),
);
router.post(
  "/friends/reject",
  verifyToken,
  lazy(FRIEND, "rejectFriendRequest"),
);

router.get(
  "/conversations/friend/:friendId",
  verifyToken,
  lazy(MSG, "getConversationByFriendId"),
);
router.get("/messages/:conversationId", verifyToken, lazy(MSG, "getMessages"));
router.post("/messages", verifyToken, lazy(MSG, "sendMessage"));
router.post(
  "/messages/send",
  verifyToken,
  upload.single("media"),
  lazy(MSG, "sendMessage"),
);

router.post(
  "/addpost",
  verifyToken,
  upload.single("image"),
  lazy(POST, "addPost"),
);
router.post("/posts/:postId/vote", verifyToken, lazy(POST, "vote"));
router.delete("/posts/:postId", verifyToken, lazy(POST, "deletePost"));

router.post(
  "/posts/:postId/comments",
  verifyToken,
  lazy(POST, "createComment"),
);
router.get("/posts/:postId/comments", lazy(POST, "getComments"));
router.post(
  "/comments/:commentId/vote",
  verifyToken,
  lazy(POST, "voteComment"),
);
router.delete("/comments/:commentId", verifyToken, lazy(POST, "deleteComment"));

router.get("/communities-by-id/:communityId", lazy(COMM, "getCommunityById"));
router.put(
  "/communities-by-id/:communityId",
  verifyToken,
  upload.single("avatar"),
  lazy(COMM, "updateCommunity"),
);
router.delete(
  "/communities-by-id/:communityId",
  verifyToken,
  lazy(COMM, "deleteCommunity"),
);

router.get("/users/:username", verifyToken, lazy(USER, "getUserProfile"));

router.post(
  "/users/:username/friend",
  verifyToken,
  lazy(FRIEND, "sendFriendRequest"),
);

router.get(
  "/communities-by-id/:communityId/members",
  verifyToken,
  lazy(COMM, "getMembers"),
);
router.post(
  "/communities-by-id/:communityId/members/:userId/permissions",
  verifyToken,
  lazy(COMM, "updateMemberPermissions"),
);
router.delete(
  "/communities-by-id/:communityId/members/:userId/permissions",
  verifyToken,
  lazy(COMM, "updateMemberPermissions"),
);
router.post(
  "/communities/:communityId/:action",
  verifyToken,
  lazy(COMM, "handleToggleBan"),
);
router.get(
  "/communities-by-id/:communityId/reports",
  verifyToken,
  lazy(COMM, "getReports"),
);
router.delete(
  "/communities-by-id/:communityId/reports/:reportId",
  verifyToken,
  lazy(COMM, "resolveReport"),
);

router.get(
  "/communities/:communityId/members",
  verifyToken,
  lazy(COMM, "getMembers"),
);
router.post(
  "/communities/:communityId/members/:userId/permissions",
  verifyToken,
  lazy(COMM, "updateMemberPermissions"),
);

router.get("/communities/:name", lazy(COMM, "getCommunityDetails"));
router.put(
  "/communities/:name",
  verifyToken,
  upload.single("avatar"),
  lazy(COMM, "updateCommunity"),
);
router.delete("/communities/:name", verifyToken, lazy(COMM, "deleteCommunity"));

module.exports = router;
