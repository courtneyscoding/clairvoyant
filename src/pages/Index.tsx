import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CosmicBackground from "@/components/CosmicBackground";
import OracleEye from "@/components/OracleEye";
import SiteHeader from "@/components/SiteHeader";
import { BRAND_NAME, BRAND_TAGLINE } from "@/lib/brand";
import { rememberReturnTo } from "@/lib/admin";
import { isLocalPreview } from "@/lib/preview";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = BRAND_NAME;
  }, []);

  const goToProtected = (path: string) => {
    if (isLocalPreview) {
      navigate(path);
      return;
    }

    rememberReturnTo(path);
    navigate("/login");
  };

  return (
    <div className="relative min-h-[100dvh] overflow-hidden px-6 pt-28 pb-10">
      <CosmicBackground />
      <SiteHeader />

      <main className="relative z-[1] mx-auto flex min-h-[calc(100dvh-9rem)] w-full max-w-6xl flex-col items-center justify-center">
        <section className="flex w-full flex-col items-center text-center">
          <div className="mb-3 font-display text-[clamp(2.2rem,5vw,4.3rem)] font-light leading-none tracking-tight text-foreground text-glow-purple">
            {BRAND_NAME}
          </div>

          <OracleEye
            pulsing={false}
            size="lg"
            className="mx-auto -mt-2 sm:-mt-3"
          />

          <div className="-mt-4 sm:-mt-6">
            <p className="mx-auto mt-4 max-w-3xl font-body text-sm leading-7 text-muted-foreground sm:text-base">
              {BRAND_TAGLINE}
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => goToProtected("/chat")}
                className="rounded-full border border-primary/40 bg-primary px-6 py-3 font-body text-sm font-medium text-foreground transition-all duration-300 hover:glow-purple active:scale-95"
              >
                Speak with Courtney
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Index;
