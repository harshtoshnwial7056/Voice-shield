import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthShell from "./AuthShell";
import { api, getErrorMessage } from "./api";

function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState("");
  const navigate = useNavigate();

  const handleChange = ({ target: { name, value } }) => {
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setFeedback("");

    try {
      const response = await api.post("/api/auth/register", form);
      setFeedback(response.data.message || "Registration complete. Redirecting to login...");
      navigate("/login");
    } catch (error) {
      setFeedback(getErrorMessage(error, "Unable to create your account right now."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Analyst Onboarding"
      title="Stand up a safer voice verification workflow."
      subtitle="Create a VoiceShield account to upload audio, review model confidence, and centralize suspicious recordings."
      alternateLabel="Already registered?"
      alternateTo="/login"
    >
      <div className="form-intro">
        <h2>Create account</h2>
        <p>This form now matches the backend and includes your display name.</p>
      </div>

      <form className="auth-form" onSubmit={handleRegister}>
        <label className="field">
          <span>Full name</span>
          <input
            type="text"
            name="name"
            placeholder="Your name"
            value={form.name}
            onChange={handleChange}
            required
          />
        </label>

        <label className="field">
          <span>Email</span>
          <input
            type="email"
            name="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={handleChange}
            required
          />
        </label>

        <label className="field">
          <span>Password</span>
          <input
            type="password"
            name="password"
            placeholder="Choose a strong password"
            value={form.password}
            onChange={handleChange}
            required
          />
        </label>

        <button className="primary-button" type="submit" disabled={submitting}>
          {submitting ? "Creating account..." : "Register"}
        </button>
      </form>

      {feedback ? <p className="form-feedback">{feedback}</p> : null}
    </AuthShell>
  );
}

export default Register;
