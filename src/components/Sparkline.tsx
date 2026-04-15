/**
 * Zero-dependency SVG sparkline. Renders `data` as a smooth polyline.
 * Pass `className` to colour the stroke via `text-*` (uses currentColor).
 */
export function Sparkline({
  data,
  className = "",
  strokeWidth = 2,
}: {
  data: number[];
  className?: string;
  strokeWidth?: number;
}) {
  const max = Math.max(...data, 1);
  const n = data.length;
  if (n < 2) {
    return <div className={`h-16 w-full ${className}`} aria-hidden />;
  }
  const points = data
    .map(
      (v, i) =>
        `${(i / (n - 1)) * 100},${100 - (v / max) * 100}`,
    )
    .join(" ");
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className={`h-16 w-full ${className}`}
      aria-hidden
    >
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
