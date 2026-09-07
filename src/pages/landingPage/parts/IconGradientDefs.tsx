const IconGradientDefs = () => {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width="1"
      height="1"
      viewBox="0 0 1 1"
      className="absolute -left-[9999px] -top-[9999px]"
      style={{ position: "absolute" }}
    >
      <defs>
        <linearGradient
          id="brand-icon-gradient"
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1="0"
          x2="24"
          y2="24"
        >
          <stop offset="0%" stopColor="#22c55e" />
          <stop offset="55%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export default IconGradientDefs;