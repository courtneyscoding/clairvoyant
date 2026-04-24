import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import RequireAuth from "@/components/RequireAuth";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index.tsx";
import Login from "./pages/Login.tsx";
import MindSpeaker from "./pages/mind-speaker.tsx";
import Profile from "./pages/Profile.tsx";
import Admin from "./pages/Admin.tsx";
import AuthCallback from "./pages/AuthCallback.tsx";
import Tarot from "./pages/Tarot.tsx";
import Articles from "./pages/Articles.tsx";
import Article from "./pages/Article.tsx";
import NotFound from "./pages/NotFound.tsx";
import Palm from "./pages/Palm.tsx";
import Plans from "./pages/Plans.tsx";
import ComingSoon from "./pages/ComingSoon.tsx";

const queryClient = new QueryClient();
const PREVIEW_BYPASS_STORAGE_KEY = "clairvoyant-courtney-preview-bypass";

const isLocalhost = () =>
  typeof window !== "undefined" &&
  ["localhost", "127.0.0.1"].includes(window.location.hostname);

const hasPreviewBypass = () => {
  if (typeof window === "undefined") {
    return false;
  }

  const previewToken = import.meta.env.VITE_PREVIEW_BYPASS_TOKEN;
  const requestedPreview = new URLSearchParams(window.location.search).get("preview");

  try {
    if (requestedPreview === "off") {
      window.sessionStorage.removeItem(PREVIEW_BYPASS_STORAGE_KEY);
      return false;
    }

    if (previewToken && requestedPreview === previewToken) {
      window.sessionStorage.setItem(PREVIEW_BYPASS_STORAGE_KEY, "true");
      return true;
    }

    return window.sessionStorage.getItem(PREVIEW_BYPASS_STORAGE_KEY) === "true";
  } catch {
    return Boolean(previewToken && requestedPreview === previewToken);
  }
};

const comingSoonEnabled =
  import.meta.env.VITE_COMING_SOON !== "false" &&
  !isLocalhost() &&
  !hasPreviewBypass();

const AppRoutes = () => {
  if (comingSoonEnabled) {
    return (
      <Routes>
        <Route path="*" element={<ComingSoon />} />
      </Routes>
    );
  }

  return (
    <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/chat" element={<RequireAuth><MindSpeaker /></RequireAuth>} />
            <Route path="/voice-test" element={<MindSpeaker voiceTestMode />} />
            <Route path="/login" element={<Login />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/tarot" element={<RequireAuth><Tarot /></RequireAuth>} />
      <Route path="/mind-speaker" element={<Navigate to="/chat" replace />} />
      <Route path="/articles" element={<Articles />} />
      <Route path="/articles/:slug" element={<Article />} />
      <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
      <Route path="/plans" element={<RequireAuth><Plans /></RequireAuth>} />
      <Route path="/admin" element={<RequireAuth><Admin /></RequireAuth>} />
      <Route path="/palm" element={<Palm />} />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
