import { Possibly } from "./badValues";

//no fbind method ... needs run ... see mio.ts

export class Maybe<T> {
  private constructor(private value: Possibly<T>) {}

  static isGood = <T>(value: Possibly<T>) =>
    value !== null && value !== undefined;
  readonly isGood = () => Maybe.isGood(this.value);

  static just = <T>(value: T) =>
    Maybe.isGood(value) ? new Maybe(value) : new Maybe<T>(null);

  readonly fmap = <S>(f: (maps: T) => S) =>
    this.isGood() ? new Maybe(f(this.value as T)) : new Maybe<S>(null);

  readonly finally = (defaultValue: T) =>
    this.isGood() ? this.value : defaultValue!;

  //Trigger a compile time error if the default value is not defined, and as this is the only escape route from the
  //monad, we just need to test this really stops the build.
}
