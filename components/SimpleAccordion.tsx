import { useState, ReactNode } from "react";
import { ChevronDown } from "lucide-react";

interface AccordionItemProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

export function SimpleAccordionItem({ title, children, defaultOpen = false }: AccordionItemProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-border last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-start justify-between gap-4 py-4 text-start transition-all outline-none hover:underline"
        aria-expanded={isOpen}
      >
        <span>{title}</span>
        <ChevronDown
          className={`text-muted-foreground size-4 shrink-0 translate-y-0.5 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          isOpen ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="pb-4 pt-0">{children}</div>
      </div>
    </div>
  );
}

interface SimpleAccordionProps {
  children: ReactNode;
  className?: string;
}

export function SimpleAccordion({ children, className = "" }: SimpleAccordionProps) {
  return <div className={className}>{children}</div>;
}
