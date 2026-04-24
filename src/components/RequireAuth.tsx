import type { ReactNode } from "react";
import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import CosmicBackground from "@/components/CosmicBackground";
import OracleEye from "@/components/OracleEye";
import { useAuth } from "@/hooks/useAuth";
import { rememberReturnTo } from "@/lib/admin";
import { isLocalPreview } from "@/lib/preview";

const RequireAuth = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      rememberReturnTo(`${location.pathname}${location.search}${location.hash}`);
    }
  }, [loading, location.hash, location.pathname, location.search, user]);

  if (loading) {
    return (
      <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden px-6 py-12">
        <CosmicBackground />
        <div className="relative z-[1] flex flex-col items-center gap-5 text-center">
          <OracleEye pulsing size="md" />
          <p className="font-body text-sm text-muted-foreground">
            Checking your sign-in...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    if (isLocalPreview) {
      return <>{children}</>;
    }
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default RequireAuth;
