function createProxy(spec, results) {
  const pending = new Set()
  const proxy = new Proxy({}, {
    get: function (target, name) {
      const loader = spec[name]
      if (results[name]) {
        return Promise.resolve(results[name])
      } else if (typeof loader === 'function') {
        if (pending.has(name)) {
          const loop = Array.from(pending).join(' -> ') + ' -> ' + name
          const err = new Error('infinite loop detected: ' + loop)
          return Promise.reject(err)
        } else {
          pending.add(name)
          return loader(proxy).then(function(result) {
            pending.delete(name)
            return result
          })
        }
      } else {
        return Promise.resolve(spec[name])
      }
    }
  })

  return proxy
}

function resolveSpec(spec, resolve, reject) {
  const results = {}
  const keys = Object.keys(spec)

  const allPromises = []
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    const proxy = createProxy(spec, results)

    allPromises.push(proxy[key].then(function(val) {
      results[key] = val
    }))
  }
  Promise.all(allPromises).then(function () { resolve(results) }, function(err) { reject(err) })
}

function yubikiri(spec) {
  return new Promise(function (resolve, reject) {
    resolveSpec(spec, resolve, reject)
  })
}

module.exports = yubikiri
