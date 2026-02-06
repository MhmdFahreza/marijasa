"use client";
import { cn } from "@/app/components/lib/utils";
import { IconMenu2, IconX } from "@tabler/icons-react";
import {
    motion,
    AnimatePresence,
    useScroll,
    useMotionValueEvent,
} from "framer-motion";
import React, { useRef, useState } from "react";
import Flag from "react-world-flags";

import "@/app/components/lib/languange";
import { useTranslation } from "react-i18next";

interface NavbarProps {
    children: React.ReactNode;
    className?: string;
}

interface NavBodyProps {
    children: React.ReactNode;
    className?: string;
    visible?: boolean;
}

interface NavItemsProps {
    items: {
        name: string;
        link: string;
    }[];
    className?: string;
    onItemClick?: () => void;
}

interface MobileNavProps {
    children: React.ReactNode;
    className?: string;
    visible?: boolean;
}

interface MobileNavHeaderProps {
    children: React.ReactNode;
    className?: string;
}

interface MobileNavMenuProps {
    children: React.ReactNode;
    className?: string;
    isOpen: boolean;
    onClose: () => void;
}

interface LanguageSelectorProps {
    selectedLanguage: string;
    onSelectLanguage: (language: string) => void;
}

export const Navbar = ({ children, className }: NavbarProps) => {
    const ref = useRef<HTMLDivElement>(null);
    const { scrollY } = useScroll({
        target: ref,
        offset: ["start start", "end start"],
    });
    const [visible, setVisible] = useState<boolean>(false);

    useMotionValueEvent(scrollY, "change", (latest) => {
        setVisible(latest > 100);
    });

    return (
        <motion.div
            ref={ref}
            className={cn(
                "sticky inset-x-0 top-0 z-40 w-full bg-white dark:bg-neutral-950",
                className
            )}
        >
            {React.Children.map(children, (child) =>
                React.isValidElement(child)
                    ? React.cloneElement(
                        child as React.ReactElement<{ visible?: boolean }>,
                        { visible }
                    )
                    : child
            )}
        </motion.div>
    );
};

// NavBody - Tampil di md (768px) ke atas - untuk Desktop & Tablet
export const NavBody = ({ children, className, visible }: NavBodyProps) => {
    return (
        <motion.div
            animate={{
                backdropFilter: visible ? "blur(10px)" : "none",
                boxShadow: visible
                    ? "0 0 24px rgba(34, 42, 53, 0.06), 0 1px 1px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(34, 42, 53, 0.04), 0 0 4px rgba(34, 42, 53, 0.08), 0 16px 68px rgba(47, 48, 55, 0.05), 0 1px 0 rgba(255, 255, 255, 0.1) inset"
                    : "none",
                y: 0,
            }}
            transition={{ type: "spring", stiffness: 200, damping: 50 }}
            className={cn(
                "relative z-[60] hidden h-16 w-full flex-row items-center justify-between md:flex",
                "px-4 md:px-6 lg:px-8",
                "bg-white dark:bg-neutral-950 border-b border-neutral-200/70 dark:border-neutral-800/70",
                className
            )}
            style={{
                width: '100%',
                maxWidth: '100%',
            }}
        >
            {children}
        </motion.div>
    );
};

export const NavItems = ({ items, className, onItemClick }: NavItemsProps) => {
    const [hovered, setHovered] = useState<number | null>(null);
    return (
        <motion.div
            onMouseLeave={() => setHovered(null)}
            className={cn(
                "absolute inset-0 hidden flex-1 flex-row items-center justify-center space-x-2 text-sm font-medium text-zinc-600 transition duration-200 hover:text-zinc-800 lg:flex lg:space-x-2",
                className
            )}
        >
            {items.map((item, idx) => (
                <a
                    onMouseEnter={() => setHovered(idx)}
                    onClick={onItemClick}
                    className="relative px-4 py-2 text-neutral-600 dark:text-neutral-300"
                    key={`link-${idx}`}
                    href={item.link}
                >
                    {hovered === idx && (
                        <motion.div
                            layoutId="hovered"
                            className="absolute inset-0 h-full w-full rounded-full bg-gray-100 dark:bg-neutral-800"
                        />
                    )}
                    <span className="relative z-20">{item.name}</span>
                </a>
            ))}
        </motion.div>
    );
};

// MobileNav - Hanya tampil di < 768px
export const MobileNav = ({ children, className, visible }: MobileNavProps) => {
    return (
        <motion.div
            animate={{
                backdropFilter: visible ? "blur(10px)" : "none",
                boxShadow: visible
                    ? "0 0 24px rgba(34, 42, 53, 0.06), 0 1px 1px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(34, 42, 53, 0.04), 0 0 4px rgba(34, 42, 53, 0.08), 0 16px 68px rgba(47, 48, 55, 0.05), 0 1px 0 rgba(255, 255, 255, 0.1) inset"
                    : "none",
                y: 0,
            }}
            transition={{ type: "spring", stiffness: 200, damping: 50 }}
            className={cn(
                "relative z-50 flex w-full flex-col items-center justify-between px-4 py-2 md:hidden",
                "bg-white dark:bg-neutral-950 border-b border-neutral-200/70 dark:border-neutral-800/70",
                className
            )}
            style={{
                maxWidth: '100%',
            }}
        >
            {children}
        </motion.div>
    );
};

export const MobileNavHeader = ({ children, className }: MobileNavHeaderProps) => {
    return (
        <div className={cn("flex w-full flex-row items-center justify-between", className)}>
            {children}
        </div>
    );
};

export const MobileNavMenu = ({
    children,
    className,
    isOpen,
    onClose,
}: MobileNavMenuProps) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={cn(
                        "absolute inset-x-0 top-16 z-50 flex w-full flex-col items-start justify-start gap-4 rounded-lg bg-white px-4 py-8 shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset] dark:bg-neutral-950",
                        className
                    )}
                >
                    {children}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export const MobileNavToggle = ({
    isOpen,
    onClick,
}: {
    isOpen: boolean;
    onClick: () => void;
}) => {
    return isOpen ? (
        <IconX className="text-black dark:text-white" onClick={onClick} />
    ) : (
        <IconMenu2 className="text-black dark:text-white" onClick={onClick} />
    );
};

export const NavbarLogo = () => {
    return (
        <a
            href="#"
            className="relative z-20 flex items-center space-x-2 px-2 py-1 text-sm font-medium shrink-0"
        >
            <img
                src="/icon512_maskable.png"
                alt="logo"
                width={60}
                height={60}
                className="object-contain"
            />
            <span className="font-bold text-[clamp(1rem,6vw,1.5rem)] text-[#7CE0A8] dark:text-white font-poppins whitespace-nowrap">
                MARIJASA
            </span>
        </a>
    );
};

export const NavbarButton = ({
    href,
    as: Tag = "a",
    children,
    className,
    variant = "primary",
    ...props
}: {
    href?: string;
    as?: React.ElementType;
    children: React.ReactNode;
    className?: string;
    variant?: "primary" | "secondary" | "dark" | "gradient" | "ghost" | "outline";
} & (React.ComponentPropsWithoutRef<"a"> | React.ComponentPropsWithoutRef<"button">)) => {
    const baseStyles =
        "px-4 py-2 rounded-md bg-white button bg-white text-black text-sm font-bold relative cursor-pointer hover:-translate-y-0.5 transition duration-200 inline-block text-center whitespace-nowrap";

    const variantStyles = {
        primary:
            "shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]",
        secondary: "bg-transparent shadow-none dark:text-white",
        dark: "bg-black text-white shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]",
        gradient:
            "bg-gradient-to-b from-blue-500 to-blue-700 text-white shadow-[0px_2px_0px_0px_rgba(255,255,255,0.3)_inset]",
        ghost: "bg-transparent shadow-none text-black dark:text-white hover:bg-transparent",
        outline: "border border-gray-300 text-gray-700 bg-transparent hover:bg-gray-50 dark:border-neutral-700 dark:text-gray-300 dark:hover:bg-neutral-800",
    } as const;

    return (
        <Tag
            href={href || undefined}
            className={cn(baseStyles, variantStyles[variant], className)}
            {...props}
        >
            {children}
        </Tag>
    );
};

export const LanguageSelector = ({
    selectedLanguage,
    onSelectLanguage,
}: LanguageSelectorProps) => {
    const [isOpen, setIsOpen] = useState(false);

    const availableLanguages = [
        { code: "id", label: "ID", flag: "ID" },
        { code: "en", label: "EN", flag: "US" },
    ] as const;

    const currentLang =
        availableLanguages.find((l) => l.code === selectedLanguage) ||
        availableLanguages[0];

    return (
        <div className="relative inline-block shrink-0">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-1 rounded-full px-2 py-1 text-sm font-medium transition hover:bg-gray-100 dark:hover:bg-neutral-800"
            >
                <Flag code={currentLang.flag} style={{ width: 20, height: 20 }} />
                <span className="text-xs">{currentLang.label}</span>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute left-0 top-[100%] z-50 w-32 rounded-md bg-white shadow-lg dark:bg-neutral-800"
                    >
                        {availableLanguages.map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => {
                                    onSelectLanguage(lang.code);
                                    setIsOpen(false);
                                }}
                                className={`flex w-full items-center space-x-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-neutral-700 ${selectedLanguage === lang.code
                                    ? "bg-gray-200 dark:bg-neutral-700"
                                    : ""
                                    }`}
                            >
                                <Flag code={lang.flag} style={{ width: 16, height: 16 }} />
                                <span>{lang.label}</span>
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};