import { useId } from 'react';
import type { CourseId } from '../content/types';

const GLYPHS: Record<CourseId, { from: string; to: string; shape: 'hex' | 'circle' | 'square' | 'drop'; text: string; size: number; italic?: boolean; mono?: boolean }> = {
  python: { from: '#4ade80', to: '#15803d', shape: 'hex', text: '>>>', size: 17, mono: true },
  pyml: { from: '#2dd4bf', to: '#0e7490', shape: 'circle', text: '∇', size: 30 },
};

/** Course emblems: a coloured badge with the course's signature symbol. */
export function CourseGlyph({ course, size = 48, className }: { course: CourseId; size?: number; className?: string }) {
  // Gradient ids must be unique per instance: a duplicate id inside a hidden
  // (display: none) subtree makes every other reference to it render empty.
  const gid = `g-${course}-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const g = GLYPHS[course] ?? GLYPHS.python;
  const fill = `url(#${gid})`;
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={g.from} />
          <stop offset="1" stopColor={g.to} />
        </linearGradient>
      </defs>
      {g.shape === 'hex' && (
        <>
          <path d="M32 3l25 14.5v29L32 61 7 46.5v-29z" fill={fill} />
          <path d="M32 3l25 14.5L32 32z" fill="#ffffff" opacity="0.12" />
        </>
      )}
      {g.shape === 'circle' && (
        <>
          <circle cx="32" cy="32" r="29" fill={fill} />
          <circle cx="32" cy="32" r="22.5" fill="none" stroke="#fff" strokeOpacity="0.3" strokeWidth="2" />
        </>
      )}
      {g.shape === 'square' && (
        <>
          <rect x="5" y="5" width="54" height="54" rx="15" fill={fill} />
          <path d="M5 20C5 11.7 11.7 5 20 5h39L5 59z" fill="#fff" opacity="0.1" />
        </>
      )}
      {g.shape === 'drop' && (
        <>
          <path d="M32 3c14 10 27 22 27 35a27 23 0 0 1-54 0C5 25 18 13 32 3z" fill={fill} />
          <path d="M32 3c14 10 27 22 27 35H5C5 25 18 13 32 3z" fill="#fff" opacity="0.1" />
        </>
      )}
      <text
        x="32"
        y={g.shape === 'drop' ? 47 : g.mono ? 38 : 41}
        textAnchor="middle"
        fontFamily={g.mono ? "'JetBrains Mono', ui-monospace, monospace" : "'Times New Roman', Georgia, serif"}
        fontStyle={g.italic ? 'italic' : 'normal'}
        fontWeight="700"
        fontSize={g.size}
        fill="#fff"
      >
        {g.text}
      </text>
    </svg>
  );
}
