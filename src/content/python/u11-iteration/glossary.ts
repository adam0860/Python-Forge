import type { GlossaryEntry } from '../../types';

// Glossary terms introduced by this unit that are NOT in scripts/glossary-master.ts.
export const glossary: GlossaryEntry[] = [
  {
    id: 'iterator',
    term: 'Iterator',
    course: 'python',
    category: 'Iteration',
    short: 'An object that produces values one at a time: `next(it)` returns the next value and raises `StopIteration` when there are none left. An iterator remembers its position and can be used only once.',
    see: ['iterable', 'generator'],
  },
  {
    id: 'generator',
    term: 'Generator',
    course: 'python',
    category: 'Iteration',
    short: 'A function containing `yield` (or an expression in parentheses) that produces values lazily. Calling it returns an iterator that runs the body only as far as the next `yield` each time it is asked for a value.',
    see: ['iterator', 'lazy-evaluation', 'generator-expression'],
  },
  {
    id: 'generator-expression',
    term: 'Generator expression',
    course: 'python',
    category: 'Iteration',
    short: 'A comprehension in parentheses, such as `(n * n for n in nums)`. It builds no list: it returns an iterator that computes each value on demand.',
    see: ['generator', 'comprehension'],
  },
  {
    id: 'lazy-evaluation',
    term: 'Lazy evaluation',
    course: 'python',
    category: 'Iteration',
    short: 'Computing a value only when it is actually needed rather than up front. `range`, `map`, generators and file objects are lazy, so they can handle huge or endless sequences in constant memory.',
    see: ['generator', 'iterator'],
  },
  {
    id: 'partial-application',
    term: 'Partial application',
    course: 'python',
    category: 'Iteration',
    short: 'Fixing some arguments of a function to get a new function that takes the rest. `functools.partial(pow, 2)` is a function that raises 2 to a given power.',
    see: ['higher-order-function', 'closure'],
  },
];
