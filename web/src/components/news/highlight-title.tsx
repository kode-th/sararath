import { useSplitLines } from '@/hooks/useSplitLines';

export function HighlightTitle({ text }: Readonly<{ text: string }>) {
  const { ref, lines } = useSplitLines(text);

  return (
    <span ref={ref}>
      {lines === null || lines.length === 0
        ? text
        : lines.map((line, index) => (
            <span
              key={line.start}
              className="block highlight motion-safe:animate-highlight-sweep"
              style={{ animationDelay: `${200 + index * 130}ms` }}
            >
              {line.text}
            </span>
          ))}
    </span>
  );
}
