import { useEffect } from "react";
import CosmicBackground from "@/components/CosmicBackground";
import OracleEye from "@/components/OracleEye";
import { BRAND_NAME } from "@/lib/brand";

const ensureRobotsMeta = () => {
  let meta = document.querySelector<HTMLMetaElement>('meta[name="robots"]');

  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "robots";
    document.head.appendChild(meta);
  }

  meta.content = "noindex, nofollow";
};

const ComingSoon = () => {
  useEffect(() => {
    document.title = `${BRAND_NAME} | Coming Soon`;
    ensureRobotsMeta();
  }, []);

  return (
    <div className="relative min-h-[100dvh] overflow-hidden px-6 py-12">
      <CosmicBackground />

      <main className="relative z-[1] mx-auto flex min-h-[calc(100dvh-6rem)] w-full max-w-4xl flex-col items-center justify-center text-center">
        <OracleEye pulsing size="lg" className="mb-1" />

        <p className="font-body text-sm font-medium text-purple-light sm:text-base">
          Opening Soon
        </p>

        <h1 className="mt-3 font-display text-[clamp(3rem,10vw,6rem)] font-light leading-none text-foreground text-glow-purple">
          {BRAND_NAME}
        </h1>

        <p className="mt-6 max-w-2xl font-body text-base leading-8 text-muted-foreground sm:text-lg">
          Courtney is polishing the experience before opening the doors
          publicly. Please check back soon.
        </p>

        <div
          aria-hidden="true"
          className="mt-9 h-px w-full max-w-sm bg-gradient-to-r from-transparent via-primary/60 to-transparent"
        />
      </main>
    </div>
  );
};

export default ComingSoon;
