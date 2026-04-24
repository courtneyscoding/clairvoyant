import psychicImg from "@/assets/psychic-crystal-ball.png";

interface OracleEyeProps {
  onClick?: () => void;
  pulsing?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-44 w-44 sm:h-48 sm:w-48",
  md: "h-56 w-56 sm:h-60 sm:w-60",
  lg: "h-64 w-64 sm:h-72 sm:w-72",
};

const OracleEye = ({
  onClick,
  pulsing = true,
  size = "md",
  className = "",
}: OracleEyeProps) => {
  const sharedClassName = `relative flex items-center justify-center transition-transform duration-300 ${
    onClick ? "active:scale-95" : ""
  } ${pulsing ? "animate-oracle-pulse" : ""} ${className}`.trim();

  const image = (
    <>
      <div aria-hidden="true" className="absolute inset-[10%] rounded-full bg-primary/20 blur-[60px]" />
      <div className="relative flex items-center justify-center">
        <img
          src={psychicImg}
          alt="Psychic with crystal ball"
          className={`relative z-10 object-cover drop-shadow-2xl ${sizeClasses[size]}`}
          style={{
            WebkitMaskImage:
              "radial-gradient(circle at center, rgba(0,0,0,1) 40%, rgba(0,0,0,0.8) 55%, rgba(0,0,0,0.3) 72%, transparent 90%)",
            maskImage:
              "radial-gradient(circle at center, rgba(0,0,0,1) 40%, rgba(0,0,0,0.8) 55%, rgba(0,0,0,0.3) 72%, transparent 90%)",
            filter: "saturate(1.1) brightness(0.95)",
          }}
        />
      </div>
    </>
  );

  if (!onClick) {
    return <div className={sharedClassName}>{image}</div>;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={sharedClassName}
      aria-label="Consult the Psychic"
    >
      {image}
    </button>
  );
};

export default OracleEye;
