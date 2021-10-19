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

export const transferIO = async <A, F>(
  a: Thunk<A>,
  fail: TErrorHandler<F>,
  msg: MIOStatus
) => new IO_aux(a, fail, msg);

export const initMIOStatus = () => MIOStatus.pending;

export const IO = <A>(a: Thunk<A>) =>
  transferIO(a, unitErrorHandler, initMIOStatus());

export const Deferred = <T>() => undefined as unknown as T;

export type Thunk_<T> = () => T;

export const makeIO = <T>(f: Thunk_<T>) => new IO_<T>(f);

export class IO_<T> {
  private act: () => T;

  constructor(action: Thunk_<T>) {
    this.act = action;
  }

  readonly run = () => this.act();

  readonly bind = <M>(f: (maps: T) => IO_<M>) =>
    makeIO(() => f(this.act()).run());

  readonly fmap = <R>(f: (maps: T) => R) =>
    makeIO(() => {
      return f(this.act());
    });
}

export class IO_aux<T> {
  private status: MIOStatus;
  private value: T = Deferred<T>();
  private error: Error = Deferred<Error>();

  readonly isGood = () => this.status === initMIOStatus();

  constructor(
    action: (resolveCallback: Function, rejectCallback: Function) => void
  ) {
    this.status = MIOStatus.pending;
    action(this.resolve.bind(this), this.reject.bind(this));
  }

  private resolve(arg: T) {
    this.status = MIOStatus.resolved;
    this.value = arg;
    for (const thenCallback of this.thenCallbacks) {
      this.value = thenCallback(this.value);
    }
  }

  private reject(arg: T) {
    this.status = MIOStatus.rejected;
    this.value = arg;
    this.error = new Error();

    if (typeof this.catchCallback !== "undefined") {
      this.catchCallback(this.error);
    }
    if (typeof this.finallyCallback !== "undefined") {
      this.finallyCallback(this.value);
    }
  }

  readonly run = async () => {
    if (this.isGood())
      try {
        return await this.act();
      } catch {
        return this.onFail(new Error())(MIOStatus.run);
      }
    else {
      return this.onFail(new Error())(MIOStatus.runCatch);
    }
  };

  readonly bind = async <M>(f: (maps: T) => IO_aux<M, F>) => {
    transferIO(
      async () => {
        const result = await this.act();
        return await f(result).run();
      },
      this.onFail,
      this.status
    );
  };
  readonly fmap = async <R>(f: (maps: T) => MaybePromise<R>) =>
    transferIO(
      async () => {
        const result = await this.act();
        return await f(result);
      },
      this.onFail,
      this.status
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
