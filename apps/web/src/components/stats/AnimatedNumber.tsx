import { useEffect, useRef, useState } from "react";

export function AnimatedNumber({
  value,
  duration = 800,
}: {
  value: number;
  duration?: number;
}) {
  const [display, setDisplay] = useState(0);
  const startTime = useRef<number | null>(null);
  const frameRef = useRef<number>();

  useEffect(() => {
    startTime.current = null;
    const animate = (timestamp: number) => {
      if (startTime.current === null) startTime.current = timestamp;
      const progress = Math.min((timestamp - startTime.current) / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      setDisplay(Math.round(eased * value));
      if (progress < 1) frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [value, duration]);

  return <span>{display.toLocaleString()}</span>;
}
