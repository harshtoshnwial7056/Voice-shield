import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthShell from "./AuthShell";
import { api, getErrorMessage } from "./api";

function ForgotPassword() {
  const [requestEmail, setRequestEmail] = useState("");
  const [resetForm, setResetForm] = useState({
    email: "",
    otp: "",
    password: "",
    confirmPassword: "",
  });
  const [step, setStep] = useState("request");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [debugOtp, setDebugOtp] = useState("");
  const navigate = useNavigate();

  const handleRequestOtp = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setFeedback("");
    setDebugOtp("");

    try {
      const response = await api.post("/api/auth/forgot-password", {
        email: requestEmail,
      });

      setFeedback(response.data.message || "Reset code sent.");
      setDebugOtp(response.data.debugOtp || "");
      setResetForm((current) => ({ ...current, email: requestEmail }));
      setStep("reset");
    } catch (error) {
      setFeedback(getErrorMessage(error, "Unable to send a reset code right now."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();

    if (resetForm.password !== resetForm.confirmPassword) {
      setFeedback("New password and confirmation must match.");
      return;
    }

    setSubmitting(true);
    setFeedback("");

    try {
      const response = await api.post("/api/auth/reset-password", {
        email: resetForm.email,
        otp: resetForm.otp,
        password: resetForm.password,
      });

      setFeedback(response.data.message || "Password reset successful.");
      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (error) {
      setFeedback(getErrorMessage(error, "Unable to reset the password."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Account Recovery"
      title="Reset access without leaving the workspace."
      subtitle="Request a six-digit reset code, confirm it, and set a new password in one short flow."
      alternateLabel="Back to sign in?"
      alternateTo="/login"
    >
      <div className="form-intro">
        <h2>{step === "request" ? "Forgot password" : "Enter reset code"}</h2>
        <p>
          {step === "request"
            ? "We will send a one-time password to your registered email address."
            : "Enter the code you received, then choose a new password with at least 8 characters."}
        </p>
      </div>

      {step === "request" ? (
        <form className="auth-form" onSubmit={handleRequestOtp}>
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              value={requestEmail}
              onChange={(event) => setRequestEmail(event.target.value)}
              required
            />
          </label>

          <button className="primary-button" type="submit" disabled={submitting}>
            {submitting ? "Sending code..." : "Send reset code"}
          </button>
        </form>
      ) : (
        <form className="auth-form" onSubmit={handleResetPassword}>
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              name="email"
              value={resetForm.email}
              onChange={(event) =>
                setResetForm((current) => ({ ...current, email: event.target.value }))
              }
              required
            />
          </label>

          <label className="field">
            <span>6-digit OTP</span>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="123456"
              value={resetForm.otp}
              onChange={(event) =>
                setResetForm((current) => ({ ...current, otp: event.target.value }))
              }
              required
            />
          </label>

          <label className="field">
            <span>New password</span>
            <input
              type="password"
              placeholder="Choose a new password"
              value={resetForm.password}
              onChange={(event) =>
                setResetForm((current) => ({ ...current, password: event.target.value }))
              }
              required
            />
          </label>

          <label className="field">
            <span>Confirm new password</span>
            <input
              type="password"
              placeholder="Repeat the new password"
              value={resetForm.confirmPassword}
              onChange={(event) =>
                setResetForm((current) => ({ ...current, confirmPassword: event.target.value }))
              }
              required
            />
          </label>

          <button className="primary-button" type="submit" disabled={submitting}>
            {submitting ? "Resetting password..." : "Reset password"}
          </button>

          <button
            className="secondary-button"
            type="button"
            onClick={() => {
              setStep("request");
              setFeedback("");
              setDebugOtp("");
            }}
          >
            Send another code
          </button>
        </form>
      )}

      {debugOtp ? (
        <p className="form-feedback">
          Local testing code: <strong>{debugOtp}</strong>
        </p>
      ) : null}

      {feedback ? <p className="form-feedback">{feedback}</p> : null}
    </AuthShell>
  );
}

export default ForgotPassword;
