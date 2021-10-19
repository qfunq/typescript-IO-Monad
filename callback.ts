import { log, xlog } from "./logging";

export const Deferred = <T>() => undefined as unknown as T;

//Basically we have two continuations and we want to map them
//to composable monadic operations, bind, fmap, ret_default
//As we evaluate each value, we need to pass the two continuations
//back down the chain, preserving the call chain.

export class LightPromise<T> {
  private status: string;
  private value: T = Deferred<T>();
  private error: Error = Deferred<Error>();

  constructor(
    action: (
      resolveCallback: (maps: T) => void,
      rejectCallback: (maps: Error) => void
    ) => void
  ) {
    this.status = "pending";
    action(this.resolve.bind(this), this.reject.bind(this));
  }

  private resolve(arg: T) {
    this.status = "resolved";
    this.value = arg; //We dont want to do anything with the callback except apply in to the then callback
    log().info("resolve: ").info(arg);
  }

  private reject(arg: Error) {
    this.status = "rejected";
    this.error = arg;
    log().info("rejected ");
  }
}
