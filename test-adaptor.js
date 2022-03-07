// This file is for running the tests of Promises/A+ specification.
// https://github.com/promises-aplus/promises-tests
const MyPromise = require("./my-promise");

MyPromise.deferred = () => {
  const result = {};
  result.promise = new MyPromise((resolve, reject) => {
    result.resolve = resolve;
    result.reject = reject;
  });
  return result;
};

module.exports = MyPromise;
