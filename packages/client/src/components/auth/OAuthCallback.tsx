import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const { setTokenFromCallback, refreshToken } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      setTokenFromCallback(token);
      // Fetch user profile with the new token
      refreshToken().then(() => navigate("/"));
    } else {
      navigate("/login");
    }
  }, [searchParams, setTokenFromCallback, refreshToken, navigate]);

  return (
    <div
      className="flex min-h-screen items-center justify-center"
      data-testid="oauth-callback"
    >
      <div className="text-gray-500">Completing sign in...</div>
    </div>
  );
}
