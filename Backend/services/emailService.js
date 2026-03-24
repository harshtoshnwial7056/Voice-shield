const nodemailer = require("nodemailer");

const sendWithResend = async ({ email, otp }) => {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    return false;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "VoiceShield password reset code",
      text: `Your VoiceShield password reset code is ${otp}. It expires in 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #1f1a17; line-height: 1.6;">
          <h2 style="margin-bottom: 12px;">VoiceShield password reset</h2>
          <p>Use this one-time password to reset your account password:</p>
          <p style="font-size: 28px; font-weight: 700; letter-spacing: 6px;">${otp}</p>
          <p>This code expires in 10 minutes.</p>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Resend email failed: ${errorText}`);
  }

  return true;
};

const getTransportConfig = () => {
  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_SECURE,
    SMTP_SERVICE,
    SMTP_USER,
    SMTP_PASS,
  } = process.env;

  if (!SMTP_USER || !SMTP_PASS) {
    return null;
  }

  if (SMTP_HOST) {
    return {
      host: SMTP_HOST,
      port: Number(SMTP_PORT || 587),
      secure: String(SMTP_SECURE || "false").toLowerCase() === "true",
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    };
  }

  if (SMTP_SERVICE) {
    return {
      service: SMTP_SERVICE,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    };
  }

  return null;
};

const sendPasswordResetOtp = async ({ email, otp }) => {
  if (await sendWithResend({ email, otp })) {
    return;
  }

  const transportConfig = getTransportConfig();

  if (!transportConfig) {
    throw new Error(
      "Email delivery is not configured. Add RESEND_API_KEY and RESEND_FROM_EMAIL, or configure SMTP_USER/SMTP_PASS."
    );
  }

  const transporter = nodemailer.createTransport(transportConfig);
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  await transporter.sendMail({
    from,
    to: email,
    subject: "VoiceShield password reset code",
    text: `Your VoiceShield password reset code is ${otp}. It expires in 10 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #1f1a17; line-height: 1.6;">
        <h2 style="margin-bottom: 12px;">VoiceShield password reset</h2>
        <p>Use this one-time password to reset your account password:</p>
        <p style="font-size: 28px; font-weight: 700; letter-spacing: 6px;">${otp}</p>
        <p>This code expires in 10 minutes.</p>
      </div>
    `,
  });
};

module.exports = {
  sendPasswordResetOtp,
};
