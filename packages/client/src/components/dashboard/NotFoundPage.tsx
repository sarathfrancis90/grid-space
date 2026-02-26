import { useNavigate } from "react-router-dom";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-gray-50"
      data-testid="not-found-page"
    >
      <div className="text-center">
        <h1 className="mb-2 text-6xl font-bold text-gray-300">404</h1>
        <p className="mb-6 text-lg text-gray-600">Spreadsheet not found</p>
        <button
          onClick={() => navigate("/dashboard")}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          data-testid="back-to-dashboard-btn"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
