import reader from "readline-sync";
import { u, U, cr } from "./unit";

//https://www.youtube.com/watch?v=vkcxgagQ4bM 21:15 ... you might be asking, what is this U?

// The next line is a problem, because it uses the heap. The compiler needs to do a lot more work
// to build monadic code efficiently, largely eliminating this new, according to the context.
// Since we are explicitly calling new, this will be tricky.
// The compiler will take this new instruction literally. This is the main point of Bartosz's
// lecture, its a howto and a warning: take this code seriously, it presents problems for compilers.
// C++ has big issues with it, and typescript suffers too.
// There are workarounds, based on coroutines, which can allocate memory more efficiently.
// It's not clear these will code that cleanly in typescipt, but the basic monadic code is simpler
// in typescript, bar it requires handling.
export type BadData = undefined | null;

export type Possibly<T> = T | BadData;

export type Thunk<T> = () => T;

export const makeIO = <T>(f: Thunk<T>) => new IO<T>(f);

export const hardCast = <D, R>(val: D) => val as unknown as R;

//What we really want is an IO of maybes ... with an api that works in the innermost context.

export class IO<T> {
  private act: () => T;

  static isGood = <T>(value: Possibly<T>) =>
    value !== null && value !== undefined;

  static coDefaultGen =
    <R>(val: R) =>
    (def: R) =>
      IO.isGood(val) ? val : def;

  static coDefault =
    <D, R>(f: (maps: D) => R) =>
    (val: D) =>
    (def: R) =>
      IO.coDefaultGen(f(val))(def);

  static coCall =
    <D, R>(f: (maps: D) => R) =>
    (val: D) =>
      IO.coDefault(f)(val)(hardCast<D, R>(val));

  constructor(action: Thunk<T>) {
    this.act = action;
  }

  private run = () => IO.coDefaultGen(this.act())(null as unknown as T);

  readonly return_with_default = (def: T) => IO.coDefaultGen(this.run())(def!);

  readonly promise = <R>(f: (maps: T) => Promise<R>) => makeIO(() => u);

  readonly fbind = <M>(io: (maps: T) => IO<M>) =>
    makeIO(() => io(this.act()).run());

  readonly fmap = <R>(f: (maps: T) => R) =>
    makeIO(() => IO.coCall(f)(this.act()));
}

function putStrRaw(msg: string) {
  const cout = require("readline").createInterface({
    output: process.stdout,
  });

  cout.question("", (it: string) => {
    msg;
  });
  cout.close();
  return u;
}

export const funit = () => u;

export const writeStdOut = (s: string) =>
  new Promise((resolved) => process.stdout.write(s, resolved));

//This is a good model, its a raw socket write,
//So we need to attach a callback to it
export const putStr = async (s: string) =>
  makeIO(() => writeStdOut(s).then(funit).catch(funit));

export const getLine = () => reader.question("");
export const getStr = (x: U) => makeIO(() => getLine());
export const pure = <T>(x: T) => makeIO(() => x);

export const ask = (i: number) => {
  return putStr("Is it less than: ")
    .fbind((x: U) => putStr(i.toString()))
    .fbind((x: U) => putStr("? (y/n)" + cr))
    .fbind(getStr)
    .fbind((s: string) => pure(s === "y"));
};

export const guess = (a: number, b: number): IO<number> => {
  if (a >= b) return pure(a);

  const m = (b + 1 + a) / 2;

  return ask(m).fbind((yes: boolean) => {
    return yes ? guess(a, m - 1) : guess(m, b);
  });
};
