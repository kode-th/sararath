import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { hideBrokenImage } from '@/utils/format';

const reduceMotion = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

export function ArticleGallery({ images, title }: Readonly<{ images: string[]; title?: string }>) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState(0);
  const [zoomed, setZoomed] = useState<string | null>(null);

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
          <button
            key={src}
            type="button"
            aria-label={title ? `ดูภาพที่ ${position + 1} ขนาดเต็ม` : 'ดูภาพขนาดเต็ม'}
            onClick={() => {
              setZoomed(src);
              dialogRef.current?.showModal();
            }}
            className="w-full shrink-0 cursor-zoom-in snap-center"
          >
            <img
              src={src}
              alt={title ? `${title} — ภาพที่ ${position + 1}` : ''}
              width={1200}
              height={675}
              loading={position === 0 ? 'eager' : 'lazy'}
              decoding="async"
              onError={hideBrokenImage}
              className="aspect-video w-full object-cover"
            />
          </button>
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

      <dialog
        ref={dialogRef}
        aria-label="ภาพขนาดเต็ม"
        onClose={() => setZoomed(null)}
        className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none bg-transparent p-0 backdrop:bg-black/80"
      >
        <button
          type="button"
          aria-label="ปิดภาพขนาดเต็ม"
          onClick={() => dialogRef.current?.close()}
          className="flex h-full w-full cursor-zoom-out items-center justify-center"
        >
          {zoomed && <img src={zoomed} alt="" className="max-h-full max-w-full object-contain" />}
        </button>
        <button
          type="button"
          aria-label="ปิด"
          onClick={() => dialogRef.current?.close()}
          className="absolute top-3 right-3 flex size-11 items-center justify-center bg-foreground/80 text-primary-foreground hover:bg-foreground"
        >
          <X aria-hidden="true" className="size-5" />
        </button>
      </dialog>
    </section>
  );
}
