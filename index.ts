#!./node_modules/.bin/ts-node
import { u, U } from "./unit";
import { getStr, putStr, pure, guess } from "./IOMonad";
import { MyPromise } from "./promise";

export type BadData = undefined | null;

export type Possibly<T> = T | BadData;

//https://www.youtube.com/watch?v=vkcxgagQ4bM 21:15 ... you might be asking, what is this U?

// The next line is a problem, because it uses the heap. The compiler needs to do a lot more work
// to build monadic code efficiently, largely eliminating this new, according to the context.
// Since we are explicitly calling new, this will be tricky.
// The compiler will take this new instruction literally. This is the main point of Bartosz's
// lecture, its a howto and a warning: take this code seriously, it presents problems for compilers.
// C++ has big issues with it, and typescript suffers too.
// There are workarounds, based on coroutines, which can allocate memory more efficiently.

export const test = putStr("hello").bind((x: U) => putStr(" world!\n"));

test.run();

test.run();

export const cr = "\n";

export const test2 = putStr("What is your name? ")
  .bind(getStr)
  .fmap((s: string) => s.toUpperCase())
  .bind((name: string) => putStr(cr + "Hi " + name + cr));

test2.run();

const low = 1;
const high = 1024;

// Works out the box in typescript! That's an improvement over C++ that has problems
// when the thunk is strongly typed, requiring the std::function hack described by Bartosz.

putStr(
  "Think of a number between " + low.toString() + " and " + high.toString() + cr
)
  .bind((x: U) => guess(low, high))
  .bind((ans: number) => putStr(cr + "The answer is: " + ans.toString() + cr))
  .run();

export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
