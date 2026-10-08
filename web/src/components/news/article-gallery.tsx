import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { hideBrokenImage } from '@/utils/format';

const reduceMotion = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

export function ArticleGallery({ images, title }: Readonly<{ images: string[]; title?: string }>) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  function scrollTo(position: number) {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({
      left: position * track.clientWidth,
      behavior: reduceMotion ? 'auto' : 'smooth',
    });
  }

  return (
    <section
      className="relative mt-6"
      aria-roledescription="carousel"
      aria-label={title ?? 'ภาพประกอบ'}
    >
      <div
        ref={trackRef}
        onScroll={(event) => {
          const track = event.currentTarget;
          setIndex(Math.round(track.scrollLeft / track.clientWidth));
        }}
        className="flex snap-x snap-mandatory scrollbar-none overflow-x-auto border border-foreground/15"
      >
        {images.map((src, position) => (
          <img
            key={src}
            src={src}
            alt={title ? `${title} — ภาพที่ ${position + 1}` : ''}
            width={1200}
            height={675}
            loading={position === 0 ? 'eager' : 'lazy'}
            decoding="async"
            onError={hideBrokenImage}
            className="aspect-video w-full shrink-0 snap-center object-cover"
          />
        ))}
      </div>

      {images.length > 1 && (
        <>
          {index > 0 && (
            <Button
              aria-label="รูปก่อนหน้า"
              variant="solid"
              size="icon"
              onClick={() => scrollTo(index - 1)}
              className="absolute top-1/2 left-3 -translate-y-1/2"
            >
              <ChevronLeft aria-hidden="true" className="size-4" />
            </Button>
          )}
          {index < images.length - 1 && (
            <Button
              aria-label="รูปถัดไป"
              variant="solid"
              size="icon"
              onClick={() => scrollTo(index + 1)}
              className="absolute top-1/2 right-3 -translate-y-1/2"
            >
              <ChevronRight aria-hidden="true" className="size-4" />
            </Button>
          )}
          <span className="absolute right-3 bottom-3 bg-foreground/80 px-2 py-0.5 text-xs text-primary-foreground">
            {index + 1} / {images.length}
          </span>
        </>
      )}
    </section>
  );
}
