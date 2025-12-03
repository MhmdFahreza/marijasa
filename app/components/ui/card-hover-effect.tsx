import { cn } from "@/app/components/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { useState, type ReactNode } from "react";

export const HoverEffect = ({
  items,
  className,
}: {
  items: {
    title: string;
    description: string;
  }[];
  className?: string;
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div
      className={cn(
        // Ubah ke grid-cols-2 untuk mobile, 3 untuk desktop
        "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 py-10 gap-2 md:gap-2 lg:gap-4",
        className
      )}
    >
      {items.map((item, idx) => (
        <div
          key={`${item.title}-${idx}`}
          className="relative group block p-1 md:p-1 lg:p-2 h-full w-full"
          onMouseEnter={() => setHoveredIndex(idx)}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <AnimatePresence>
            {hoveredIndex === idx && (
              <motion.span
                className="absolute inset-0 h-full w-full bg-neutral-200 dark:bg-slate-800/[0.8] block rounded-2xl md:rounded-3xl"
                layoutId="hoverBackground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: 0.15 } }}
                exit={{ opacity: 0, transition: { duration: 0.15, delay: 0.2 } }}
              />
            )}
          </AnimatePresence>

          <Card>
            <CardTitle>{item.title}</CardTitle>
            <CardDescription>{item.description}</CardDescription>
          </Card>
        </div>
      ))}
    </div>
  );
};

export const Card = ({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) => {
  return (
    <div
      className={cn(
        "rounded-xl md:rounded-xl lg:rounded-2xl h-full w-full p-2 md:p-2 lg:p-4 overflow-hidden bg-[#7CE0A8] border border-transparent dark:border-white/[0.2] group-hover:border-slate-700 relative z-20 flex flex-col",
        className
      )}
    >
      <div className="relative z-50 flex-1 flex flex-col">
        <div className="p-2 md:p-2 lg:p-4 flex-1 flex flex-col">{children}</div>
      </div>
    </div>
  );
};

export const CardTitle = ({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) => {
  return (
    <h4 className={cn("text-zinc-100 font-bold tracking-tight mt-1 md:mt-2 lg:mt-4 text-xs md:text-xs lg:text-base leading-tight md:leading-tight lg:leading-normal", className)}>
      {children}
    </h4>
  );
};

export const CardDescription = ({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) => {
  return (
    <p
      className={cn(
        "mt-1.5 md:mt-2 lg:mt-8 text-white/90 tracking-normal leading-snug text-[10px] md:text-[10px] lg:text-sm md:leading-snug lg:leading-relaxed flex-1",
        className
      )}
    >
      {children}
    </p>
  );
};