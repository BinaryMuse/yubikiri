async function resolveSpec (spec) {
  const results = Object.create(Reflect.getPrototypeOf(spec))
  const proxy = createProxy(Object.create(null), spec, results)

  const allPromises = Reflect.ownKeys(spec).map(async (key) => {
    results[key] = await proxy[key]
  })
  await Promise.all(allPromises)
  return results
}

function createProxy (target, spec, results, pending) {
  return new Proxy(target, {
    get (target, name) {
      if (pending && pending.has(name)) {
        const loop = Array.from(pending).concat([name]).join(' -> ')
        const err = new Error('infinite loop detected: ' + loop)
        return Promise.reject(err)
      } else {
        const getter = createGetter(spec, results, pending)
        return getter(target, name)
      }
    }
  })
}

function createGetter (spec, results, pending) {
  return async function (target, name) {
    if (Reflect.has(results, name)) {
      return results[name]
    }

    if (typeof spec[name] === 'function') {
      if (Reflect.has(target, name)) {
        return target[name]
      }

      const childPending = pending || new Set()
      childPending.add(name)
      const childProxy = createProxy(target, spec, results, childPending)
      const promise = spec[name](childProxy)
      target[name] = promise
      const result = await promise
      results[name] = result
      childPending.delete(name)
      return result
    } else {
      return spec[name]
    }
  }
}

module.exports = resolveSpec
