import type { GlossaryEntry } from '../../types';

// Glossary terms introduced by this unit that are NOT in scripts/glossary-master.ts.
export const glossary: GlossaryEntry[] = [
  {
    id: 'first-class-function',
    term: 'First-class function',
    course: 'python',
    category: 'Advanced Functions',
    short: 'A function that is a value like any other: it can be stored in a variable or list, passed as an argument, returned from another function, and given attributes. Every Python function is first-class.',
    see: ['function', 'higher-order-function'],
  },
  {
    id: 'free-variable',
    term: 'Free variable',
    course: 'python',
    category: 'Advanced Functions',
    short: 'A variable used inside a function but defined in an enclosing function. The inner function keeps access to it through a closure, even after the outer function has returned.',
    see: ['closure', 'scope'],
  },
  {
    id: 'late-binding',
    term: 'Late binding',
    course: 'python',
    category: 'Advanced Functions',
    short: 'A closure looks up the *current* value of a free variable when it is called, not when it was defined. This is why lambdas created in a loop all see the loop variable’s final value.',
    see: ['closure', 'free-variable'],
  },
  {
    id: 'wrapper-function',
    term: 'Wrapper function',
    course: 'python',
    category: 'Advanced Functions',
    short: 'The inner function a decorator returns in place of the original. It runs extra code (timing, logging, checks) around a call to the original function.',
    see: ['decorator', 'closure'],
  },
  {
    id: 'decorator-factory',
    term: 'Decorator factory',
    course: 'python',
    category: 'Advanced Functions',
    short: 'A function that takes settings and returns a decorator, so you can write `@repeat(3)` or `@retry(times=5)`. It is a function returning a function returning a function: three levels of nesting.',
    see: ['decorator', 'closure'],
  },
  {
    id: 'callable',
    term: 'Callable',
    course: 'python',
    category: 'Advanced Functions',
    short: 'Anything that can be called with `()`: functions, lambdas, methods, classes, and any object whose class defines `__call__`. `callable(obj)` tells you whether an object is one.',
    see: ['function', 'decorator'],
  },
  {
    id: 'context-manager',
    term: 'Context manager',
    course: 'python',
    category: 'Advanced Functions',
    short: 'An object used in a `with` statement that sets something up on entry (`__enter__`) and always cleans it up on exit (`__exit__`), even if an error occurs. Files, locks and `torch.no_grad()` are context managers.',
    see: ['exception', 'decorator'],
  },
];
