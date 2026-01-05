import * as React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  asChild?: boolean;
}

export function SimpleButton({
  className = "",
  variant = "default",
  size = "default",
  asChild = false,
  children,
  ...props
}: ButtonProps) {
  // Variant styles
  const variantClasses = {
    default: "bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]/90",
    destructive: "bg-[var(--destructive)] text-[var(--destructive-foreground)] hover:bg-[var(--destructive)]/90",
    outline: "border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]",
    secondary: "bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:bg-[var(--secondary)]/80",
    ghost: "hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]",
    link: "text-[var(--primary)] underline-offset-4 hover:underline",
  };

  // Size styles
  const sizeClasses = {
    default: "h-9 px-4 py-2",
    sm: "h-8 rounded-[var(--radius-button)] px-3",
    lg: "h-10 rounded-[var(--radius-button)] px-6",
    icon: "size-9 rounded-[var(--radius-button)]",
  };

  const baseClasses = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-button)] transition-all disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2";

  const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      className: combinedClasses,
      ...props,
    });
  }

  return (
    <button className={combinedClasses} {...props}>
      {children}
    </button>
  );
}
