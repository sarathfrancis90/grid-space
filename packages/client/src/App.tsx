import { useEffect, useState } from "react";

interface StatusData {
  app: string;
  version: string;
  features: {
    total: number;
    completed: number;
    remaining: number;
    sprints: number;
  };
}

export function App() {
  const [status, setStatus] = useState<StatusData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/status")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(setStatus)
      .catch((err: Error) => setError(err.message));
  }, []);

  const progress = status
    ? Math.round((status.features.completed / status.features.total) * 100)
    : 0;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: "16px",
          padding: "48px",
          maxWidth: "480px",
          width: "90%",
          boxShadow: "0 25px 50px rgba(0,0,0,0.15)",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "48px", marginBottom: "8px" }}>
          <svg
            width="48"
            height="48"
            viewBox="0 0 48 48"
            fill="none"
            style={{ display: "inline-block" }}
          >
            <rect width="48" height="48" rx="8" fill="#667eea" />
            <rect x="10" y="10" width="12" height="12" rx="2" fill="white" />
            <rect
              x="26"
              y="10"
              width="12"
              height="12"
              rx="2"
              fill="white"
              opacity="0.7"
            />
            <rect
              x="10"
              y="26"
              width="12"
              height="12"
              rx="2"
              fill="white"
              opacity="0.7"
            />
            <rect
              x="26"
              y="26"
              width="12"
              height="12"
              rx="2"
              fill="white"
              opacity="0.5"
            />
          </svg>
        </div>
        <h1
          style={{
            fontSize: "32px",
            fontWeight: 700,
            marginBottom: "8px",
            color: "#1a1a2e",
          }}
        >
          GridSpace
        </h1>
        <p style={{ color: "#666", marginBottom: "32px", fontSize: "16px" }}>
          Production-Ready Spreadsheet Application
        </p>

        {error && (
          <p style={{ color: "#e53e3e", marginBottom: "16px" }}>
            Failed to load status: {error}
          </p>
        )}

        {status && (
          <div>
            <div
              style={{
                background: "#f0f0f0",
                borderRadius: "8px",
                height: "12px",
                marginBottom: "12px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  background: "linear-gradient(90deg, #667eea, #764ba2)",
                  height: "100%",
                  width: `${progress}%`,
                  borderRadius: "8px",
                  transition: "width 0.5s ease",
                }}
              />
            </div>
            <p
              style={{
                fontSize: "14px",
                color: "#666",
                marginBottom: "24px",
              }}
            >
              {status.features.completed} / {status.features.total} features
              complete ({progress}%) &middot; {status.features.sprints} sprints
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
                textAlign: "left",
              }}
            >
              <div
                style={{
                  background: "#f8f9fa",
                  padding: "16px",
                  borderRadius: "8px",
                }}
              >
                <div
                  style={{
                    fontSize: "24px",
                    fontWeight: 700,
                    color: "#667eea",
                  }}
                >
                  {status.features.total}
                </div>
                <div style={{ fontSize: "12px", color: "#888" }}>
                  Total Features
                </div>
              </div>
              <div
                style={{
                  background: "#f8f9fa",
                  padding: "16px",
                  borderRadius: "8px",
                }}
              >
                <div
                  style={{
                    fontSize: "24px",
                    fontWeight: 700,
                    color: "#764ba2",
                  }}
                >
                  {status.features.sprints}
                </div>
                <div style={{ fontSize: "12px", color: "#888" }}>Sprints</div>
              </div>
            </div>
          </div>
        )}

        {!status && !error && <p style={{ color: "#888" }}>Loading...</p>}

        <p
          style={{
            marginTop: "32px",
            fontSize: "12px",
            color: "#aaa",
          }}
        >
          v{status?.version ?? "..."} &middot; Cloud Run
        </p>
      </div>
    </div>
  );
}
