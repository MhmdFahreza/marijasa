"use client";

import Image from "next/image";
import { Card, CardHeader } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { ScrollArea, ScrollBar } from "@/app/components/ui/scroll-area";
import { AspectRatio } from "@/app/components/ui/aspect-ratio";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/app/components/ui/tooltip";
import { Separator } from "@/app/components/ui/separator";
import { Heart, Star, CheckCircle2 } from "lucide-react";

type WorkImage = { src: string; alt: string };

export type Vendor = {
  id: string;
  name: string;
  verified?: boolean;
  rating: number;
  reviewCount: number;
  tags: string[];
  summary: string;
  gallery: WorkImage[];
  avatar?: string;
};

export default function VendorCard({ vendor }: { vendor: Vendor }) {
  const { name, verified, rating, reviewCount, tags, summary, gallery, avatar } = vendor;

  return (
    <Card className="w-full overflow-hidden rounded-2xl md:rounded-3xl">
      <CardHeader className="p-4 sm:p-5 md:p-6">
        {/* Mobile: flex-col, Tablet/Desktop: 2 kolom grid fix */}
        <div
          className="
            flex flex-col gap-4
            md:grid md:grid-cols-[minmax(0,3fr)_minmax(260px,2fr)]
            md:gap-4 md:items-start
          "
        >
          {/* KIRI: info vendor */}
          <div className="flex items-start gap-3 md:gap-4 min-w-0">
            <Avatar className="h-12 w-12 md:h-14 md:w-14 shrink-0">
              <AvatarImage src={avatar ?? ""} alt={name} />
              <AvatarFallback>
                {(name || "?")
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              {/* Nama + verified + like mobile */}
              <div className="flex items-start gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base sm:text-lg md:text-2xl font-semibold leading-tight truncate">
                      {name}
                    </h2>
                    {verified && <Check className="text-primary" />}
                  </div>
                </div>

                {/* Favorite mobile */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="ml-auto h-8 w-8 p-1.5 md:hidden"
                        aria-label="Simpan"
                      >
                        <Heart className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Simpan</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {/* Rating */}
              <div className="mt-1.5 flex items-center gap-2 text-xs sm:text-sm md:text-base text-muted-foreground">
                <RatingStars value={rating} />
                <span className="font-medium text-foreground">{rating.toFixed(1)}</span>
                <span>({reviewCount} review)</span>
              </div>

              {/* Tag mobile: max 2 + N lainnya */}
              <div className="mt-2 flex flex-wrap gap-1.5 items-center md:hidden">
                {tags.slice(0, 2).map((t, i) => (
                  <Badge
                    key={i}
                    variant="secondary"
                    className="rounded-full px-2 py-0.5 text-[10px]"
                  >
                    {t}
                  </Badge>
                ))}
                {tags.length > 2 && (
                  <span className="text-[9px] text-blue-500 font-medium">
                    +{tags.length - 2} lainnya
                  </span>
                )}
              </div>

              {/* Tag tablet/desktop: max 3 + N lainnya */}
              <div className="mt-2 hidden md:flex flex-wrap gap-1.5 items-center">
                {tags.slice(0, 3).map((t, i) => (
                  <Badge
                    key={i}
                    variant="secondary"
                    className="rounded-full px-2 py-0.5 text-xs md:text-sm"
                  >
                    {t}
                  </Badge>
                ))}
                {tags.length > 3 && (
                  <span className="text-[10px] md:text-xs text-blue-500 font-medium">
                    +{tags.length - 3} lainnya
                  </span>
                )}
              </div>

              {/* Deskripsi clamp */}
              <p className="mt-2 text-xs sm:text-sm md:text-base text-foreground/80 leading-relaxed line-clamp-2 md:line-clamp-5">
                {summary}
              </p>

              {/* Aksi mobile */}
              <div className="mt-3 flex gap-2 md:hidden">
                <Button className="flex-1 min-w-0 text-xs sm:text-sm">Pesan Sekarang</Button>
                <Button variant="outline" className="flex-1 min-w-0 text-xs sm:text-sm">
                  Lihat Profil
                </Button>
              </div>
            </div>
          </div>

          {/* KANAN: favorite + tombol + galeri (md+) */}
          <div className="hidden md:flex flex-col gap-3 items-end w-full pr-4">
            {/* Favorite desktop */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Simpan"
                    className="self-end"
                  >
                    <Heart className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Simpan</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Tombol aksi desktop */}
            <div className="flex gap-2 justify-end w-full">
              <Button className="min-w-[150px] px-4">Pesan Sekarang</Button>
              <Button variant="outline" className="min-w-[130px] px-4">
                Lihat Profil
              </Button>
            </div>

            {/* Galeri */}
            {gallery && gallery.length > 0 && (
              <div className="w-full mt-2">
                <div className="flex items-center justify-between mb-2 pr-1">
                  <span className="text-sm md:text-base text-muted-foreground">
                    Hasil Pekerjaan
                  </span>
                </div>
                <ScrollArea className="w-full whitespace-nowrap overflow-x-auto">
                  <div className="flex gap-3">
                    {gallery.map((img, i) => (
                      <div
                        key={i}
                        className="w-[96px] lg:w-[120px] xl:w-[140px] shrink-0"
                      >
                        <AspectRatio ratio={1}>
                          <Image
                            src={img.src}
                            alt={img.alt}
                            fill
                            unoptimized
                            className="rounded-md object-cover"
                          />
                        </AspectRatio>
                      </div>
                    ))}
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      {/* Separator & footer hanya md+ */}
      <Separator className="hidden md:block" />
      <div className="hidden md:block py-3 px-6" />
    </Card>
  );
}

function Check({ className }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] sm:text-xs md:text-sm font-medium ${className ?? ""}`}
    >
      <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5" />
      Verified
    </span>
  );
}

function RatingStars({ value }: { value: number }) {
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  const total = 5;

  return (
    <div className="flex items-center">
      {Array.from({ length: total }).map((_, i) => {
        const filled = i < full || (i === full && half);
        return (
          <Star
            key={i}
            className={`h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 ${
              filled ? "fill-current" : "text-muted-foreground/40"
            }`}
            aria-hidden="true"
          />
        );
      })}
      <span className="sr-only">{value} dari 5</span>
    </div>
  );
}
