# ゆびきり (Yubikiri)

ゆびきり (*yubikiri*, or "pinky swear") is a library to facilitate Promise-based data loading in JavaScript. You can specify an object where keys are Promises and the library will fetch them in parallel and return a Promise that resolves when all the Promises resolve. You can also specify Promises that depend on other Promises defined in the object and Yubikiri will order then appropriately.

## Requirements

Yubikiri makes use of **Promises** and **Proxies**, so both these must be available in your JavaScript environment for Yubikiri to work.

## Installation

With npm:

```
npm install [--save] yubikiri
```

## Usage

Yubikiri exposes a single function that takes a JavaScript object. The keys of this object are names to be used in the result, and the values are Promises that will be resolved.

```javascript
const data = await yubikiri({
  one: Promise.resolve(1),
  two: Promise.resolve(2)
})

// data === { one: 1, two: 2 }
```

You can also specify Promises that depend on other Promises being loaded at the same time. Yubikiri will take care of ensuring the Promises that depend on each other are resolved correctly.

```javascript
const data = await yubikiri(query => ({
  one: Promise.resolve(1),
  two: Promise.resolve(2),
  three: (query) => {
    return query.one.then(one => {
      return query.two.then(two => {
        return one + two
      })
    })
  }
}))

// data === { one: 1, two: 2, three: 3 }
```

If you're using async/await, this pattern can be a little nicer:

```javascript
const data = await yubikiri(query => ({
  one: Promise.resolve(1),
  two: Promise.resolve(2),
  three: async (query) => {
    const [one, two] = await Promise.all([query.one, query.two])
    return one + two
  }
}))

// data === { one: 1, two: 2, three: 3 }
```

If any of the specified Promises reject, the overall Promise returned from Yubikiri will also reject with the same value.

Yubikiri will try to detect accidental infinite loops and return a rejected Promise, but it's possible to build an asynchronous infinite loop that it can't detect.

## Developing

Yubikiri requires a version of Node with Proxy support to work. Additionally, the tests utilize async/await, so those must also be available in your environment to run the tests. Node 7.6.0 is the first version of Node that can run Yubikiri and the tests natively.
