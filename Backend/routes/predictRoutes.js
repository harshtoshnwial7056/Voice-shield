const router = require("express").Router();
const multer = require("multer");
const path = require("path");

const { predictVoice, getPredictionHistory } = require("../controllers/predictController");
const { verifyToken } = require("../middleware/authMiddleware");

const allowedMimeTypes = new Set([
  "audio/wav",
  "audio/wave",
  "audio/x-wav",
  "audio/vnd.wave",
]);

const upload = multer({
  dest: "uploads/",
  fileFilter: (req, file, cb) => {
    const extension = path.extname(file.originalname || "").toLowerCase();
    const isWavExtension = extension === ".wav";
    const isWavMimeType = allowedMimeTypes.has((file.mimetype || "").toLowerCase());

    if (isWavExtension && isWavMimeType) {
      cb(null, true);
      return;
    }

    cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", "audio"));
  },
});

router.get("/history", verifyToken, getPredictionHistory);

router.post("/", verifyToken, (req, res, next) => {
  upload.single("audio")(req, res, (error) => {
    if (error instanceof multer.MulterError) {
      return res.status(400).json({ message: "Only .wav audio files are allowed." });
    }

    if (error) {
      return res.status(400).json({ message: error.message || "Audio upload failed." });
    }

    next();
  });
}, predictVoice);

module.exports = router;
