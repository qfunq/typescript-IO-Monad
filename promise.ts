//https://medium.com/@nsready/implementing-promise-in-typescript-2a8a017d821c

//import { resolve } from "path";

interface Thenable {
  then(callback: Function): Thenable;
  catch(callback: Function): Thenable;
  finally(callback: Function): Thenable;
}

export class MyPromise implements Thenable {
  private status: string;
  private thenCallbacks: Function[];
  private catchCallback: Function;
  private finallyCallback: Function;
  private value: any;
  private error: Error;

  constructor(
    action: (resolveCallback: Function, rejectCallback: Function) => void
  ) {
    this.thenCallbacks = [];
    this.status = "pending";
    action(this.resolve.bind(this), this.reject.bind(this));
  }

  public then(callback: Function): MyPromise {
    if (this.status === "resolved") {
      this.value = callback(this.value);
    } else {
      this.thenCallbacks.push(callback);
    }
    return this;
  }

  public catch(callback: Function): MyPromise {
    if (this.status === "rejected") {
      callback(this.error);
    } else {
      this.catchCallback = callback;
    }
    return this;
  }

  public finally(callback: Function): MyPromise {
    if (this.status === "resolved" || this.status === "rejected") {
      callback(this.value);
    } else {
      this.finallyCallback = callback;
    }
    return this;
  }

  private resolve(arg: any) {
    this.status = "resolved";
    this.value = arg;
    for (const thenCallback of this.thenCallbacks) {
      this.value = thenCallback(this.value);
    }
    if (typeof this.finallyCallback !== "undefined") {
      this.finallyCallback(this.value);
    }
  }

  private reject(arg: any) {
    this.status = "rejected";
    this.error = arg;
    if (typeof this.catchCallback !== "undefined") {
      this.catchCallback(this.error);
    }
    if (typeof this.finallyCallback !== "undefined") {
      this.finallyCallback(this.value);
    }
  }
}
