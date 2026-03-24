import React from "react";
import { Link } from "react-router-dom";

function AuthShell({ eyebrow, title, subtitle, alternateLabel, alternateTo, children }) {
  return (
    <div className="auth-page">
      <section className="hero-panel">
        <div className="hero-copy">
          <span className="eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>

        <div className="hero-badges">
          <div className="metric-card">
            <strong>Upload once</strong>
            <span>Analyze suspicious voice clips in seconds.</span>
          </div>
          <div className="metric-card">
            <strong>Fraud focused</strong>
            <span>Built for deepfake screening and trust checks.</span>
          </div>
          <div className="metric-card">
            <strong>Secure sessions</strong>
            <span>Protected dashboard access with saved auth state.</span>
          </div>
        </div>
      </section>

      <section className="auth-card">
        {children}
        <p className="auth-switch">
          {alternateLabel} <Link to={alternateTo}>Open here</Link>
        </p>
      </section>
    </div>
  );
}

export default AuthShell;
