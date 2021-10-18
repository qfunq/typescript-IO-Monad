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
// in typescript, bar it requires async handling.

//Do we need 2 apis, one for promises and one for synchronous functions?
//

export type MaybePromise<T> = T | Promise<T>;

export type Thunk<T> = () => MaybePromise<T>;

export const makeIO = async <T>(f: Thunk<T>) => new IO<T>(f);

export class IO<T> {
  act: Thunk<T>;

  constructor(action: Thunk<T>) {
    this.act = action;
  }

  readonly run = async () => await this.act();

  readonly bind = async <M>(f: (maps: T) => IO<M>) =>
    makeIO(async () => {
      const result = await this.act();
      return await f(result).run();
    });

  readonly fmap = async <R>(f: (maps: T) => MaybePromise<R>) =>
    makeIO(async () => {
      const result = await this.act();
      return await f(result);
    });
}

export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const putStr = (s: string) =>
  makeIO(() => {
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

export const getStr = (x: U) => makeIO(() => readLine());
