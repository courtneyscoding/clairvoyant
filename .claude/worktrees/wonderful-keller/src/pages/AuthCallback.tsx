import CosmicBackground from "@/components/CosmicBackground";
import { useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { consumeReturnTo } from "@/lib/admin";
import { useAuth } from "@/hooks/useAuth";

const AuthCallback = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const hashParams = useMemo(
    () => new URLSearchParams(location.hash.startsWith("#") ? location.hash.slice(1) : location.hash),
    [location.hash],
  );
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const errorDescription =
    searchParams.get("error_description") || hashParams.get("error_description");
  const nextPath = searchParams.get("next");
  const hasPendingAuthTokens =
    hashParams.has("access_token") ||
    hashParams.has("refresh_token") ||
    hashParams.has("code") ||
    searchParams.has("access_token") ||
    searchParams.has("refresh_token") ||
    searchParams.has("code");

  useEffect(() => {
    if (errorDescription || loading) {
      return;
    }

    if (user) {
      navigate(consumeReturnTo() || nextPath || "/chat", { replace: true });
      return;
    }

    if (!hasPendingAuthTokens) {
      navigate("/login", { replace: true });
    }
  }, [errorDescription, hasPendingAuthTokens, loading, navigate, nextPath, user]);

  return (
    <div className="relative min-h-[100dvh] flex items-center justify-center px-6 py-12 overflow-hidden">
      <CosmicBackground />
      <div className="text-center space-y-3 max-w-sm animate-fade-in">
        {errorDescription ? (
          <>
            <h1 className="font-display text-foreground text-3xl font-light tracking-tight text-glow-purple">
              Sign-in failed
            </h1>
            <p className="font-body text-muted-foreground text-sm leading-relaxed">
              {errorDescription}
            </p>
          </>
        ) : (
          <>
            <h1 className="font-display text-foreground text-3xl font-light tracking-tight text-glow-purple">
              Signing you in...
            </h1>
            <p className="font-body text-muted-foreground text-sm leading-relaxed">
              Clairvoyant Courtney is connecting to your account.
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
