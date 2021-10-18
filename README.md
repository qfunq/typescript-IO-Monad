## typescript-io-monad

A minimal port of Bartosz Milewski's C++ monadic IO to typescript.

https://www.youtube.com/watch?v=vkcxgagQ4bM

Fully working in syncronous mode. Async monadic IO has complications arising from Promises.

The type system seems to work pretty well, many types can be deduced by the compiler.

## Issues

Although the code is extremely succinct (thanks Bartosz!), typescript is likely to have a hard time managing the heap, due to the explicit call of `new`.

Any ideas on how to best cope with async monadic IO is more than welcome in the issues forum.

## License

Copyright (c) 2021 Fourcube Ltd. Licensed under the MIT License.
