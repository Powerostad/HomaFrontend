export interface LogoProps {
  color?: "black" | "white" | "primary";
  size?: "small" | "medium" | "large";
}

export function Logo({ color = "white", size = "medium" }: LogoProps) {
  const colorClass = {
    black: "text-foreground",
    white: "text-background",
    primary: "text-primary"
  }[color];

  const sizeClass = {
    small: "text-[24px]",
    medium: "text-[28px] sm:text-[32px]",
    large: "text-[36px] sm:text-[42px]"
  }[size];

  return (
    <div className="flex items-center justify-center">
      <span 
        className={`${colorClass} ${sizeClass} font-bold tracking-tighter uppercase leading-none`}
        style={{ fontFamily: 'var(--font-family-sf-pro)' }}
      >
        HOMA
      </span>
    </div>
  );
}