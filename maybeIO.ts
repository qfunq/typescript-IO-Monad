import reader from "readline-sync";
import { u, U, cr } from "./unit";

import { log, xlog } from "./logging";

//https://www.youtube.com/watch?v=vkcxgagQ4bM 21:15 ... you might be asking, what is this U?

// The next line is a problem, because it uses the heap. The compiler needs to do a lot more work
// to build monadic code efficiently, largely eliminating this new, according to the context.
// Since we are explicitly calling new, this will be tricky.
// The compiler will take this new instruction literally. This is the main point of Bartosz's
// lecture, its a howto and a warning: take this code seriously, it presents problems for compilers.
// C++ has big issues with it, and typescript suffers too.
// There are workarounds, based on coroutines, which can allocate memory more efficiently.
// It's not clear these will code that cleanly in typescipt, but the basic monadic code is simpler
// in typescript, bar it requires async handling.

export type MaybePromise<T> = T | Promise<T>;

export type Thunk<T> = () => MaybePromise<T>;

export const unitThunk = async () => u;

enum MIOStatus {
  pending = "pending",
  resolved = "resolved",
  rejected = "rejected",
  exception = "exception",
  catch = "catch",
  undefined = "undefined",
  null = "null",
  run = "run",
  runCatch = "run catch",
}

export type TErrorHandler<F> = (lineErr: Error) => (mioerr: MIOStatus) => F;

export const errorHandler =
  <F>(fail: F) =>
  (lineErr: Error) =>
  (mioerr: MIOStatus) =>
    fail;

export const unitErrorHandler = errorHandler(u);

export type TunitThunk = () => U;

export const initMIOStatus = () => MIOStatus.pending;

export const Deferred = <T>() => undefined as unknown as T;

export type IOPthunk<T> = () => Promise<T>;

export const makeIO = <T>(f: IOPthunk<T>): IOP<T> => new IOP<T>(f);

export class IOP<T> {
  private act: () => Promise<T>;

  constructor(action: IOPthunk<T>) {
    this.act = action;
  }

  //Embed values and functions
  static root = <T>(val: T) => makeIO<T>(() => Promise.resolve(val));
  static rootf = <T>(thunk: () => T) =>
    makeIO<T>(() => Promise.resolve(thunk()));

  readonly run = async () => this.act().then((x) => x);

  readonly fbind = <M>(f: (maps: T) => IOP<M>) =>
    makeIO(() => this.act().then((x) => f(x).run()));

  readonly then = <R>(f: (maps: T) => R) =>
    makeIO(() => {
      return this.act().then((x) => f(x));
    });

  readonly fmap = this.then;
}

export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
export const writeStdOut = async (s: string) =>
  new Promise((resolved) => process.stdout.write(s, resolved)).then((x) => u);

//This is a good model, its a raw socket write,
//So we need to attach a callback to it
export const putStr = (s: string) => makeIO(() => writeStdOut(s));

export const getLine = () => reader.question("");

export const getStr = (x: U) => IOP.rootf(getLine);

export const pure = <T>(x: T) => IOP.root(x);

export const ask = (i: number) => {
  return putStr("Is it less than: ")
    .fbind((x: U) => putStr(i.toString()))
    .fbind((x: U) => putStr("? (y/n)" + cr))
    .fbind(getStr)
    .fbind((s: string) => pure(s === "y"));
};

export const guess = (a: number, b: number): IOP<number> => {
  if (a >= b) return pure(a);

  const m = (b + 1 + a) / 2;

  return ask(m).fbind((yes: boolean) => {
    return yes ? guess(a, m - 1) : guess(m, b);
  });
};
