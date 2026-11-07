import katex from 'katex';
import { memo } from 'react';

/*
 * KaTeX rendering with a small cache. Content TeX is validated at build time
 * (scripts/validate-content.ts), so errors here only come from live previews
 * of typed answers; those render in red instead of throwing.
 */

const cache = new Map<string, string>();

export function texToHtml(tex: string, display = false): string {
  const key = (display ? 'D' : 'I') + tex;
  let html = cache.get(key);
  if (html === undefined) {
    html = katex.renderToString(tex, { displayMode: display, throwOnError: false, strict: 'ignore', output: 'htmlAndMathml' });
    if (cache.size > 4000) cache.clear();
    cache.set(key, html);
  }
  return html;
}

export const Tex = memo(function Tex({ tex, display, className }: { tex: string; display?: boolean; className?: string }) {
  if (display) {
    // A span (styled display: block) so display math can also sit inside a paragraph.
    return <span className={`tex-display${className ? ' ' + className : ''}`} dangerouslySetInnerHTML={{ __html: texToHtml(tex, true) }} />;
  }
  return <span className={`tex${className ? ' ' + className : ''}`} dangerouslySetInnerHTML={{ __html: texToHtml(tex, false) }} />;
});
