import { useEffect } from "react";
import CosmicBackground from "@/components/CosmicBackground";
import SiteHeader from "@/components/SiteHeader";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import UploadSection from "@/components/UploadSection";
import { BRAND_NAME } from "@/lib/brand";

const Palm = () => {
  useEffect(() => {
    document.title = `Palm Reading - ${BRAND_NAME}`;
  }, []);

  const scrollToUpload = () => {
    document.getElementById("upload")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="relative min-h-[100dvh] overflow-hidden">
      <CosmicBackground />
      <SiteHeader />

      <main className="relative z-[1] mx-auto w-full max-w-6xl pt-28 pb-12">
        <HeroSection onStartReading={scrollToUpload} />
        <FeaturesSection />
        <UploadSection id="upload" />
      </main>
    </div>
  );
};

export default Palm;
