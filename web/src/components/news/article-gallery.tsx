import { Image } from '@unpic/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { hideBrokenImage } from '@/utils/format';

export function ArticleGallery({ images }: Readonly<{ images: string[] }>) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const last = images.length - 1;

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return () => {};
    const onScroll = () => {
      const width = track.clientWidth || 1;
      setIndex(Math.round(track.scrollLeft / width));
    };
    track.addEventListener('scroll', onScroll, { passive: true });
    return () => track.removeEventListener('scroll', onScroll);
  }, []);

  function go(delta: number) {
    const track = trackRef.current;
    if (!track) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    track.scrollBy({ left: delta * track.clientWidth, behavior: reduce ? 'auto' : 'smooth' });
  }

  return (
    <div className="relative mt-6">
      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory scrollbar-none overflow-x-auto scroll-smooth border border-foreground/15 motion-reduce:scroll-auto"
      >
        {images.map((src, position) => (
          <Image
            key={src}
            src={src}
            alt=""
            width={1200}
            height={675}
            layout="constrained"
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
              onClick={() => go(-1)}
              className="absolute top-1/2 left-3 -translate-y-1/2"
            >
              <ChevronLeft aria-hidden="true" className="size-4" />
            </Button>
          )}
          {index < last && (
            <Button
              aria-label="รูปถัดไป"
              variant="solid"
              size="icon"
              onClick={() => go(1)}
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
    </div>
  );
}
