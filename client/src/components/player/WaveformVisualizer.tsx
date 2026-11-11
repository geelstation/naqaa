import { useMemo } from 'react';

interface WaveformVisualizerProps {
  isPlaying: boolean;
  bars?: number;
  className?: string;
}

export default function WaveformVisualizer({
  isPlaying,
  bars = 32,
  className = '',
}: WaveformVisualizerProps) {
  // Pre-generate bar heights with a pattern
  const heights = useMemo(() => {
    return Array.from({ length: bars }, (_, i) => {
      const t = i / bars;
      // Mix of sine waves for natural look
      const h = 0.3 + 0.4 * Math.sin(t * Math.PI * 2) + 0.3 * Math.sin(t * Math.PI * 6);
      return Math.max(0.15, Math.min(1, h));
    });
  }, [bars]);

  return (
    <div className={`flex items-center justify-center gap-1 h-full ${className}`}>
      {heights.map((h, i) => (
        <div
          key={i}
          className={`w-1 rounded-full bg-naqaa-400 ${isPlaying ? 'animate-wave' : ''}`}
          style={{
            height: `${h * 100}%`,
            animationDelay: `${i * 0.05}s`,
            animationDuration: `${1 + (i % 3) * 0.3}s`,
            opacity: isPlaying ? 1 : 0.4,
            transform: isPlaying ? undefined : 'scaleY(0.5)',
          }}
        />
      ))}
    </div>
  );
}
