const express = require("express");
const cors = require("cors");

// ✅ IMPORTANT: load .env from backend folder
require("dotenv").config({ path: __dirname + "/.env" });

const connectDB = require("./Config/db");

const authRoutes = require("./routes/authRoutes");
const predictRoutes = require("./routes/predictRoutes");

const app = express();
const PORT = Number(process.env.PORT || 5000);
const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error("Not allowed by CORS"));
  },
}));
app.use(express.json());

// ✅ Connect DB
connectDB();

// Routes
app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});
app.use("/api/auth", authRoutes);
app.use("/api/predict", predictRoutes);

// Server
app.listen(PORT, () => {
  console.log(`VoiceShield API running on port ${PORT}`);
});
