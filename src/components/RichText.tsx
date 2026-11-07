import { Fragment, type ReactNode } from 'react';
import { getGlossaryEntry } from '../content';
import { openExternal } from '../lib/platform';
import { openGlossary } from '../lib/ui';
import { sfx } from '../lib/sound';
import { Tex } from './Tex';

/*
 * Renders the inline text format used throughout the content:
 *   $tex$  $$display tex$$  `code`  **bold**  *italic*  [label](https://…)  [[glossary-id]]  [[glossary-id|label]]
 * A literal dollar sign is written \$.
 * Paragraph breaks ("\n\n") become separate paragraphs; single "\n" becomes <br>.
 */

// \u0001 stands in for an escaped dollar sign (\$) while tokenizing.
const ESC_DOLLAR = '\u0001';
const TOKEN = /(\$\$[^$]+\$\$|\$[^$]+\$)|(`[^`]+`)|(\[\[[^\]]+\]\])|(\[[^\]]+\]\(https?:\/\/[^)\s]+\))|(\*\*(?:[^*]|\*(?!\*))+\*\*)|(\*[^*\s][^*]*\*)/g;

function parseInline(raw: string, keyPrefix = ''): ReactNode[] {
  const text = raw.replace(/\\\$/g, ESC_DOLLAR);
  const out: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let n = 0;
  TOKEN.lastIndex = 0;
  const re = new RegExp(TOKEN.source, 'g');
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(...withBreaks(text.slice(last, m.index), `${keyPrefix}t${n}`));
    const key = `${keyPrefix}${n++}`;
    const tok = m[0];
    if (m[1]) {
      const display = tok.startsWith('$$');
      const tex = (display ? tok.slice(2, -2) : tok.slice(1, -1)).replaceAll(ESC_DOLLAR, '\\$');
      out.push(<Tex key={key} tex={tex} display={display} />);
    } else if (m[2]) {
      out.push(
        <code key={key} className="ic">
          {tok.slice(1, -1).replaceAll(ESC_DOLLAR, '$')}
        </code>,
      );
    } else if (m[3]) {
      const inner = tok.slice(2, -2);
      const [id, label] = inner.split('|').map((s) => s.trim());
      const entry = getGlossaryEntry(id);
      const before = text.slice(0, m.index).trimEnd();
      const sentenceStart = before === '' || /[.!?:]$/.test(before);
      out.push(
        <button
          key={key}
          type="button"
          className="gloss"
          onClick={(e) => {
            e.stopPropagation();
            sfx.tap();
            openGlossary(id);
          }}
          title={entry?.short.replace(/[`*[\]]/g, '')}
        >
          {label ? parseInline(label, key + 'l') : entry ? displayTerm(entry.term, entry.course, sentenceStart) : id}
        </button>,
      );
    } else if (m[4]) {
      const lm = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(tok)!;
      out.push(
        <a
          key={key}
          href={lm[2]}
          className="link"
          onClick={(e) => {
            e.preventDefault();
            void openExternal(lm[2]);
          }}
        >
          {lm[1]}
        </a>,
      );
    } else if (m[5]) {
      out.push(<strong key={key}>{parseInline(tok.slice(2, -2), key + 'b')}</strong>);
    } else if (m[6]) {
      out.push(<em key={key}>{parseInline(tok.slice(1, -1), key + 'i')}</em>);
    }
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(...withBreaks(text.slice(last), `${keyPrefix}t${n}`));
  return out;
}

/**
 * Terms are stored in Title Case ("Chain Rule"); mid-sentence they read better
 * in lowercase ("the chain rule"). Names ("Pythagorean Theorem", "L'Hôpital's
 * Rule"), symbols and acronyms are left untouched.
 */
const PROPER = /^(Pythagor|Euler|Newton|Riemann|Taylor|Maclaurin|Leibniz|Fermat|Rolle|L'H|De Moivre|Descartes|Heron|Gauss|Simpson|Cartesian|Fundamental Theorem)/;
function displayTerm(term: string, _course: string, sentenceStart: boolean): string {
  if (sentenceStart || PROPER.test(term)) return term;
  if (!/^[A-Z][a-z]+([ -][A-Za-z][a-z]+)*$/.test(term)) return term;
  return term.replace(/\b[A-Z](?=[a-z])/g, (c) => c.toLowerCase());
}

function withBreaks(s: string, key: string): ReactNode[] {
  const parts = s.replaceAll(ESC_DOLLAR, '$').split('\n');
  return parts.map((p, i) => (
    <Fragment key={key + i}>
      {i > 0 && <br />}
      {p}
    </Fragment>
  ));
}

/** Inline content (no wrapping paragraph). */
export function Inline({ text }: { text: string }) {
  return <>{parseInline(text)}</>;
}

/** Block content: splits on blank lines into paragraphs; ```fenced``` blocks become preformatted code/output. */
export function RichText({ text, className }: { text: string; className?: string }) {
  const parts = text.split(/```[a-z]*\n([\s\S]*?)\n?```/);
  return (
    <>
      {parts.map((part, pi) =>
        pi % 2 === 1 ? (
          <pre key={`f${pi}`} className="rt-pre">
            {part}
          </pre>
        ) : (
          part
            .split(/\n\s*\n/)
            .filter((p) => p.trim() !== '')
            .map((p, i) => (
              <p key={`${pi}-${i}`} className={className}>
                {parseInline(p.replace(/^\n+|\n+$/g, ''), `p${pi}-${i}-`)}
              </p>
            ))
        ),
      )}
    </>
  );
}

/** Strip inline markup to plain text (for search and titles). */
export function plainText(text: string): string {
  return text
    .replace(/\$\$?([^$]+)\$\$?/g, '$1')
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2')
    .replace(/\[\[([^\]]+)\]\]/g, (_, id: string) => getGlossaryEntry(id.trim())?.term ?? id)
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/```[a-z]*\n?/g, '')
    .replace(/\*\*|`|\*/g, '');
}
