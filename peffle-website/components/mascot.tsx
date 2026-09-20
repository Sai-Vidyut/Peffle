type MascotProps = {
  className?: string;
};

export function Mascot({ className }: MascotProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- pixel art needs unoptimized nearest-neighbor scaling
    <img
      src="/peffle-mascot-lg.png"
      alt=""
      width={272}
      height={240}
      decoding="async"
      aria-hidden="true"
      className={`pixelated select-none h-auto w-[190px] max-w-[min(190px,72vw)]${className ? ` ${className}` : ""}`}
      draggable={false}
    />
  );
}
