const LoadingOracle = () => {
  return (
    <div className="flex flex-col items-center gap-4 animate-fade-in">
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-primary"
            style={{
              animation: `oracle-pulse 1.4s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>
      <p className="font-body text-sm text-muted-foreground">
        Clairvoyant Courtney is responding...
      </p>
    </div>
  );
};

export default LoadingOracle;
