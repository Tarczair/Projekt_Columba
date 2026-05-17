const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});

module.exports = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = [
      ".jpg",
      ".jpeg",
      ".png",
      ".gif",
      ".webp",
      ".pdf",
      ".doc",
      ".docx",
      ".txt",
      ".xls",
      ".xlsx",
      ".ppt",
      ".pptx",
      ".mp4",
      ".mp3",
    ];

    const fileExtension = path.extname(file.originalname).toLowerCase();

    if (allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Niedozwolony format pliku! Akceptowane formaty: Obrazy, PDF, DOC, DOCX, TXT, XLS, XLSX, PPT, PPTX, MP4, MP3.",
        ),
      );
    }
  },
});
