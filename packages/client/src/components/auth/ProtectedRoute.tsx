import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const state = useAuthStore.getState();
    if (state.isAuthenticated && state.user) {
      setAuthChecked(true);
      return;
    }

    refreshToken().finally(() => {
      if (!cancelled) {
        setAuthChecked(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [refreshToken]);

  if (!authChecked) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        data-testid="auth-loading"
      >
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
