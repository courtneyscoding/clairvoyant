import CosmicBackground from "@/components/CosmicBackground";
import OracleEye from "@/components/OracleEye";
import SiteHeader from "@/components/SiteHeader";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BRAND_NAME } from "@/lib/brand";
import { peekReturnTo, purgeLegacyRedirectState } from "@/lib/admin";
import { toast } from "@/components/ui/sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

type EmailMode = "signin" | "signup";

const getAuthRedirectTo = () => {
  const nextPath = peekReturnTo() || "/chat";
  const siteOrigin =
    window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
      ? window.location.origin
      : "https://www.clairvoyantcourtney.com";
  const redirectTo = new URL("/auth/callback", siteOrigin);
  redirectTo.searchParams.set("next", nextPath);

  return redirectTo.toString();
};

const Login = () => {
  const [googleLoading, setGoogleLoading] = useState(false);
  const [emailMode, setEmailMode] = useState<EmailMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    purgeLegacyRedirectState();

    if (!authLoading && user) {
      navigate(peekReturnTo() || "/chat", { replace: true });
    }
  }, [authLoading, navigate, user]);

  const handleGoogleLogin = async () => {
    purgeLegacyRedirectState();
    setGoogleLoading(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: getAuthRedirectTo(),
      },
    });

    if (error) {
      console.error("google login error:", error);
      toast.error("Google sign-in could not start", {
        description: error.message,
      });
      setGoogleLoading(false);
    }
  };

  const handleEmailAuth = async () => {
    purgeLegacyRedirectState();

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      toast.error("Email and password are both required.");
      return;
    }

    setEmailLoading(true);

    if (emailMode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) {
        toast.error("Email sign-in failed", {
          description: error.message,
        });
        setEmailLoading(false);
        return;
      }

      toast.success("Signed in successfully.");
      setEmailLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        emailRedirectTo: getAuthRedirectTo(),
      },
    });

    if (error) {
      toast.error("Could not create your account", {
        description: error.message,
      });
      setEmailLoading(false);
      return;
    }

    if (data.session) {
      toast.success("Account created and signed in.");
    } else {
      toast.success("Check your email to confirm your account.");
    }

    setEmailLoading(false);
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

        <div className="w-full max-w-md rounded-[28px] border border-purple-dim bg-black/35 p-5 backdrop-blur-md sm:p-6">
          <Tabs defaultValue="social" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-secondary/60">
              <TabsTrigger value="social">Social</TabsTrigger>
              <TabsTrigger value="email">Email</TabsTrigger>
            </TabsList>

            <TabsContent value="social" className="space-y-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleLogin}
                disabled={googleLoading || authLoading}
                className="h-11 w-full justify-start rounded-full border-purple-dim bg-secondary/40 text-foreground hover:border-primary hover:bg-secondary/70"
              >
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary">
                  G
                </span>
                {googleLoading ? "Connecting Google..." : "Continue with Google"}
              </Button>
            </TabsContent>

            <TabsContent value="email" className="space-y-4 pt-4">
              <div className="flex rounded-full border border-purple-dim bg-secondary/30 p-1">
                <button
                  type="button"
                  onClick={() => setEmailMode("signin")}
                  className={`flex-1 rounded-full px-4 py-2 text-sm transition-colors ${
                    emailMode === "signin" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                  }`}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => setEmailMode("signup")}
                  className={`flex-1 rounded-full px-4 py-2 text-sm transition-colors ${
                    emailMode === "signup" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                  }`}
                >
                  Create account
                </button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email-address" className="text-foreground">
                  Email
                </Label>
                <Input
                  id="email-address"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  placeholder="you@clairvoyantcourtney.com"
                  className="h-11 rounded-2xl border-purple-dim bg-secondary/30 text-foreground placeholder:text-muted-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete={emailMode === "signin" ? "current-password" : "new-password"}
                  placeholder={emailMode === "signin" ? "Enter your password" : "Create a password"}
                  className="h-11 rounded-2xl border-purple-dim bg-secondary/30 text-foreground placeholder:text-muted-foreground"
                />
              </div>

              <Button
                type="button"
                onClick={handleEmailAuth}
                disabled={emailLoading || authLoading}
                className="h-11 w-full rounded-full"
              >
                {emailLoading
                  ? emailMode === "signin"
                    ? "Signing in..."
                    : "Creating account..."
                  : emailMode === "signin"
                    ? "Sign in with email"
                    : "Create account"}
              </Button>

              <p className="text-center text-xs leading-5 text-muted-foreground">
                {emailMode === "signup"
                  ? "New accounts may need email confirmation before the first sign-in."
                  : "Use the email and password you created for your Courtney account."}
              </p>
            </TabsContent>
          </Tabs>

          <Separator className="my-5 bg-purple-dim/60" />
          <p className="text-center text-xs leading-5 text-muted-foreground">
            Sign in with Google or use your email and password.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
