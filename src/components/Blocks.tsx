import { useState } from 'react';
import type { Block, CalloutVariant, DerivationStep } from '../content/types';
import { CodeBlock } from './CodeBlock';
import { Graph } from './Graph';
import { Icon } from './Icon';
import { Inline, RichText } from './RichText';
import { Tex } from './Tex';
import { sfx } from '../lib/sound';

export const CALLOUT_META: Record<CalloutVariant, { icon: string; label: string }> = {
  why: { icon: 'bulb', label: 'Why does it work this way?' },
  tip: { icon: 'sparkles', label: 'Tip' },
  warning: { icon: 'warning', label: 'Watch out' },
  note: { icon: 'info', label: 'Note' },
  code: { icon: 'code', label: 'In real projects' },
  pythonic: { icon: 'leaf', label: 'The Pythonic way' },
  cpp: { icon: 'braces', label: 'Coming from C++' },
  under: { icon: 'cpu', label: 'Under the hood' },
  exam: { icon: 'target', label: 'Interview tip' },
  history: { icon: 'history', label: 'A bit of history' },
  analogy: { icon: 'puzzle', label: 'Analogy' },
};

export function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <div className="blocks">
      {blocks.map((b, i) => (
        <BlockView key={i} block={b} />
      ))}
    </div>
  );
}

function BlockView({ block: b }: { block: Block }) {
  switch (b.type) {
    case 'p':
      return <RichText text={b.text} className="para" />;
    case 'heading':
      return (
        <h3 className="block-heading">
          <Inline text={b.text} />
        </h3>
      );
    case 'math':
      return (
        <figure className="math-block">
          <Tex tex={b.tex} display />
          {b.caption && (
            <figcaption>
              <Inline text={b.caption} />
            </figcaption>
          )}
        </figure>
      );
    case 'derivation':
      return <Derivation title={b.title} steps={b.steps} result={b.result} />;
    case 'graph':
      return <Graph g={b} />;
    case 'theorem':
      return (
        <div className="theorem">
          <div className="theorem-name">
            <Icon name="award" size={16} /> <Inline text={b.name} />
          </div>
          {b.tex && <Tex tex={b.tex} display />}
          {b.text && <RichText text={b.text} />}
        </div>
      );
    case 'code':
      return (
        <CodeBlock
          code={b.code}
          lang={b.lang}
          title={b.title}
          output={b.output}
          annotations={b.annotations}
          highlight={b.highlight}
          runnable={b.runnable}
          stdin={b.stdin}
          packages={b.packages}
          desktopOnly={b.desktopOnly}
          outputVaries={b.outputVaries}
        />
      );
    case 'callout': {
      const meta = CALLOUT_META[b.variant];
      return (
        <aside className={`callout callout-${b.variant}`}>
          <div className="callout-icon">
            <Icon name={meta.icon} size={18} />
          </div>
          <div className="callout-body">
            <div className="callout-title">
              <Inline text={b.title ?? meta.label} />
            </div>
            <RichText text={b.text} />
          </div>
        </aside>
      );
    }
    case 'list': {
      const Tag = b.ordered ? 'ol' : 'ul';
      return (
        <Tag className={`block-list${b.ordered ? ' ordered' : ''}`}>
          {b.items.map((it, i) => (
            <li key={i}>
              <Inline text={it} />
            </li>
          ))}
        </Tag>
      );
    }
    case 'table':
      return (
        <figure className="block-table">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  {b.headers.map((h, i) => (
                    <th key={i}>
                      <Inline text={h} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {b.rows.map((r, ri) => (
                  <tr key={ri}>
                    {r.map((c, ci) => (
                      <td key={ci}>
                        <Inline text={c} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {b.caption && (
            <figcaption>
              <Inline text={b.caption} />
            </figcaption>
          )}
        </figure>
      );
    case 'deepdive':
      return <DeepDive title={b.title} blocks={b.blocks} />;
    case 'compare':
      return (
        <div className="compare">
          {[b.left, b.right].map((side, i) => (
            <div key={i} className={`compare-side tone-${side.tone}`}>
              <div className="compare-title">
                {side.tone === 'good' && <Icon name="check" size={16} strokeWidth={3} />}
                {side.tone === 'bad' && <Icon name="x" size={16} strokeWidth={3} />}
                <Inline text={side.title} />
              </div>
              {side.tex && (
                <div className="compare-tex">
                  {side.tex.map((t, ti) => (
                    <Tex key={ti} tex={t} display />
                  ))}
                </div>
              )}
              {side.code && <CodeBlock code={side.code} lang={side.lang} bare compact />}
              {side.text && <RichText text={side.text} className="compare-text" />}
            </div>
          ))}
        </div>
      );
    case 'steps':
      return (
        <ol className="steps">
          {b.items.map((s, i) => (
            <li key={i}>
              <span className="step-num">{i + 1}</span>
              <div>
                <div className="step-title">
                  <Inline text={s.title} />
                </div>
                <RichText text={s.text} />
              </div>
            </li>
          ))}
        </ol>
      );
    case 'definition':
      return (
        <div className="definition">
          <div className="definition-term">
            <Icon name="book-open" size={16} /> {b.term}
          </div>
          <RichText text={b.text} />
        </div>
      );
    default:
      return null;
  }
}

function DeepDive({ title, blocks }: { title: string; blocks: Block[] }) {
  const [open, setOpen] = useState(false);
  return (
    <section className={`deepdive${open ? ' open' : ''}`}>
      <button
        type="button"
        className="deepdive-head"
        aria-expanded={open}
        onClick={() => {
          sfx.tap();
          setOpen((o) => !o);
        }}
      >
        <span className="deepdive-badge">
          <Icon name="layers" size={16} /> Go deeper
        </span>
        <span className="deepdive-title">
          <Inline text={title} />
        </span>
        <Icon name="chevron-down" size={18} className="deepdive-chev" />
      </button>
      <div className="deepdive-body">
        <div className="deepdive-inner">{open && <Blocks blocks={blocks} />}</div>
      </div>
    </section>
  );
}

/** Worked solution: each line can be tapped to reveal why the step is valid. */
function Derivation({ title, steps, result }: { title?: string; steps: DerivationStep[]; result?: string }) {
  const [open, setOpen] = useState<Set<number>>(() => new Set());
  const hasWhy = steps.some((s) => s.why);
  const allOpen = hasWhy && steps.every((s, i) => !s.why || open.has(i));
  const toggle = (i: number) => {
    sfx.tap();
    setOpen((o) => {
      const n = new Set(o);
      if (n.has(i)) n.delete(i);
      else n.add(i);
      return n;
    });
  };
  return (
    <figure className="derivation">
      <div className="deriv-head">
        <span className="deriv-title">
          <Icon name="edit" size={15} /> {title ? <Inline text={title} /> : 'Worked example'}
        </span>
        {hasWhy && (
          <button
            type="button"
            className="deriv-toggle"
            onClick={() => {
              sfx.tap();
              setOpen(allOpen ? new Set() : new Set(steps.map((_, i) => i)));
            }}
          >
            {allOpen ? 'Hide reasons' : 'Show all reasons'}
          </button>
        )}
      </div>
      <ol className="deriv-steps">
        {steps.map((s, i) => (
          <li key={i} className={`deriv-step${s.why ? ' has-why' : ''}${open.has(i) ? ' open' : ''}`}>
            <button type="button" className="deriv-line" onClick={() => s.why && toggle(i)} disabled={!s.why} aria-expanded={s.why ? open.has(i) : undefined}>
              <span className="deriv-num">{i + 1}</span>
              <span className="deriv-tex">
                <Tex tex={s.tex} display />
              </span>
              {s.why && <Icon name="chevron-down" size={16} className="deriv-chev" />}
            </button>
            {s.why && open.has(i) && (
              <div className="deriv-why">
                <Inline text={s.why} />
              </div>
            )}
          </li>
        ))}
      </ol>
      {result && (
        <div className="deriv-result">
          <Icon name="check" size={16} strokeWidth={3} />
          <span>
            <Inline text={result} />
          </span>
        </div>
      )}
    </figure>
  );
}
