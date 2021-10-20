import reader from "readline-sync";
import { u, U, cr } from "./unit";

import { log, xlog } from "./logging";

export type BadData = undefined | null;

export type Possibly<T> = T | BadData;

const isBad = <T>(value: Possibly<T>) => value === null || value === undefined;

const bad = <T>() => null as unknown as T;

const mapBad = <T>(val: T) => (isBad(val) ? bad<T>() : val);

export type IOthunk<T> = () => Promise<T>;

const with_default =
  <T>(def: T) =>
  (val: T) =>
    isBad(val) ? def! : val;

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

export const makeIO = <T>(f: IOthunk<T>): IO<T> => new IO<T>(f);

// A combination of IO/Maybe/Promises, all linked together in a way that largely works as expected.
// If used non-recursively, it forces the CCC, quite rigorously. Trying to run the code unbound
// to the other scripts is an amusingly visual lesson in async code.
// String IO needs additonal forwarding parms to allow persistance of environment.

export class IO<T> {
  private act: () => Promise<T>;

  constructor(action: IOthunk<T>) {
    this.act = action;
  }

  //Embed values and functions
  static root = <T>(val: T) => makeIO<T>(() => Promise.resolve(val));
  static rootfun = <T>(thunk: () => T) =>
    makeIO<T>(() => Promise.resolve(thunk()));

  private readonly run = async () => this.act();

  readonly fbind = <M>(io: (maps: T) => IO<M>) =>
    makeIO(() =>
      this.act()
        .then((x) => io(mapBad(x)).run())
        .catch((x) => io(bad<T>()).run())
    );

  readonly then = <R>(f: (maps: T) => R) =>
    makeIO(() => {
      return this.act()
        .then((x) => (isBad(x) ? mapBad(x) : mapBad(f(x))))
        .catch((x) => bad<R>());
    });

  readonly fmap = this.then;

  readonly ret_with_default = async (def: T) => {
    const v = await this.run();
    return with_default(def)(v);
  };

  readonly swap_with_default = (def: T) => async (cont: Function) => {
    const v = await this.run();
    return cont(with_default(def)(v));
  };
}

export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
export const writeStdOut = async (s: string) =>
  new Promise<U>((resolved) => process.stdout.write(s, (z) => resolved(u)));

export const writeStdOutForward =
  <T>(val: T) =>
  async (s: string) =>
    new Promise<T>((resolved) => process.stdout.write(s, (z) => resolved(val)));

export const putStrGen =
  async <T>(val: T) =>
  async (s: string) =>
    makeIO(() => writeStdOutForward(val)(s));
//This is a good model, its a raw socket write,
//So we need to attach a callback to it
export const putStr = (s: string) => makeIO(() => writeStdOut(s));

export const getLine = () => reader.question("");

export const getStr = (x: U) => IO.rootfun(getLine);

export const pure = <T>(x: T) => IO.root(x);
