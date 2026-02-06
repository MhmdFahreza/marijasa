// app/components/ui/apple-cards-carousel.tsx
"use client";

import React, {
    useEffect,
    useRef,
    useState,
    createContext,
    useContext,
} from "react";
import {
    IconArrowNarrowLeft,
    IconArrowNarrowRight,
    IconX,
} from "@tabler/icons-react";
import { cn } from "@/app/components/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { useOutsideClick } from "@/app/components/lib/hooks/use-outside-click";

interface CarouselProps {
    items: React.ReactNode[];
    initialScroll?: number;
}

type CardData = {
    src: string;
    title: string;
    category: string;
    content: React.ReactNode;
};

export const CarouselContext = createContext<{
    onCardClose: (index: number) => void;
    currentIndex: number;
}>({
    onCardClose: () => { },
    currentIndex: 0,
});

export const Carousel = ({ items, initialScroll = 0 }: CarouselProps) => {
    const carouselRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (carouselRef.current) {
            carouselRef.current.scrollLeft = initialScroll;
            checkScrollability();
        }
    }, [initialScroll]);

    const checkScrollability = () => {
        const el = carouselRef.current;
        if (!el) return;
        const { scrollLeft, scrollWidth, clientWidth } = el;
        setCanScrollLeft(scrollLeft > 0);
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    };

    const scrollLeft = () => {
        if (carouselRef.current) {
            carouselRef.current.scrollBy({ left: -300, behavior: "smooth" });
        }
    };

    const scrollRight = () => {
        if (carouselRef.current) {
            carouselRef.current.scrollBy({ left: 300, behavior: "smooth" });
        }
    };

    const isMobile = () => {
        if (typeof window === "undefined") return false;
        return window.innerWidth < 768;
    };

    const handleCardClose = (index: number) => {
        const el = carouselRef.current;
        if (!el) return;
        const cardWidth = isMobile() ? 230 : 384;
        const gap = isMobile() ? 4 : 8;
        const scrollPosition = (cardWidth + gap) * (index + 1);
        el.scrollTo({
            left: scrollPosition,
            behavior: "smooth",
        });
        setCurrentIndex(index);
    };

    return (
        <CarouselContext.Provider
            value={{ onCardClose: handleCardClose, currentIndex }}
        >
            <div className="relative w-full">
                <div
                    ref={carouselRef}
                    onScroll={checkScrollability}
                    className="flex w-full overflow-x-scroll overscroll-x-auto scroll-smooth py-10 [scrollbar-width:none] md:py-20"
                >
                    <div className="absolute right-0 z-[1000] h-auto w-[5%] overflow-hidden bg-gradient-to-l" />
                    <div
                        className={cn(
                            "flex flex-row justify-start gap-4 pl-4",
                            "mx-auto max-w-7xl",
                        )}
                    >
                        {items.map((item, index) => (
                            <motion.div
                                key={`card-${index}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{
                                    opacity: 1,
                                    y: 0,
                                    transition: {
                                        duration: 0.5,
                                        delay: 0.2 * index,
                                        ease: "easeOut",
                                    },
                                }}
                                className="rounded-3xl last:pr-[5%] md:last:pr-[33%]"
                            >
                                {item}
                            </motion.div>
                        ))}
                    </div>
                </div>
                <div className="mr-10 flex justify-end gap-2">
                    <button
                        className="relative z-40 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 disabled:opacity-50"
                        onClick={scrollLeft}
                        disabled={!canScrollLeft}
                    >
                        <IconArrowNarrowLeft className="h-6 w-6 text-gray-500" />
                    </button>
                    <button
                        className="relative z-40 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 disabled:opacity-50"
                        onClick={scrollRight}
                        disabled={!canScrollRight}
                    >
                        <IconArrowNarrowRight className="h-6 w-6 text-gray-500" />
                    </button>
                </div>
            </div>
        </CarouselContext.Provider>
    );
};

export const Card = ({
    card,
    index,
    layout = false,
}: {
    card: CardData;
    index: number;
    layout?: boolean;
}) => {
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const { onCardClose } = useContext(CarouselContext);

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                handleClose();
            }
        };

        if (open) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
        }

        window.addEventListener("keydown", onKeyDown);
        return () => {
            window.removeEventListener("keydown", onKeyDown);
            document.body.style.overflow = "auto";
        };
    }, [open]);

    useOutsideClick(
        containerRef as React.RefObject<HTMLDivElement>,
        () => handleClose(),
    );

    const handleOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        onCardClose(index);
    };

    return (
        <>
            <AnimatePresence>
                {open && (
                    <div className="fixed inset-0 z-50 h-screen overflow-auto">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 h-full w-full bg-black/80 backdrop-blur-lg"
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 8 }}
                            ref={containerRef}
                            layoutId={layout ? `card-${card.title}` : undefined}
                            className="relative z-[60] mx-auto my-10 h-fit max-w-5xl rounded-3xl bg-white p-4 font-sans md:p-10 dark:bg-neutral-900"
                        >
                            <button
                                className="sticky top-4 right-0 ml-auto flex h-8 w-8 items-center justify-center rounded-full bg-black dark:bg-white"
                                onClick={handleClose}
                            >
                                <IconX className="h-6 w-6 text-neutral-100 dark:text-neutral-900" />
                            </button>
                            <motion.p
                                layoutId={layout ? `category-${card.title}` : undefined}
                                className="text-base font-medium text-black dark:text-white"
                            >
                                {card.category}
                            </motion.p>
                            <motion.p
                                layoutId={layout ? `title-${card.title}` : undefined}
                                className="mt-4 text-2xl font-semibold text-neutral-700 md:text-5xl dark:text-white"
                            >
                                {card.title}
                            </motion.p>
                            <div className="py-10">{card.content}</div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <motion.button
                layoutId={layout ? `card-${card.title}` : undefined}
                onClick={handleOpen}
                className="relative z-10 flex h-80 w-56 flex-col items-start justify-start overflow-hidden rounded-3xl bg-gray-100 md:h-[40rem] md:w-96 dark:bg-neutral-900"
            >
                <div className="pointer-events-none absolute inset-x-0 top-0 z-30 h-full bg-gradient-to-b from-black/50 via-transparent to-transparent" />

                <div className="relative z-40 p-8">
                    <motion.p
                        layoutId={layout ? `category-${card.category}` : undefined}
                        className="text-left font-sans text-sm font-medium text-white md:text-base"
                    >
                        {card.category}
                    </motion.p>

                    {/* 🔧 Tambahkan kembali title di front card */}
                    <motion.p
                        layoutId={layout ? `title-${card.title}` : undefined}
                        className="mt-2 max-w-xs text-left font-sans text-xl font-semibold [text-wrap:balance] text-white md:text-3xl"
                    >
                        {card.title}
                    </motion.p>
                </div>

                <BlurImage
                    src={card.src}
                    alt={card.title}
                    className="absolute inset-0 z-10 h-full w-full object-cover"
                />
            </motion.button>
        </>
    );
};

type BlurImageProps = {
    src: string;
    alt?: string;
    className?: string;
    width?: number;
    height?: number;
};

export const BlurImage = ({
    src,
    alt,
    className,
    width,
    height,
}: BlurImageProps) => {
    return (
        <img
            src={src}
            alt={alt ?? "Background"}
            width={width}
            height={height}
            loading="eager"
            decoding="async"
            className={cn("h-full w-full object-cover", className)}
        />
    );
};
