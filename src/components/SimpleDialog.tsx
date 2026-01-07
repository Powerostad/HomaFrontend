import { ReactNode, useEffect, useState } from "react";

interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}

export function SimpleDialog({ open, onOpenChange, children }: DialogProps) {
  const [isOpen, setIsOpen] = useState(open || false);

  useEffect(() => {
    setIsOpen(open || false);
  }, [open]);

  const handleClose = () => {
    setIsOpen(false);
    onOpenChange?.(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 animate-in fade-in-0"
        onClick={handleClose}
      />
      {/* Content wrapper */}
      <div className="relative z-50">{children}</div>
    </div>
  );
}

interface DialogTriggerProps {
  asChild?: boolean;
  children: ReactNode;
  onClick?: () => void;
}

export function SimpleDialogTrigger({ children, onClick }: DialogTriggerProps) {
  return <div onClick={onClick}>{children}</div>;
}

interface DialogContentProps {
  children: ReactNode;
  className?: string;
  onClose?: () => void;
}

export function SimpleDialogContent({ children, className = "" }: DialogContentProps) {
  return (
    <div
      className={`relative bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 grid w-full max-w-[calc(100%-2rem)] gap-4 rounded-lg border p-6 shadow-lg sm:max-w-lg ${className}`}
    >
      {children}
    </div>
  );
}

interface DialogHeaderProps {
  children: ReactNode;
  className?: string;
}

export function SimpleDialogHeader({ children, className = "" }: DialogHeaderProps) {
  return (
    <div className={`flex flex-col gap-2 text-center sm:text-start ${className}`}>
      {children}
    </div>
  );
}

export function SimpleDialogFooter({ children, className = "" }: DialogHeaderProps) {
  return (
    <div className={`flex flex-col-reverse gap-2 sm:flex-row sm:justify-end ${className}`}>
      {children}
    </div>
  );
}

interface DialogTitleProps {
  children: ReactNode;
  className?: string;
}

export function SimpleDialogTitle({ children, className = "" }: DialogTitleProps) {
  return <h2 className={`leading-none ${className}`}>{children}</h2>;
}

export function SimpleDialogDescription({ children, className = "" }: DialogTitleProps) {
  return <p className={`text-muted-foreground text-sm ${className}`}>{children}</p>;
}