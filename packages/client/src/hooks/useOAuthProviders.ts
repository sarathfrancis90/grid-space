import { useState, useEffect } from "react";

interface OAuthProviders {
  google: boolean;
  github: boolean;
}

export function useOAuthProviders(): OAuthProviders {
  const [providers, setProviders] = useState<OAuthProviders>({
    google: false,
    github: false,
  });

  useEffect(() => {
    let cancelled = false;

    async function fetchProviders() {
      try {
        const res = await fetch("/api/auth/oauth/providers");
        if (!res.ok) return;
        const json = await res.json();
        if (!cancelled && json.success && json.data) {
          setProviders({
            google: Boolean(json.data.google),
            github: Boolean(json.data.github),
          });
        }
      } catch {
        // If fetch fails, keep buttons hidden (safe default)
      }
    }

    fetchProviders();
    return () => {
      cancelled = true;
    };
  }, []);

  return providers;
}
