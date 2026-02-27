import { useNavigate } from "react-router-dom";
import { GridSpaceLogo } from "../ui/GridSpaceLogo";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-gray-50"
      style={{
        display: "flex",
        minHeight: "100vh",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f9fafb",
      }}
      data-testid="not-found-page"
    >
      <div
        className="text-center px-6"
        style={{ textAlign: "center", padding: "0 24px" }}
      >
        {/* Grid-themed illustration */}
        <div
          className="mx-auto mb-8 flex h-32 w-32 items-center justify-center rounded-2xl bg-gray-100"
          style={{
            margin: "0 auto 32px",
            width: "128px",
            height: "128px",
            borderRadius: "16px",
            backgroundColor: "#f3f4f6",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            width="64"
            height="64"
            viewBox="0 0 64 64"
            fill="none"
            style={{ opacity: 0.5 }}
          >
            {/* Mini grid */}
            <rect
              x="4"
              y="4"
              width="56"
              height="56"
              rx="4"
              stroke="#9ca3af"
              strokeWidth="2"
            />
            <line
              x1="4"
              y1="20"
              x2="60"
              y2="20"
              stroke="#9ca3af"
              strokeWidth="1.5"
            />
            <line
              x1="4"
              y1="36"
              x2="60"
              y2="36"
              stroke="#9ca3af"
              strokeWidth="1.5"
            />
            <line
              x1="4"
              y1="52"
              x2="60"
              y2="52"
              stroke="#9ca3af"
              strokeWidth="1.5"
            />
            <line
              x1="22"
              y1="4"
              x2="22"
              y2="60"
              stroke="#9ca3af"
              strokeWidth="1.5"
            />
            <line
              x1="42"
              y1="4"
              x2="42"
              y2="60"
              stroke="#9ca3af"
              strokeWidth="1.5"
            />
            {/* Question mark */}
            <text
              x="32"
              y="44"
              textAnchor="middle"
              fontSize="28"
              fill="#9ca3af"
              fontWeight="bold"
            >
              ?
            </text>
          </svg>
        </div>

        <h1
          className="mb-2 text-7xl font-bold text-gray-200"
          style={{
            marginBottom: "8px",
            fontSize: "72px",
            fontWeight: 700,
            color: "#e5e7eb",
          }}
        >
          404
        </h1>
        <h2
          className="mb-2 text-xl font-semibold text-gray-800"
          style={{
            marginBottom: "8px",
            fontSize: "20px",
            fontWeight: 600,
            color: "#1f2937",
          }}
        >
          Page not found
        </h2>
        <p
          className="mb-8 text-gray-500"
          style={{ marginBottom: "32px", color: "#6b7280", fontSize: "16px" }}
        >
          The spreadsheet or page you&apos;re looking for doesn&apos;t exist or
          has been moved.
        </p>

        <div
          className="flex flex-col items-center gap-4"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <button
            onClick={() => navigate("/dashboard")}
            className="rounded-lg bg-[#1a73e8] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#1557b0] focus:outline-none focus:ring-2 focus:ring-[#1a73e8] focus:ring-offset-2"
            style={{
              borderRadius: "8px",
              backgroundColor: "#1a73e8",
              padding: "10px 24px",
              fontSize: "14px",
              fontWeight: 500,
              color: "#fff",
              border: "none",
              cursor: "pointer",
            }}
            data-testid="back-to-dashboard-btn"
          >
            Back to Dashboard
          </button>

          <div
            className="flex items-center gap-2 text-sm text-gray-400"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "14px",
              color: "#9ca3af",
            }}
          >
            <GridSpaceLogo size={16} />
            <span>GridSpace</span>
          </div>
        </div>
      </div>
    </div>
  );
}
