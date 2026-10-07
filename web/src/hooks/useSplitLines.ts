import { useEffect, useLayoutEffect, useRef, useState } from 'react';

export interface TitleLine {
  start: number;
  text: string;
}

function measureLines(node: Text, value: string): TitleLine[] {
  if (!value) return [];
  const range = document.createRange();
  range.selectNodeContents(node);
  const boxCount = range.getClientRects().length;
  if (boxCount <= 1) return [{ start: 0, text: value }];

  const topAt = (index: number) => {
    range.setStart(node, index);
    range.setEnd(node, index + 1);
    return range.getBoundingClientRect().top;
  };

  const result: TitleLine[] = [];
  let start = 0;
  let top = topAt(0);
  for (let line = 1; line < boxCount && start < value.length; line += 1) {
    let low = start + 1;
    let high = value.length;
    while (low < high) {
      const mid = (low + high) >> 1;
      if (topAt(mid) > top + 1) high = mid;
      else low = mid + 1;
    }
    if (low >= value.length) break;
    result.push({ start, text: value.slice(start, low).trimEnd() });
    start = low;
    top = topAt(start);
  }
  result.push({ start, text: value.slice(start).trimEnd() });
  return result;
}

export function useSplitLines(text: string) {
  const ref = useRef<HTMLSpanElement>(null);
  const widthRef = useRef(0);
  const textRef = useRef(text);
  const [ready, setReady] = useState(false);
  const [lines, setLines] = useState<TitleLine[] | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        await document.fonts?.ready;
      } catch {
        // Fall back to the metrics available at load.
      }
      if (active) setReady(true);
    };
    void load();
    return () => {
      active = false;
    };
  }, []);

  useLayoutEffect(() => {
    if (textRef.current !== text) {
      textRef.current = text;
      setLines(null);
      return;
    }
    if (!ready || lines !== null) return;
    const node = ref.current?.firstChild;
    if (!(node instanceof Text)) return;
    setLines(measureLines(node, node.textContent ?? ''));
  }, [ready, lines, text]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return () => {};
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0;
      if (widthRef.current === 0) widthRef.current = width;
      else if (Math.abs(width - widthRef.current) >= 1) {
        widthRef.current = width;
        setLines(null);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, lines };
}
