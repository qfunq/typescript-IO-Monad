import reader from "readline-sync";
import { u, U } from "./unit";

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
export type Thunk<T> = () => T;

export const makeIO = <T>(f: Thunk<T>) => new IO<T>(f);

export class IO<T> {
  private act: () => T;

  constructor(action: Thunk<T>) {
    this.act = action;
  }

  readonly run = () => this.act();

  readonly bind = <M>(f: (maps: T) => IO<M>) =>
    makeIO(() => f(this.act()).run());

  readonly fmap = <R>(f: (maps: T) => R) =>
    makeIO(() => {
      return f(this.act());
    });
}

export const putStr = (s: string) =>
  makeIO(() => {
    console.log(s);
    return u;
  });

export const getLine = () => reader.question("");
export const getStr = (x: U) => makeIO(() => getLine());
