import reader from "readline-sync";
import { u, U } from "./unit";

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

enum MIOErrors {
  none = "",
  exception = "exception",
  catch = "catch",
  undefined = "undefined",
  null = "null",
  run = "run",
  runCatch = "run catch",
}

export type TErrorHandler<F> = (lineErr: Error) => (mioerr: MIOErrors) => F;

export const errorHandler =
  <F>(fail: F) =>
  (lineErr: Error) =>
  (mioerr: MIOErrors) =>
    fail;

export const unitErrorHandler = errorHandler(u);

export type TunitThunk = () => U;

export const transferIO = async <A, F>(
  a: Thunk<A>,
  fail: TErrorHandler<F>,
  msg: MIOErrors
) => new IO_aux<A, F>(a, fail, msg);

export const noMIOErrors = () => MIOErrors.none;

export const IO = <A>(a: Thunk<A>) =>
  transferIO(a, unitErrorHandler, noMIOErrors());

export class IO_aux<T, F> {
  act: Thunk<T>;
  onFail: TErrorHandler<F>;
  msg: MIOErrors;

  readonly isGood = () => this.msg === noMIOErrors();

  constructor(action: Thunk<T>, fail: TErrorHandler<F>, msg: MIOErrors) {
    this.act = action;
    this.onFail = fail;
    this.msg = msg;
  }

  readonly run = async () => {
    if (this.isGood())
      try {
        return await this.act();
      } catch {
        return this.onFail(new Error())(MIOErrors.run);
      }
    else {
      return this.onFail(new Error())(MIOErrors.runCatch);
    }
  };

  readonly bind = async <M>(f: (maps: T) => IO_aux<M, F>) => {
    transferIO(
      async () => {
        const result = await this.act();
        return await f(result).run();
      },
      this.onFail,
      this.msg
    );
  };
  readonly fmap = async <R>(f: (maps: T) => MaybePromise<R>) =>
    transferIO(
      async () => {
        const result = await this.act();
        return await f(result);
      },
      this.onFail,
      this.msg
    );
}

export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const putStr = (s: string) =>
  IO(() => {
    console.log(s);
    return u;
  });

async function readLine(): Promise<string> {
  const readLine = require("readline").createInterface({
    input: process.stdin,
    //output: process.stdout
  });

  let answer = "";
  readLine.question("", (it: string) => {
    answer = it;
    readLine.close();
  });
  while (answer == "") {
    await delay(100);
  }

  return answer;
}

export const getStr = (x: U) => IO(() => readLine());
