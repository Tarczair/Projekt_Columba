const { PrismaClient } = require("@prisma/client");

// MUSI być {} w środku dla wersji 7+
const prisma = new PrismaClient({});

module.exports = prisma;
