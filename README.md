# ゆびきり (Yubikiri)

ゆびきり (*yubikiri*, or "pinky swear") is a library to facilitate Promise-based data loading in JavaScript. You provide an object filled with plain values, Promises, or functions, and Yubikiri will order the dependencies and return a Promise that resolves to an object with all the sub-Promises resolved.

## Installation

Yubikiri makes use of **Proxies**, **Reflect**, and **async/await**. Node.js v7.6.0 is the first version that supports Yubikiri.

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

You can also specify functions that depend on other values being calculated at the same time. Yubikiri will take care of ensuring the values that depend on each other are resolved correctly. Each function is only calculated once, even if more than one other function depends on its value.

```javascript
const data = await yubikiri(query => ({
  one: Promise.resolve(1),
  two: 2,
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

Yubikiri will try to detect infinite loops and return a rejected Promise with an error message that describes the dependency loop.
