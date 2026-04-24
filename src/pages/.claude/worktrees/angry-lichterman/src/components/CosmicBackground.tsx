import cosmicBg from "@/assets/cosmic-bg.jpg";

const CosmicBackground = () => {
  return (
    <div className="fixed inset-0 -z-10">
      <img
        src={cosmicBg}
        alt=""
        className="w-full h-full object-cover"
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-background/50" />
    </div>
  );
};

export default CosmicBackground;