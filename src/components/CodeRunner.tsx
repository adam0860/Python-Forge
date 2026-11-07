import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import type { CodeLang } from '../content/types';
import { highlightLines } from '../lib/highlight';
import { isTouch } from '../lib/platform';
import { runPython, usePythonStatus, type RunOptions, type RunResult } from '../lib/python';
import { useSettings } from '../lib/store';
import { Tokens } from './CodeBlock';
import { Icon } from './Icon';

const INDENT = '    ';

/**
 * A lightweight code editor: a transparent <textarea> over a syntax-highlighted
 * <pre>. Python-aware: Tab/Shift+Tab indent, Enter keeps indentation (and adds a
 * level after a line ending in ":"), Ctrl/Cmd+Enter runs.
 */
export function CodeEditor({
  value,
  onChange,
  lang = 'python',
  onRun,
  minLines = 4,
  readOnly,
  ariaLabel = 'Code editor',
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  lang?: CodeLang;
  onRun?: () => void;
  minLines?: number;
  readOnly?: boolean;
  ariaLabel?: string;
  autoFocus?: boolean;
}) {
  const settings = useSettings();
  const ta = useRef<HTMLTextAreaElement>(null);
  const lines = useMemo(() => highlightLines(value, lang), [value, lang]);
  const lineCount = Math.max(lines.length, minLines);

  const replaceSelection = useCallback(
    (text: string, selectStart: number, selectEnd: number, from?: number, to?: number) => {
      const el = ta.current;
      if (!el) return;
      const s = from ?? el.selectionStart;
      const e = to ?? el.selectionEnd;
      const next = value.slice(0, s) + text + value.slice(e);
      onChange(next);
      requestAnimationFrame(() => {
        el.selectionStart = selectStart;
        el.selectionEnd = selectEnd;
      });
    },
    [value, onChange],
  );

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;
    const { selectionStart: s, selectionEnd: end } = el;
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      onRun?.();
      return;
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      const lineStart = value.lastIndexOf('\n', s - 1) + 1;
      if (s === end && !e.shiftKey) {
        replaceSelection(INDENT, s + 4, s + 4);
        return;
      }
      // Indent / dedent every selected line.
      const blockEnd = end;
      const block = value.slice(lineStart, blockEnd);
      const blockLines = block.split('\n');
      const changed = e.shiftKey ? blockLines.map((l) => l.replace(/^( {1,4}|\t)/, '')) : blockLines.map((l) => INDENT + l);
      const text = changed.join('\n');
      const firstDelta = e.shiftKey ? changed[0].length - blockLines[0].length : 4;
      replaceSelection(text, Math.max(lineStart, s + firstDelta), lineStart + text.length, lineStart, blockEnd);
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      const lineStart = value.lastIndexOf('\n', s - 1) + 1;
      const line = value.slice(lineStart, s);
      let indent = /^[ \t]*/.exec(line)![0];
      if (/:\s*(#.*)?$/.test(line)) indent += INDENT;
      else if (/^\s*(return|pass|break|continue|raise)\b/.test(line)) indent = indent.slice(0, Math.max(0, indent.length - 4));
      e.preventDefault();
      const ins = '\n' + indent;
      replaceSelection(ins, s + ins.length, s + ins.length);
      return;
    }
    if (e.key === 'Backspace' && s === end && s > 0) {
      const lineStart = value.lastIndexOf('\n', s - 1) + 1;
      const before = value.slice(lineStart, s);
      if (before.length > 0 && /^ +$/.test(before) && before.length % 4 === 0) {
        e.preventDefault();
        replaceSelection('', s - 4, s - 4, s - 4, s);
      }
    }
  };

  useEffect(() => {
    if (autoFocus) ta.current?.focus({ preventScroll: true });
  }, [autoFocus]);

  const insert = (text: string) => {
    const el = ta.current;
    if (!el) return;
    el.focus();
    const s = el.selectionStart;
    replaceSelection(text, s + text.length, s + text.length);
  };

  return (
    <div className="code-editor-wrap">
      <div className={`code-editor${readOnly ? ' readonly' : ''}`} style={{ fontSize: settings.codeFontSize }}>
        <div className="ce-gutter" aria-hidden="true">
          {Array.from({ length: lineCount }, (_, i) => (
            <span key={i}>{i + 1}</span>
          ))}
        </div>
        <div className="ce-body">
          <pre className="ce-highlight" aria-hidden="true">
            {lines.map((toks, i) => (
              <div key={i} className="line">
                {toks.length ? <Tokens tokens={toks} /> : '​'}
              </div>
            ))}
            {Array.from({ length: Math.max(0, minLines - lines.length) }, (_, i) => (
              <div key={`pad${i}`} className="line">
                {'​'}
              </div>
            ))}
          </pre>
          <textarea
            ref={ta}
            className="ce-input"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            readOnly={readOnly}
            aria-label={ariaLabel}
            wrap="off"
          />
        </div>
      </div>
      {isTouch && !readOnly && (
        <div className="ce-keys" role="toolbar" aria-label="Insert symbol">
          {['⇥', ':', '(', ')', '[', ']', '"', "'", '=', '_', '#', '{', '}'].map((k) => (
            <button
              key={k}
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                insert(k === '⇥' ? INDENT : k);
              }}
            >
              {k}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------

export interface ConsoleChunk {
  stream: 'stdout' | 'stderr' | 'info';
  text: string;
}

/** Terminal-style output panel. */
export function ConsoleView({ chunks, running, status, onClear }: { chunks: ConsoleChunk[]; running: boolean; status?: string; onClear?: () => void }) {
  const ref = useRef<HTMLPreElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [chunks]);
  const empty = chunks.length === 0;
  return (
    <div className={`console${running ? ' running' : ''}`}>
      <div className="console-head">
        <span>
          <Icon name="terminal" size={14} /> Console
        </span>
        {status && <span className="console-status">{status}</span>}
        {onClear && !empty && !running && (
          <button type="button" className="console-clear" onClick={onClear}>
            Clear
          </button>
        )}
      </div>
      <pre ref={ref} className="console-body">
        {empty && !running && <span className="console-placeholder">Press Run to see the output here.</span>}
        {chunks.map((c, i) => (
          <span key={i} className={`con-${c.stream}`}>
            {c.text}
          </span>
        ))}
        {running && <span className="console-cursor" />}
      </pre>
    </div>
  );
}

// ---------------------------------------------------------------------------

/** Runs code and collects console output for a ConsoleView. */
export function useRunner() {
  const [chunks, setChunks] = useState<ConsoleChunk[]>([]);
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState('');
  const [last, setLast] = useState<RunResult | null>(null);
  const cancelRef = useRef<(() => void) | null>(null);
  const py = usePythonStatus();

  useEffect(() => () => cancelRef.current?.(), []);

  const run = useCallback(async (code: string, opts: RunOptions = {}): Promise<RunResult> => {
    cancelRef.current?.();
    setChunks([]);
    setRunning(true);
    setLast(null);
    setStatus('');
    const append = (stream: ConsoleChunk['stream'], text: string) =>
      setChunks((cs) => {
        const lastChunk = cs[cs.length - 1];
        if (lastChunk && lastChunk.stream === stream) return [...cs.slice(0, -1), { stream, text: lastChunk.text + text }];
        return [...cs, { stream, text }];
      });
    const handle = runPython(code, { ...opts, onOutput: append, onStatus: setStatus });
    cancelRef.current = handle.cancel;
    const r = await handle.done;
    cancelRef.current = null;
    setRunning(false);
    setStatus('');
    if (r.timedOut) append('info', `\n⏹ Stopped after ${Math.round((opts.timeoutMs ?? 10_000) / 1000)} seconds — is there an infinite loop?\n`);
    else if (r.cancelled) append('info', '\n⏹ Stopped.\n');
    else if (r.internal) append('info', `Python couldn't start: ${r.internal}\n`);
    else if (!r.stdout && !r.stderr && r.ok) append('info', '(no output)\n');
    setLast(r);
    return r;
  }, []);

  const stop = useCallback(() => cancelRef.current?.(), []);
  const clear = useCallback(() => setChunks([]), []);
  const label = running && py.status === 'loading' ? 'Starting Python…' : status;
  return { chunks, running, status: label, last, run, stop, clear };
}

/** Run / Stop button. */
export function RunButton({ running, onRun, onStop, label = 'Run', small }: { running: boolean; onRun: () => void; onStop: () => void; label?: string; small?: boolean }) {
  return running ? (
    <button type="button" className={`run-btn stop${small ? ' sm' : ''}`} onClick={onStop} title="Stop the program">
      <Icon name="stop" size={13} filled /> Stop
    </button>
  ) : (
    <button type="button" className={`run-btn${small ? ' sm' : ''}`} onClick={onRun} title="Run (Ctrl+Enter)">
      <Icon name="play" size={13} filled /> {label}
    </button>
  );
}
