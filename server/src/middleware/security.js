const rateLimit = require("express-rate-limit");
const helmet = require("helmet");

const waf = helmet();

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Zbyt wiele zapytań, spróbuj później.",
});

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: "Limit prób logowania wyczerpany.",
});

module.exports = { waf, globalLimiter, authLimiter };
