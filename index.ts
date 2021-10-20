#!./node_modules/.bin/ts-node
import { u, U, cr } from "./unit";
//import { getStr, putStr, pure, guess } from "./IOMonad";
import { getStr, putStr, pure, guess, IOP } from "./maybeIO";
import { MyPromise } from "./promise";
import { Maybe } from "./maybe";
import { LightPromise, LightPromise2 } from "./callback";
import { log } from "./logging";

//https://www.youtube.com/watch?v=vkcxgagQ4bM 21:15 ... you might be asking, what is this U?

// The next line is a problem, because it uses the heap. The compiler needs to do a lot more work
// to build monadic code efficiently, largely eliminating this new, according to the context.
// Since we are explicitly calling new, this will be tricky.
// The compiler will take this new instruction literally. This is the main point of Bartosz's
// lecture, its a howto and a warning: take this code seriously, it presents problems for compilers.
// C++ has big issues with it, and typescript suffers too.
// There are workarounds, based on coroutines, which can allocate memory more efficiently.

const prompt =
  <V>(str: string) =>
  (x: V) =>
    putStr(str);
export const test = IOP.root(u)
  .fbind(prompt("hello"))
  .fbind(prompt(" world!\n"));

//test2.run();

const low = 1;
const high = 1024;

export const test2 = test

  .fbind(prompt("What is your name?\n"))
  .fbind(getStr)
  .fmap((s: string) => s.toUpperCase())
  .fbind((name: string) => putStr(cr + "Hi " + name + cr));

// Works out the box in typescript! That's an improvement over C++ that has problems
// when the thunk is strongly typed, requiring the std::function hack described by Bartosz.
const test3 = test2
  .fbind(
    prompt(
      "Think of a number between " +
        low.toString() +
        " and " +
        high.toString() +
        cr
    )
  )
  .fbind((x) => guess(low, high))
  .fbind((ans) => putStr(cr + "The answer is: " + ans.toString() + cr));

export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

Maybe.just(10)
  .fmap((x) => x + 1)
  .fmap((x) => x.toString())
  .fmap((s) => {
    console.log(s);
    return s;
  })
  .finally("default");

//Promises fire off their resolution as soon as they are created.
//For IO composition, we need to defer this.

const testit = async () => {
  await test3.run();

  log().info("Result: ");
};

testit();
