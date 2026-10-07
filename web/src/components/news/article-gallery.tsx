import { Image } from '@unpic/react';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useSyncExternalStore } from 'react';

import { Button } from '@/components/ui/button';
import { hideBrokenImage } from '@/utils/format';

const reduceMotion = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

function parseState(snapshot: string): [number, boolean, boolean] {
  const [index, prev, next] = snapshot.split('|');
  return [Number(index), prev === 'true', next === 'true'];
}

export function ArticleGallery({ images, title }: Readonly<{ images: string[]; title?: string }>) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    duration: reduceMotion ? 0 : 18,
  });

  const subscribe = useCallback(
    (onChange: () => void) => {
      if (!emblaApi) return () => {};
      emblaApi.on('select', onChange).on('reInit', onChange);
      return () => {
        emblaApi.off('select', onChange).off('reInit', onChange);
      };
    },
    [emblaApi],
  );

  const getSnapshot = useCallback(() => {
    if (!emblaApi) return '0|false|false';
    return [emblaApi.selectedScrollSnap(), emblaApi.canScrollPrev(), emblaApi.canScrollNext()].join(
      '|',
    );
  }, [emblaApi]);

  const snapshot = useSyncExternalStore(subscribe, getSnapshot, () => '0|false|false');
  const [index, canPrev, canNext] = parseState(snapshot);

  return (
    <section
      className="relative mt-6"
      aria-roledescription="carousel"
      aria-label={title ?? 'ภาพประกอบ'}
    >
      <div className="overflow-hidden border border-foreground/15" ref={emblaRef}>
        <div className="flex">
          {images.map((src, position) => (
            <div key={src} className="min-w-0 shrink-0 grow-0 basis-full">
              <Image
                src={src}
                alt={title ? `${title} — ภาพที่ ${position + 1}` : ''}
                width={1200}
                height={675}
                layout="constrained"
                loading={position === 0 ? 'eager' : 'lazy'}
                decoding="async"
                onError={hideBrokenImage}
                className="aspect-video w-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>

      {images.length > 1 && (
        <>
          {canPrev && (
            <Button
              aria-label="รูปก่อนหน้า"
              variant="solid"
              size="icon"
              onClick={() => emblaApi?.scrollPrev()}
              className="absolute top-1/2 left-3 -translate-y-1/2"
            >
              <ChevronLeft aria-hidden="true" className="size-4" />
            </Button>
          )}
          {canNext && (
            <Button
              aria-label="รูปถัดไป"
              variant="solid"
              size="icon"
              onClick={() => emblaApi?.scrollNext()}
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
