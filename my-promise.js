const isObject = (value) => {
  return typeof value === "object" && value !== null;
};
const isFunction = (value) => {
  return typeof value === "function";
};
const isPlentyValue = (value) => {
  return !isObject(value) && !isFunction(value);
};
const isPromise = (value) => {
  return value instanceof MyPromise;
};
const runAsync = (callback) => {
  setTimeout(callback);
};
const passIt = (value) => {
  return value;
};
const throwIt = (value) => {
  throw value;
};

const states = {
  pending: "pending",
  resolved: "resolved",
  rejected: "rejected",
};

class MyPromise {
  constructor(executor) {
    this.state = states.pending;
    this.value = null;
    this.onResolveCallbacks = [];
    this.onRejectCallbacks = [];

    const resolve = (value) => {
      if (this.state === states.pending) {
        this.value = value;
        this.state = states.resolved;
        this.onResolveCallbacks.forEach((callback) => callback(this.value));
      }
    };
    const reject = (value) => {
      if (this.state === states.pending) {
        this.value = value;
        this.state = states.rejected;
        this.onRejectCallbacks.forEach((callback) => callback(this.value));
      }
    };

    executor(resolve, reject);
  }

  then(onResolve, onReject) {
    onResolve = isFunction(onResolve) ? onResolve : passIt;
    onReject = isFunction(onReject) ? onReject : throwIt;

    if (this.state === states.resolved) {
      const promise = new MyPromise((resolve, reject) => {
        runAsync(() => {
          try {
            const value = onResolve(this.value);
            resolveRecursively(value, resolve, reject, promise);
          } catch (error) {
            reject(error);
          }
        });
      });
      return promise;
    } else if (this.state === states.rejected) {
      const promise = new MyPromise((resolve, reject) => {
        runAsync(() => {
          try {
            const value = onReject(this.value);
            resolveRecursively(value, resolve, reject, promise);
          } catch (error) {
            reject(error);
          }
        });
      });
      return promise;
    } else {
      const promise = new MyPromise((resolve, reject) => {
        this.onResolveCallbacks.push(() => {
          runAsync(() => {
            try {
              const value = onResolve(this.value);
              resolveRecursively(value, resolve, reject, promise);
            } catch (error) {
              reject(error);
            }
          });
        });
        this.onRejectCallbacks.push(() => {
          runAsync(() => {
            try {
              const value = onReject(this.value);
              resolveRecursively(value, resolve, reject, promise);
            } catch (error) {
              reject(error);
            }
          });
        });
      });
      return promise;
    }
  }
}

const resolveRecursively = (value, resolve, reject, promise) => {
  if (value === promise) {
    reject(new TypeError());
  } else if (isPlentyValue(value)) {
    resolve(value);
  } else if (isPromise(value)) {
    resolvePromise(value, resolve, reject, promise);
  } else {
    resolveAsThenable(value, resolve, reject, promise);
  }
};

const resolvePromise = (value, resolve, reject, promise) => {
  const onResolve = (nextValue) => {
    resolveRecursively(nextValue, resolve, reject, promise);
  };
  const onReject = reject;
  value.then(onResolve, onReject);
};

const resolveAsThenable = (value, resolve, reject, promise) => {
  const then = getThenOrReject(value, reject);
  const isThenable = isFunction(then);
  if (isThenable) {
    let called = false;
    const onResolve = (nextValue) => {
      if (!called) {
        called = true;
        resolveRecursively(nextValue, resolve, reject, promise);
      }
    };
    const onReject = (nextValue) => {
      if (!called) {
        reject(nextValue);
      }
    };
    try {
      then.bind(value)(onResolve, onReject);
    } catch (error) {
      if (!called) {
        reject(error);
      }
    }
  } else {
    resolve(value);
  }
};

const getThenOrReject = (value, reject) => {
  let then;
  try {
    then = value.then;
  } catch (error) {
    reject(error);
  }
  return then;
};

module.exports = MyPromise;
