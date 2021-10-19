## Typescript-IO-Monad

A minimal port of Bartosz Milewski's C++ monadic IO to typescript.

https://www.youtube.com/watch?v=vkcxgagQ4bM

Fully working in synchronous mode. Async monadic IO has complications arising from Promises.

The type system seems to work pretty well, many types can be deduced by the compiler.

Still to be tested with a recursive monad.

## Is there anyone out there?

Feel free to join the chat thread in issues.

## Why is this highly abstract code important?

Because typescript interfaces with the outside world using non monadic apis, and all of these appear
to be a major source of bugs, often due to the defensive/obscure nature of the code involved, which is as contagious as the source of the issues: `async/await/try/catch/undefined/null/?./!.`. If anyone else knows of other contagious and dangerous operations, please post them in issues.

Promises are good at doing some of what the IO monad does, but they don't compose (they only implement fmap). However an external function could implement bind, but then we gain brackets, which defeats the purpose.

## Issues

Although the code is extremely succinct (thanks Bartosz!), typescript is likely to have a hard time managing the heap, due to the explicit call of `new`.

## License

Copyright (c) 2021 Fourcube Ltd. Licensed under the MIT License.
