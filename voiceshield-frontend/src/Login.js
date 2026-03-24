import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthShell from "./AuthShell";
import { api, getErrorMessage } from "./api";

function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState("");
  const navigate = useNavigate();

  const handleChange = ({ target: { name, value } }) => {
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setFeedback("");

    try {
      const response = await api.post("/api/auth/login", form);
      localStorage.setItem("token", response.data.token);
      setFeedback("Login successful. Redirecting to your workspace...");
      navigate("/dashboard");
    } catch (error) {
      setFeedback(getErrorMessage(error, "Unable to log in with those credentials."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      eyebrow="VoiceShield Access"
      title="Catch manipulated audio before it spreads."
      subtitle="Sign in to review suspicious voice clips, inspect confidence scores, and keep your team ahead of voice fraud."
      alternateLabel="Need a new account?"
      alternateTo="/register"
    >
      <div className="form-intro">
        <h2>Login</h2>
        <p>Use your account to continue into the detection dashboard.</p>
      </div>

      <form className="auth-form" onSubmit={handleLogin}>
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
            placeholder="Enter your password"
            value={form.password}
            onChange={handleChange}
            required
          />
        </label>

        <button className="primary-button" type="submit" disabled={submitting}>
          {submitting ? "Signing in..." : "Login"}
        </button>
      </form>

      <p className="auth-inline-link">
        <button className="text-button" onClick={() => navigate("/forgot-password")} type="button">
          Forgot your password?
        </button>
      </p>

      {feedback ? <p className="form-feedback">{feedback}</p> : null}
    </AuthShell>
  );
}

export default Login;
