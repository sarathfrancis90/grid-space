import { useEffect, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const [checked, setChecked] = useState(false);
  const attemptedRefreshRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    if (isAuthenticated && user) {
      setChecked(true);
      return;
    }

    if (attemptedRefreshRef.current) {
      setChecked(true);
      return;
    }

    attemptedRefreshRef.current = true;
    refreshToken().finally(() => {
      if (isMounted) {
        setChecked(true);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user, isLoading, refreshToken]);

  if (!checked || isLoading) {
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
