import { useEffect, useLayoutEffect, useRef, useState } from 'react';

export interface TitleLine {
  start: number;
  text: string;
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
    if (node?.nodeType !== Node.TEXT_NODE) return;
    const value = node.textContent ?? '';
    const range = document.createRange();
    const result: TitleLine[] = [];
    let start = 0;
    let line = '';
    let top: number | null = null;
    for (let i = 0; i < value.length; i += 1) {
      range.setStart(node, i);
      range.setEnd(node, i + 1);
      const rect = range.getBoundingClientRect();
      if (top !== null && rect.height > 0 && Math.abs(rect.top - top) > 1) {
        result.push({ start, text: line.trimEnd() });
        start = i;
        line = '';
      }
      line += value[i];
      if (rect.height > 0) top = rect.top;
    }
    if (line) result.push({ start, text: line.trimEnd() });
    setLines(result);
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
