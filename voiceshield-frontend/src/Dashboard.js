import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, getErrorMessage } from "./api";

const formatConfidence = (value) => {
  const numeric = Number.parseFloat(value);

  if (Number.isNaN(numeric)) {
    return value || "--";
  }

  const normalized = numeric <= 1 ? numeric * 100 : numeric;
  return `${normalized.toFixed(1)}%`;
};

function Dashboard() {
  const [file, setFile] = useState(null);
  const [modelType, setModelType] = useState("pretrained");
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [feedback, setFeedback] = useState("");
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await api.get("/api/predict/history", {
          headers: {
            Authorization: token ? `Bearer ${token}` : undefined,
          },
        });

        setHistory(response.data);
      } catch (error) {
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
          return;
        }

        setFeedback(getErrorMessage(error, "Unable to load your previous scans."));
      } finally {
        setHistoryLoading(false);
      }
    };

    loadHistory();
  }, [navigate]);

  const fileSummary = useMemo(() => {
    if (!file) {
      return "Drop a .wav file here to start analysis.";
    }

    const sizeInMb = (file.size / (1024 * 1024)).toFixed(2);
    return `${file.name} • ${sizeInMb} MB`;
  }, [file]);

  const handleSelect = (selectedFile) => {
    if (!selectedFile) {
      return;
    }

    setFile(selectedFile);
    setFeedback("");
    setResult(null);
  };

  const handleUpload = async () => {
    if (!file) {
      setFeedback("Select an audio file before running a scan.");
      return;
    }

    const formData = new FormData();
    formData.append("audio", file);
    formData.append("modelType", modelType);

    try {
      setLoading(true);
      setFeedback("");
      const token = localStorage.getItem("token");

      const response = await api.post("/api/predict", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: token ? `Bearer ${token}` : undefined,
        },
      });

      setResult(response.data);
      setHistory((current) => [
        {
          ...response.data,
          _id: response.data._id || `${Date.now()}`,
          createdAt: response.data.createdAt || new Date().toISOString(),
        },
        ...current,
      ]);
      setFeedback("Analysis complete. Review the prediction details below.");
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      setFeedback(getErrorMessage(error, "Audio analysis failed. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const formatTimestamp = (value) => {
    if (!value) {
      return "Just now";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "Just now";
    }

    return date.toLocaleString();
  };

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <span className="eyebrow">VoiceShield Console</span>
          <h1>Audio fraud detection workspace</h1>
          <p>Upload a sample, run a prediction, and inspect the model confidence in one place.</p>
        </div>

        <button className="ghost-button" onClick={handleLogout} type="button">
          Logout
        </button>
      </header>

      <main className="dashboard-grid">
        <section className="dashboard-card standout-card">
          <div className="section-heading">
            <h2>Upload evidence</h2>
            <p>VoiceShield accepts a single `.wav` audio file per scan and returns a prediction with confidence.</p>
          </div>

          <label className="field">
            <span>Model to run</span>
            <select value={modelType} onChange={(event) => setModelType(event.target.value)}>
              <option value="pretrained">Pretrained model</option>
              <option value="custom">Custom model</option>
            </select>
          </label>

          <div
            className={`dropzone ${dragActive ? "is-active" : ""}`}
            onDragOver={(event) => {
              event.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragActive(false);
              handleSelect(event.dataTransfer.files?.[0]);
            }}
          >
            <input
              ref={fileInputRef}
              className="file-input"
              type="file"
              accept=".wav,audio/wav"
              onChange={(event) => handleSelect(event.target.files?.[0])}
            />
            <button
              className="secondary-button"
              onClick={() => fileInputRef.current?.click()}
              type="button"
            >
              Choose audio file
            </button>
            <span className="dropzone-copy">{fileSummary}</span>
          </div>

          <div className="action-row">
            <button className="primary-button" onClick={handleUpload} type="button" disabled={loading}>
              {loading ? "Analyzing..." : "Upload and detect"}
            </button>
            <button
              className="secondary-button"
              onClick={() => {
                setFile(null);
                setResult(null);
                setFeedback("");
              }}
              type="button"
            >
              Clear
            </button>
          </div>

          {feedback ? <p className="form-feedback">{feedback}</p> : null}
        </section>

        <section className="dashboard-card insights-card">
          <div className="section-heading">
            <h2>Platform highlights</h2>
            <p>A quick view of how this frontend supports the existing backend workflow.</p>
          </div>

          <div className="insight-list">
            <article>
              <strong>Authenticated access</strong>
              <span>Routes stay gated while the auth token is present in local storage.</span>
            </article>
            <article>
              <strong>Backend-ready forms</strong>
              <span>Registration now sends `name`, `email`, and `password` exactly as the server expects.</span>
            </article>
            <article>
              <strong>Result review</strong>
              <span>Prediction, confidence score, and uploaded audio playback appear together after each scan.</span>
            </article>
          </div>
        </section>

        <section className="dashboard-card result-card">
          <div className="section-heading">
            <h2>Latest analysis</h2>
            <p>{result ? "Here is the most recent prediction returned by the API." : "Run a scan to populate this panel."}</p>
          </div>

          {result ? (
            <div className="result-panel">
              <div className="result-stat">
                <span>Prediction</span>
                <strong>{result.prediction}</strong>
              </div>
              <div className="result-stat">
                <span>Confidence</span>
                <strong>{formatConfidence(result.confidence)}</strong>
              </div>
              <div className="result-stat">
                <span>Model used</span>
                <strong>{result.modelLabel || "Custom model"}</strong>
              </div>

              <div className="audio-card">
                <span>Uploaded sample</span>
                <audio controls src={result.audioUrl}>
                  Your browser does not support audio playback.
                </audio>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <strong>No analysis yet</strong>
              <span>Your prediction response will appear here after an upload.</span>
            </div>
          )}
        </section>

        <section className="dashboard-card history-card">
          <div className="section-heading">
            <h2>Previous tests</h2>
            <p>Only your earlier uploads and prediction results are shown here.</p>
          </div>

          {historyLoading ? (
            <div className="empty-state">
              <strong>Loading history</strong>
              <span>Your previous scans are being fetched now.</span>
            </div>
          ) : history.length ? (
            <div className="history-list">
              {history.map((item) => (
                <article className="history-item" key={item._id || `${item.audioUrl}-${item.createdAt}`}>
                  <div className="history-meta">
                    <strong>{item.prediction}</strong>
                    <span>{formatTimestamp(item.createdAt)}</span>
                  </div>
                  <div className="history-stats">
                    <span>Confidence: {formatConfidence(item.confidence)}</span>
                    <span>Model: {item.modelLabel || "Custom model"}</span>
                  </div>
                  <audio controls src={item.audioUrl}>
                    Your browser does not support audio playback.
                  </audio>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <strong>No previous tests</strong>
              <span>Your earlier audio scans will appear here after you upload one.</span>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default Dashboard;
