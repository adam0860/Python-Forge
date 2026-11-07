import { useEffect, useImperativeHandle, useMemo, useRef, useState, type Ref } from 'react';
import type {
  CodeQuestion,
  ErrorQuestion,
  ExprQuestion,
  FillQuestion,
  McqQuestion,
  NumericQuestion,
  OrderQuestion,
  PredictQuestion,
  QuestionStep,
  TrueFalseQuestion,
} from '../content/types';
import { CodeBlock, Tokens } from '../components/CodeBlock';
import { Graph } from '../components/Graph';
import { Icon } from '../components/Icon';
import { Inline, RichText } from '../components/RichText';
import { Tex } from '../components/Tex';
import { highlightLines } from '../lib/highlight';
import { cleanAnswer, equivalent, numericListMatches, numericMatches, previewTex } from '../lib/mathexpr';
import { shuffled, shuffledNotIdentity } from '../lib/random';
import { useSettings } from '../lib/store';
import { sfx } from '../lib/sound';
import { haptic } from '../lib/platform';
import { warmUpPython } from '../lib/python';
import { CodeEditor, ConsoleView, useRunner } from '../components/CodeRunner';

export interface QuestionHandle {
  /** Grade the current answer. */
  evaluate(): boolean;
  /** Questions that must run code first (resolves null if the run was cancelled). */
  evaluateAsync?(): Promise<boolean | null>;
}

interface QProps<Q> {
  q: Q;
  revealed: boolean;
  onReady: (ready: boolean) => void;
  seed: number;
  ref?: Ref<QuestionHandle>;
}

const LETTERS = 'ABCDEFGH';

export const KIND_LABEL: Record<QuestionStep['kind'], string> = {
  mcq: 'Multiple choice',
  truefalse: 'True or false',
  fill: 'Fill in the blanks',
  order: 'Put in order',
  error: 'Find the mistake',
  numeric: 'Calculate',
  expr: 'Write the expression',
  predict: 'Predict the output',
  code: 'Write the code',
};

const KIND_ICON: Record<QuestionStep['kind'], string> = {
  mcq: 'help',
  truefalse: 'help',
  fill: 'type',
  order: 'list',
  error: 'bug',
  numeric: 'calc',
  expr: 'curve',
  predict: 'terminal',
  code: 'code',
};

export function QuestionView({
  q,
  revealed,
  onReady,
  seed,
  ref,
}: {
  q: QuestionStep;
  revealed: boolean;
  onReady: (r: boolean) => void;
  seed: number;
  ref?: Ref<QuestionHandle>;
}) {
  return (
    <div className={`question q-${q.kind}`}>
      <div className="q-kind">
        <Icon name={KIND_ICON[q.kind]} size={14} />
        {KIND_LABEL[q.kind]}
        {q.kind === 'mcq' && q.multi && <span className="q-multi">· select all that apply</span>}
      </div>
      <div className="q-prompt">
        <RichText text={q.prompt} />
      </div>
      {q.tex && <Tex tex={q.tex} display className="q-tex" />}
      {q.graph && <Graph g={q.graph} compact />}
      {q.code && <CodeBlock code={q.code} lang={q.lang} compact title={q.kind === 'predict' ? 'What does this print?' : undefined} />}
      {q.kind === 'mcq' && <Mcq q={q} revealed={revealed} onReady={onReady} seed={seed} ref={ref} />}
      {q.kind === 'truefalse' && <TrueFalse q={q} revealed={revealed} onReady={onReady} seed={seed} ref={ref} />}
      {q.kind === 'fill' && <Fill q={q} revealed={revealed} onReady={onReady} seed={seed} ref={ref} />}
      {q.kind === 'order' && <Order q={q} revealed={revealed} onReady={onReady} seed={seed} ref={ref} />}
      {q.kind === 'error' && <ErrorFind q={q} revealed={revealed} onReady={onReady} seed={seed} ref={ref} />}
      {q.kind === 'numeric' && <Numeric q={q} revealed={revealed} onReady={onReady} seed={seed} ref={ref} />}
      {q.kind === 'expr' && <Expr q={q} revealed={revealed} onReady={onReady} seed={seed} ref={ref} />}
      {q.kind === 'predict' && <Predict q={q} revealed={revealed} onReady={onReady} seed={seed} ref={ref} />}
      {q.kind === 'code' && <CodeQ q={q} revealed={revealed} onReady={onReady} seed={seed} ref={ref} />}
    </div>
  );
}

function useNumberKeys(active: boolean, count: number, onKey: (i: number) => void) {
  useEffect(() => {
    if (!active) return;
    const h = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.metaKey || e.ctrlKey || e.altKey) return;
      const n = Number(e.key);
      if (n >= 1 && n <= count) {
        e.preventDefault();
        onKey(n - 1);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [active, count, onKey]);
}

const feedbackTap = () => {
  sfx.select();
  void haptic('light');
};

// ---------------------------------------------------------------------------

function Mcq({ q, revealed, onReady, seed, ref }: QProps<McqQuestion>) {
  const settings = useSettings();
  const order = useMemo(
    () => (settings.shuffleOptions ? shuffled(q.options.map((_, i) => i), seed) : q.options.map((_, i) => i)),
    [q, seed, settings.shuffleOptions],
  );
  const [selected, setSelected] = useState<number[]>([]);

  useEffect(() => onReady(selected.length > 0), [selected, onReady]);
  useImperativeHandle(ref, () => ({
    evaluate: () => {
      const correct = q.options.flatMap((o, i) => (o.correct ? [i] : []));
      return correct.length === selected.length && correct.every((i) => selected.includes(i));
    },
  }));

  const toggle = (i: number) => {
    if (revealed) return;
    feedbackTap();
    setSelected((s) => (q.multi ? (s.includes(i) ? s.filter((x) => x !== i) : [...s, i]) : [i]));
  };
  useNumberKeys(!revealed, order.length, (k) => toggle(order[k]));

  return (
    <div className={`options${q.codeOptions ? ' code-options' : ''}`} role={q.multi ? 'group' : 'radiogroup'}>
      {order.map((idx, pos) => {
        const o = q.options[idx];
        const isSel = selected.includes(idx);
        const state = revealed ? (o.correct ? 'correct' : isSel ? 'wrong' : 'dim') : isSel ? 'selected' : '';
        return (
          <button
            key={idx}
            type="button"
            className={`option ${state}`}
            onClick={() => toggle(idx)}
            role={q.multi ? 'checkbox' : 'radio'}
            aria-checked={isSel}
            disabled={revealed}
          >
            <span className={`option-key${q.multi ? ' square' : ''}`}>
              {revealed && o.correct ? (
                <Icon name="check" size={14} strokeWidth={3} />
              ) : revealed && isSel ? (
                <Icon name="x" size={14} strokeWidth={3} />
              ) : (
                LETTERS[pos]
              )}
            </span>
            <span className="option-body">
              <span className="option-text">
                {q.codeOptions ? <OptionCode text={o.text} /> : <Inline text={o.text} />}
              </span>
              {revealed && o.why && (isSel || o.correct || q.options.length <= 4) && (
                <span className="option-why">
                  <Inline text={o.why} />
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function OptionCode({ text }: { text: string }) {
  const lines = useMemo(() => highlightLines(text, 'python'), [text]);
  return (
    <code className="opt-code">
      {lines.map((l, i) => (
        <span key={i} className="opt-code-line">
          <Tokens tokens={l} />
        </span>
      ))}
    </code>
  );
}

// ---------------------------------------------------------------------------

function TrueFalse({ q, revealed, onReady, ref }: QProps<TrueFalseQuestion>) {
  const [value, setValue] = useState<boolean | null>(null);
  useEffect(() => onReady(value !== null), [value, onReady]);
  useImperativeHandle(ref, () => ({ evaluate: () => value === q.answer }));
  const choose = (v: boolean) => {
    if (revealed) return;
    feedbackTap();
    setValue(v);
  };
  useNumberKeys(!revealed, 2, (k) => choose(k === 0));
  return (
    <div className="tf">
      {[true, false].map((v) => {
        const isSel = value === v;
        const state = revealed ? (q.answer === v ? 'correct' : isSel ? 'wrong' : 'dim') : isSel ? 'selected' : '';
        return (
          <button key={String(v)} type="button" className={`tf-btn ${state}`} onClick={() => choose(v)} disabled={revealed}>
            <Icon name={v ? 'check' : 'x'} size={22} strokeWidth={3} />
            {v ? 'True' : 'False'}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------

const normalize = (s: string, caseSensitive: boolean) => {
  const t = s.trim().replace(/\s+/g, ' ');
  return caseSensitive ? t : t.toLowerCase();
};

function Fill({ q, revealed, onReady, seed, ref }: QProps<FillQuestion>) {
  const isCode = q.templateIsCode === true;
  const n = q.blanks.length;
  const [values, setValues] = useState<string[]>(() => Array(n).fill(''));
  const [chipOf, setChipOf] = useState<(number | null)[]>(() => Array(n).fill(null));
  const [focus, setFocus] = useState(0);
  const bank = useMemo(() => (q.wordBank ? shuffledNotIdentity(q.wordBank, seed) : null), [q.wordBank, seed]);

  useEffect(() => onReady(values.every((v) => v.trim() !== '')), [values, onReady]);
  const isRight = (i: number) =>
    q.blanks[i].answers.some(
      (a) =>
        normalize(a, q.blanks[i].caseSensitive ?? isCode) === normalize(values[i], q.blanks[i].caseSensitive ?? isCode) ||
        // Typed numbers are compared by value: 0.5, 1/2 and .5 are all fine.
        (!bank && /^[-+*/^().\d\s]+$|pi|sqrt/.test(a) && numericMatches(values[i], a, { minDecimals: 9 })),
    );
  useImperativeHandle(ref, () => ({ evaluate: () => q.blanks.every((_, i) => isRight(i)) }));

  const placeChip = (chip: number) => {
    if (revealed || !bank) return;
    let target = values[focus] === '' ? focus : values.findIndex((v) => v === '');
    if (target === -1) target = focus;
    feedbackTap();
    const nv = [...values];
    const nc = [...chipOf];
    nv[target] = bank[chip];
    nc[target] = chip;
    setValues(nv);
    setChipOf(nc);
    const nextEmpty = nv.findIndex((v) => v === '');
    setFocus(nextEmpty === -1 ? target : nextEmpty);
  };
  const clearBlank = (i: number) => {
    if (revealed) return;
    if (bank) {
      if (values[i] === '') {
        setFocus(i);
        return;
      }
      sfx.tap();
      const nv = [...values];
      const nc = [...chipOf];
      nv[i] = '';
      nc[i] = null;
      setValues(nv);
      setChipOf(nc);
      setFocus(i);
    }
  };

  const slot = (i: number) => {
    const state = revealed ? (isRight(i) ? 'correct' : 'wrong') : focus === i && bank ? 'focus' : '';
    if (!bank) {
      return (
        <span className={`blank-wrap ${state}`} key={`b${i}`}>
          <input
            className={`blank-input ${state}`}
            value={values[i]}
            disabled={revealed}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            autoComplete="off"
            aria-label={`Blank ${i + 1}`}
            size={Math.max(4, values[i].length + 1, ...q.blanks[i].answers.map((a) => Math.min(a.length, 14)))}
            onChange={(e) => {
              const nv = [...values];
              nv[i] = e.target.value;
              setValues(nv);
            }}
            onFocus={() => setFocus(i)}
          />
          {revealed && !isRight(i) && <span className="blank-answer">{q.blanks[i].answers[0]}</span>}
        </span>
      );
    }
    return (
      <span className={`blank-wrap ${state}`} key={`b${i}`}>
        <button type="button" className={`blank ${state}${values[i] ? ' filled' : ''}`} onClick={() => clearBlank(i)} disabled={revealed}>
          {values[i] || ' '}
        </button>
        {revealed && !isRight(i) && (
          <span className="blank-answer">
            <Inline text={q.blanks[i].answers[0]} />
          </span>
        )}
      </span>
    );
  };

  // Render the template with blanks spliced into the highlighted tokens.
  const rendered = useMemo(() => {
    let k = 0;
    const marked = q.template.replace(/___/g, () => `__BLANK${k++}__`);
    return isCode ? highlightLines(marked, q.lang ?? 'python') : null;
  }, [q.template, q.lang, isCode]);

  const splitWithSlots = (text: string, cls?: string) =>
    text.split(/(__BLANK\d+__)/).map((part, j) => {
      const m = /^__BLANK(\d+)__$/.exec(part);
      if (m) return slot(Number(m[1]));
      return part ? (
        <span key={j} className={cls}>
          {part}
        </span>
      ) : null;
    });

  return (
    <div className="fill">
      {isCode && rendered ? (
        <div className="code-block bare fill-code">
          <div className="code-scroll">
            <pre className="code">
              {rendered.map((toks, li) => (
                <div className="line" key={li}>
                  <span className="lc">
                    {toks.length === 0
                      ? '​'
                      : toks.map((t, ti) => <span key={ti}>{splitWithSlots(t.text, `tk-${t.kind}`)}</span>)}
                  </span>
                </div>
              ))}
            </pre>
          </div>
        </div>
      ) : (
        <p className="fill-sentence">
          {(() => {
            let k = 0;
            return q.template.split('___').map((seg, i, arr) => (
              <span key={i}>
                <Inline text={seg} />
                {i < arr.length - 1 && slot(k++)}
              </span>
            ));
          })()}
        </p>
      )}
      {bank && (
        <div className="word-bank">
          {bank.map((w, ci) => {
            const used = chipOf.includes(ci);
            return (
              <button
                key={ci}
                type="button"
                className={`chip${used ? ' used' : ''}${isCode ? ' mono' : ''}`}
                onClick={() => !used && placeChip(ci)}
                disabled={revealed || used}
              >
                {isCode ? w : <Inline text={w} />}
              </button>
            );
          })}
        </div>
      )}
      {!bank && !revealed && <div className="fill-help">Type your answer{n > 1 ? 's' : ''} in the highlighted blank{n > 1 ? 's' : ''}.</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------

interface OrderItem {
  id: number;
  text: string;
}

function Order({ q, revealed, onReady, seed, ref }: QProps<OrderQuestion>) {
  const isCode = q.linesAreCode === true;
  const items: OrderItem[] = useMemo(
    () => [...q.lines, ...(q.distractors ?? [])].map((text, id) => ({ id, text })),
    [q.lines, q.distractors],
  );
  const poolOrder = useMemo(() => shuffledNotIdentity(items, seed), [items, seed]);
  const [answer, setAnswer] = useState<number[]>([]);

  useEffect(() => onReady(answer.length >= q.lines.length), [answer, onReady, q.lines.length]);
  const isCorrect = () => answer.length === q.lines.length && answer.every((id, i) => items[id].text === q.lines[i]);
  useImperativeHandle(ref, () => ({ evaluate: isCorrect }));

  const add = (id: number) => {
    if (revealed) return;
    feedbackTap();
    setAnswer((a) => [...a, id]);
  };
  const remove = (id: number) => {
    if (revealed) return;
    sfx.tap();
    setAnswer((a) => a.filter((x) => x !== id));
  };

  const lineText = (text: string, keepIndent: boolean) => {
    const t = keepIndent ? text : text.trimStart();
    if (!isCode) return <Inline text={t} />;
    const toks = highlightLines(t, q.lang ?? 'python')[0] ?? [];
    return (
      <code className="order-code">
        <Tokens tokens={toks} />
      </code>
    );
  };

  return (
    <div className="order">
      <div className="order-answer">
        {answer.length === 0 && <div className="order-empty">Tap the lines below in the right order</div>}
        {answer.map((id, pos) => {
          const state = revealed ? (items[id].text === q.lines[pos] ? 'correct' : 'wrong') : '';
          return (
            <button key={id} type="button" className={`order-line placed ${state}`} onClick={() => remove(id)} disabled={revealed}>
              <span className="order-pos">{pos + 1}</span>
              {lineText(items[id].text, true)}
            </button>
          );
        })}
      </div>
      {!revealed && (
        <div className="order-pool">
          {poolOrder.map((it) => {
            const used = answer.includes(it.id);
            return (
              <button key={it.id} type="button" className={`order-line pool${used ? ' used' : ''}`} onClick={() => !used && add(it.id)} disabled={used}>
                {lineText(it.text, false)}
              </button>
            );
          })}
        </div>
      )}
      {revealed && !isCorrect() && (
        <div className="order-solution">
          <div className="order-solution-label">Correct order</div>
          {isCode ? (
            <CodeBlock code={q.lines.join('\n')} lang={q.lang ?? 'python'} bare compact />
          ) : (
            <ol className="order-solution-list">
              {q.lines.map((l, i) => (
                <li key={i}>
                  <Inline text={l} />
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
      {!revealed && (
        <div className="order-count">
          {answer.length} / {q.lines.length} placed
          {q.distractors?.length ? ' · some lines don’t belong' : ''}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------

function ErrorFind({ q, revealed, onReady, ref }: QProps<ErrorQuestion>) {
  const [line, setLine] = useState<number | null>(null);
  const codeLines = useMemo(() => (q.linesAreCode ? highlightLines(q.lines.join('\n'), q.lang ?? 'python') : null), [q]);
  useEffect(() => onReady(line !== null), [line, onReady]);
  useImperativeHandle(ref, () => ({ evaluate: () => line !== null && q.errorLines.includes(line) }));
  return (
    <div className="errfind">
      <ol className={`errfind-lines${codeLines ? ' code' : ''}`}>
        {q.lines.map((l, i) => {
          const n = i + 1;
          const state = revealed
            ? q.errorLines.includes(n)
              ? n === line
                ? 'correct'
                : 'answer'
              : n === line
                ? 'wrong'
                : ''
            : n === line
              ? 'selected'
              : '';
          return (
            <li key={i}>
              <button
                type="button"
                className={`errfind-line ${state}`}
                disabled={revealed}
                onClick={() => {
                  feedbackTap();
                  setLine(n);
                }}
              >
                <span className="errfind-num">{n}</span>
                <span className="errfind-text">
                  {codeLines ? (
                    <code className="errfind-code">{codeLines[i].length ? <Tokens tokens={codeLines[i]} /> : '\u200b'}</code>
                  ) : (
                    <Inline text={l} />
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      {!revealed && (
        <div className="fill-help">{codeLines ? 'Tap the line with the bug.' : 'Tap the first line where the solution goes wrong.'}</div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------

const KEYS: { label: string; insert: string; tex?: boolean }[] = [
  { label: 'x', insert: 'x' },
  { label: '^', insert: '^' },
  { label: '(', insert: '(' },
  { label: ')', insert: ')' },
  { label: '/', insert: '/' },
  { label: '\\sqrt{\\,}', insert: 'sqrt(', tex: true },
  { label: '\\pi', insert: 'pi', tex: true },
  { label: 'e', insert: 'e' },
  { label: '\\sin', insert: 'sin(', tex: true },
  { label: '\\cos', insert: 'cos(', tex: true },
  { label: '\\tan', insert: 'tan(', tex: true },
  { label: '\\ln', insert: 'ln(', tex: true },
];

function MathInput({
  value,
  onChange,
  revealed,
  state,
  label,
  unit,
  placeholder,
  keys,
}: {
  value: string;
  onChange: (v: string) => void;
  revealed: boolean;
  state: string;
  label?: string;
  unit?: string;
  placeholder: string;
  keys: typeof KEYS;
}) {
  const input = useRef<HTMLInputElement>(null);
  const preview = useMemo(() => previewTex(value), [value]);
  const insert = (text: string) => {
    const el = input.current;
    if (!el) return;
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const next = value.slice(0, start) + text + value.slice(end);
    onChange(next);
    sfx.tap();
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + text.length, start + text.length);
    });
  };
  return (
    <div className={`math-input ${state}`}>
      <div className="math-input-row">
        {label && (
          <span className="math-input-label">
            <Inline text={label} />
          </span>
        )}
        <input
          ref={input}
          className="math-input-field"
          value={value}
          disabled={revealed}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          inputMode="text"
          placeholder={placeholder}
          aria-label="Your answer"
          onChange={(e) => onChange(e.target.value)}
        />
        {unit && (
          <span className="math-input-unit">
            <Inline text={unit} />
          </span>
        )}
      </div>
      {!revealed && (
        <div className="math-keys">
          {keys.map((k) => (
            <button key={k.insert} type="button" className="math-key" onMouseDown={(e) => e.preventDefault()} onClick={() => insert(k.insert)}>
              {k.tex ? <Tex tex={k.label} /> : k.label}
            </button>
          ))}
        </div>
      )}
      <div className="math-preview" aria-live="polite">
        {value.trim() ? (
          preview ? (
            <>
              <span className="math-preview-label">You entered</span>
              <Tex tex={preview} />
            </>
          ) : (
            <span className="math-preview-bad">Keep typing — that isn’t a complete expression yet.</span>
          )
        ) : (
          <span className="math-preview-hint">Type with a keyboard: 3x^2, sqrt(2)/2, 2pi/3, e^(-x)</span>
        )}
      </div>
    </div>
  );
}

function answerTexOf(q: NumericQuestion | ExprQuestion): string {
  if (q.answerTex) return q.answerTex;
  const a = Array.isArray(q.answer) ? q.answer : [q.answer];
  return a.map((x) => previewTex(x) ?? x).join(',\\; ');
}

function Numeric({ q, revealed, onReady, ref }: QProps<NumericQuestion>) {
  const [value, setValue] = useState('');
  useEffect(() => onReady(value.trim() !== '' && previewTex(cleanAnswer(value).split(/,|;|\bor\b/)[0] || ' ') !== null), [value, onReady]);
  const check = () =>
    Array.isArray(q.answer)
      ? numericListMatches(value, q.answer, { tolerance: q.tolerance, minDecimals: q.minDecimals })
      : numericMatches(value, q.answer, { tolerance: q.tolerance, minDecimals: q.minDecimals });
  useImperativeHandle(ref, () => ({ evaluate: check }));
  const right = revealed && check();
  const multi = Array.isArray(q.answer) && q.answer.length > 1;
  return (
    <div className="numeric">
      <MathInput
        value={value}
        onChange={setValue}
        revealed={revealed}
        state={revealed ? (right ? 'correct' : 'wrong') : ''}
        label={q.label}
        unit={q.unit}
        placeholder={multi ? 'Answers separated by commas' : 'Your answer'}
        keys={KEYS.filter((k) => k.insert !== 'x')}
      />
      {revealed && !right && (
        <div className="answer-reveal">
          <span>Correct answer</span> <Tex tex={answerTexOf(q)} />
        </div>
      )}
      {!revealed && (
        <div className="fill-help">
          {multi ? `Enter all ${(q.answer as string[]).length} values, separated by commas, in any order. ` : ''}Exact forms like 3/4 or sqrt(3)/2 work; decimals need at least {q.minDecimals ?? 2} places.
        </div>
      )}
    </div>
  );
}

function Expr({ q, revealed, onReady, ref }: QProps<ExprQuestion>) {
  const [value, setValue] = useState('');
  const vars = q.variables ?? ['x'];
  useEffect(() => onReady(value.trim() !== '' && previewTex(value) !== null), [value, onReady]);
  const result = useMemo(
    () => (revealed ? equivalent(value, q.answer, { variables: vars, domain: q.domain, upToConstant: q.upToConstant }) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [revealed],
  );
  useImperativeHandle(ref, () => ({
    evaluate: () => equivalent(value, q.answer, { variables: vars, domain: q.domain, upToConstant: q.upToConstant }).ok,
  }));
  const keys = [...vars.filter((v) => v !== 'x').map((v) => ({ label: v === 'theta' ? '\\theta' : v, insert: v, tex: v === 'theta' })), ...KEYS.filter((k) => vars.includes('x') || k.insert !== 'x')];
  return (
    <div className="expr">
      <MathInput
        value={value}
        onChange={setValue}
        revealed={revealed}
        state={revealed ? (result?.ok ? 'correct' : 'wrong') : ''}
        label={q.label}
        placeholder={`Expression in ${vars.join(', ')}`}
        keys={keys}
      />
      {revealed && result && !result.ok && (
        <div className="answer-reveal">
          <span>{result.reason === 'vars' ? result.message + ' — one answer is' : 'One correct answer'}</span> <Tex tex={answerTexOf(q) + (q.upToConstant ? ' + C' : '')} />
        </div>
      )}
      {!revealed && (
        <div className="fill-help">Any equivalent form is accepted{q.upToConstant ? '; the + C is optional' : ''}. Use * or just write terms side by side (2x, 3sin(x)).</div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------

/** Normalize program output for comparison: unify newlines, drop trailing spaces and trailing blank lines. */
export function normalizeOutput(s: string): string {
  return s
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((l) => l.replace(/\s+$/, ''))
    .join('\n')
    .replace(/\n+$/, '');
}

function Predict({ q, revealed, onReady, ref }: QProps<PredictQuestion>) {
  const [value, setValue] = useState('');
  useEffect(() => onReady(value.trim() !== ''), [value, onReady]);
  const check = () => normalizeOutput(value).replace(/^\n+/, '') === normalizeOutput(q.answer);
  useImperativeHandle(ref, () => ({ evaluate: check }));
  const right = revealed && check();
  const rows = Math.max(2, Math.min(10, normalizeOutput(q.answer).split('\n').length + 1));
  return (
    <div className="predict">
      <div className={`predict-term${revealed ? (right ? ' correct' : ' wrong') : ''}`}>
        <div className="predict-label">
          <Icon name="terminal" size={14} /> Your prediction
        </div>
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          readOnly={revealed}
          rows={rows}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          placeholder="Type exactly what appears on the screen"
          aria-label="Predicted output"
        />
      </div>
      {revealed && !right && (
        <div className="answer-reveal code">
          <span>Actual output</span>
          <pre>{q.answer}</pre>
        </div>
      )}
      {!revealed && <div className="fill-help">Type every line the program prints, in order. Spacing inside a line matters; trailing spaces don’t.</div>}
    </div>
  );
}

function CodeQ({ q, revealed, onReady, ref }: QProps<CodeQuestion>) {
  const [code, setCode] = useState(q.starter);
  const runner = useRunner();
  const [showSolution, setShowSolution] = useState(false);
  const [verdict, setVerdict] = useState<{ ok: boolean; message: string } | null>(null);
  useEffect(() => {
    warmUpPython();
  }, []);
  useEffect(() => onReady(code.trim() !== '' && code !== q.starter), [code, onReady, q.starter]);
  useEffect(() => {
    if (revealed && verdict && !verdict.ok) setShowSolution(false);
  }, [revealed, verdict]);

  const runChecks = async (): Promise<boolean | null> => {
    const r = await runner.run(code, { stdin: q.stdin, tests: q.tests?.trim() ? q.tests : 'pass', expectOutput: q.expectOutput, packages: q.packages });
    if (r.cancelled) return null;
    if (r.timedOut) {
      setVerdict({ ok: false, message: 'Your program didn’t finish in time — look for a loop that never ends.' });
      return false;
    }
    if (r.internal) {
      setVerdict({ ok: false, message: 'Python couldn’t start on this device, so the code couldn’t be checked.' });
      return false;
    }
    const ok = r.testsPassed === true;
    setVerdict({ ok, message: ok ? 'All checks passed.' : r.message || 'A check failed.' });
    return ok;
  };
  useImperativeHandle(ref, () => ({ evaluate: () => verdict?.ok ?? false, evaluateAsync: runChecks }));

  return (
    <div className="code-q">
      <div className="code-block bare">
        <div className="code-head">
          <span className="code-title">
            <Icon name="edit" size={15} /> main.py
          </span>
          <span className="code-actions">
            {!revealed && code !== q.starter && (
              <button type="button" className="icon-btn sm" title="Reset to the starting code" onClick={() => setCode(q.starter)}>
                <Icon name="rotate" size={16} />
              </button>
            )}
            {!revealed && (
              <button
                type="button"
                className={`run-btn sm${runner.running ? ' stop' : ''}`}
                onClick={() => (runner.running ? runner.stop() : void runner.run(code, { stdin: q.stdin, packages: q.packages }))}
                title="Run without checking (Ctrl+Enter)"
              >
                <Icon name={runner.running ? 'stop' : 'play'} size={13} filled /> {runner.running ? 'Stop' : 'Try it'}
              </button>
            )}
          </span>
        </div>
        <CodeEditor
          value={showSolution ? q.solution : code}
          onChange={setCode}
          readOnly={revealed}
          onRun={() => void runner.run(code, { stdin: q.stdin, packages: q.packages })}
          minLines={Math.max(4, q.starter.split('\n').length)}
        />
        {(runner.running || runner.chunks.length > 0) && <ConsoleView chunks={runner.chunks} running={runner.running} status={runner.status} />}
      </div>
      {q.checks && q.checks.length > 0 && (
        <ul className="code-checks">
          {q.checks.map((c, i) => (
            <li key={i} className={verdict ? (verdict.ok ? 'pass' : '') : ''}>
              <Icon name={verdict?.ok ? 'check' : 'target'} size={14} strokeWidth={verdict?.ok ? 3 : 2} />
              <Inline text={c} />
            </li>
          ))}
        </ul>
      )}
      {verdict && (
        <div className={`code-q-result ${verdict.ok ? 'pass' : 'fail'}`}>
          <Icon name={verdict.ok ? 'check' : 'x'} size={16} strokeWidth={3} />
          <span>{verdict.message}</span>
        </div>
      )}
      {revealed && (
        <div className="code-solution">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowSolution((v) => !v)}>
            <Icon name="eye" size={16} /> {showSolution ? 'Show my code' : 'Show a model solution'}
          </button>
        </div>
      )}
      {!revealed && (
        <div className="fill-help">
          Write your code, then press <b>Run &amp; check</b>. <b>Try it</b> runs it without checking. Python runs right here on your device.
        </div>
      )}
    </div>
  );
}
