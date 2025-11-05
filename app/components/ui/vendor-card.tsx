"use client";

import Image from "next/image";
import { Card, CardContent, CardFooter, CardHeader } from "@/app/components/ui/card";
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

export default function VendorCard({
  vendor,
}: {
  vendor: Vendor;
}) {
  const { name, verified, rating, reviewCount, tags, summary, gallery, avatar } = vendor;

  return (
    <Card className="w-full">
      <CardHeader className="p-4 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          {/* Left: avatar + title */}
          <div className="flex items-start gap-3 min-w-0">
            <Avatar className="h-12 w-12">
              <AvatarImage src={avatar ?? ""} alt={name} />
              <AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-semibold leading-tight truncate">{name}</h2>
                {verified && (
                  <Check className="text-primary" />
                )}
              </div>

              {/* Rating */}
              <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                <RatingStars value={rating} />
                <span className="font-medium text-foreground">{rating.toFixed(1)}</span>
                <span>({reviewCount} review)</span>
              </div>

              {/* Tags/Layanan */}
              <div className="mt-2 flex flex-wrap gap-2">
                {tags.map((t, i) => (
                  <Badge key={i} variant="secondary" className="rounded-full">
                    {t}
                  </Badge>
                ))}
              </div>

              {/* Ringkasan */}
              <p className="mt-3 text-sm text-foreground/80 line-clamp-3">{summary}</p>
            </div>
          </div>

          {/* Right: actions */}
          <div className="flex flex-col items-end gap-3 shrink-0">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Simpan">
                    <Heart className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Simpan</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <div className="flex gap-2">
              <Button className="min-w-[150px]">Pesan Sekarang</Button>
              <Button variant="outline" className="min-w-[130px]">Lihat Profil</Button>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 sm:px-6 pb-4">
        {/* Gallery thumbnails */}
        <div className="mt-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Hasil Pekerjaan</span>
            <Button variant="link" className="p-0 h-auto text-sm">11+ Lainnya</Button>
          </div>

          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-3">
              {gallery.map((img, i) => (
                <div key={i} className="w-[96px] shrink-0">
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
      </CardContent>

      <Separator />
      <CardFooter className="py-3 px-4 sm:px-6" />
    </Card>
  );
}

function Check({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${className ?? ""}`}>
      <CheckCircle2 className="h-4 w-4" />
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
            className={`h-4 w-4 ${filled ? "fill-current" : ""}`}
            aria-hidden="true"
          />
        );
      })}
      <span className="sr-only">{value} dari 5</span>
    </div>
  );
}
