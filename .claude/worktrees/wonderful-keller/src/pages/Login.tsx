import CosmicBackground from "@/components/CosmicBackground";
import OracleEye from "@/components/OracleEye";
import SiteHeader from "@/components/SiteHeader";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BRAND_NAME } from "@/lib/brand";
import { peekReturnTo } from "@/lib/admin";
import { toast } from "@/components/ui/sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const Login = () => {
  const [loading, setLoading] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && user) {
      navigate(peekReturnTo() || "/chat", { replace: true });
    }
  }, [authLoading, navigate, user]);

  const handleGoogleLogin = async () => {
    setLoading(true);

    const nextPath = peekReturnTo() || "/chat";
    const redirectTo = new URL("/auth/callback", window.location.origin);
    redirectTo.searchParams.set("next", nextPath);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectTo.toString(),
      },
    });

    if (error) {
      console.error("Login error:", error);
      toast.error("Google sign-in could not start", {
        description: error.message,
      });
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[100dvh] flex flex-col items-center justify-center px-6 pt-28 pb-12 overflow-hidden">
      <CosmicBackground />
      <SiteHeader />
      <div className="flex flex-col items-center gap-8 animate-fade-in">
        <OracleEye pulsing={false} size="md" />

        <div className="text-center space-y-3">
          <h1 className="font-display text-foreground text-4xl font-light tracking-tight text-glow-purple" style={{ lineHeight: "1.1" }}>
            {BRAND_NAME}
          </h1>
          <p className="font-body text-muted-foreground text-sm max-w-[260px] mx-auto leading-relaxed">
            Sign in to chat with Clairvoyant Courtney and receive personalized guidance.
          </p>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading || authLoading}
          className="flex items-center gap-3 bg-secondary/60 border border-purple-dim rounded-full px-6 py-3 text-foreground font-body text-sm hover:border-primary hover:glow-purple transition-all duration-300 active:scale-95 disabled:opacity-50"
        >
          <span className="h-2.5 w-2.5 rounded-full bg-primary" aria-hidden="true" />
          {loading ? "Connecting..." : "Continue with Google"}
        </button>
      </div>
    </div>
  );
};

export default Login;
