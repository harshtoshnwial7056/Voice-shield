const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { sendPasswordResetOtp } = require("../services/emailService");

const SECRET = process.env.JWT_SECRET || process.env.JWT_SECRET_key || "voiceshield_dev_secret";
const RESET_OTP_TTL_MS = 10 * 60 * 1000;
const hashResetCode = (value) => crypto.createHash("sha256").update(String(value)).digest("hex");
const normalizeEmail = (value) => String(value || "").trim().toLowerCase();
const createResetOtp = () => `${crypto.randomInt(100000, 1000000)}`;

// REGISTER
exports.register = async (req, res) => {
  try {
    const { name, password } = req.body;
    const email = normalizeEmail(req.body.email);

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required." });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ error: "An account with that email already exists." });
    }

    const hash = await bcrypt.hash(password, 10);

    await User.create({
      name,
      email,
      password: hash,
    });

    res.json({ message: "User registered" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// LOGIN
exports.login = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const { password } = req.body;

    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ msg: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) return res.status(400).json({ msg: "Wrong password" });

    const token = jwt.sign({ id: user._id }, SECRET);

    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);

    if (!email) {
      return res.status(400).json({ error: "Email is required." });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.json({
        message: "If that email is registered, a reset code has been sent.",
      });
    }

    const otp = createResetOtp();
    user.passwordResetCodeHash = hashResetCode(otp);
    user.passwordResetExpiresAt = new Date(Date.now() + RESET_OTP_TTL_MS);
    await user.save();

    try {
      await sendPasswordResetOtp({ email: user.email, otp });
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.log(`Password reset OTP for ${user.email}: ${otp}`);
        return res.json({
          message: "Email is not configured, so the OTP was written to the server logs for local testing.",
          debugOtp: otp,
        });
      }

      throw error;
    }

    res.json({ message: "A password reset code has been sent to your email." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const otp = String(req.body.otp || "").trim();
    const password = String(req.body.password || "");

    if (!email || !otp || !password) {
      return res.status(400).json({ error: "Email, OTP, and new password are required." });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: "New password must be at least 8 characters long." });
    }

    const user = await User.findOne({ email });

    if (!user || !user.passwordResetCodeHash || !user.passwordResetExpiresAt) {
      return res.status(400).json({ error: "Reset code is invalid or has expired." });
    }

    if (user.passwordResetExpiresAt.getTime() < Date.now()) {
      user.passwordResetCodeHash = undefined;
      user.passwordResetExpiresAt = undefined;
      await user.save();
      return res.status(400).json({ error: "Reset code is invalid or has expired." });
    }

    if (user.passwordResetCodeHash !== hashResetCode(otp)) {
      return res.status(400).json({ error: "Incorrect reset code." });
    }

    user.password = await bcrypt.hash(password, 10);
    user.passwordResetCodeHash = undefined;
    user.passwordResetExpiresAt = undefined;
    await user.save();

    res.json({ message: "Password reset successful. You can now sign in." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
