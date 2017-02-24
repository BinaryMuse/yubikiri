function resolveSpec(spec, resolve, reject) {
  const results = {}
  const keys = Object.keys(spec)

  const allPromises = []
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
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
            return loader(proxy).then(result => {
              pending.delete(name)
              return result
            })
          }
        } else {
          return Promise.resolve(spec[name])
        }
      }
    })
    allPromises.push(proxy[key].then(val => {
      results[key] = val
    }, err => {
      results[key] = err
      reject(err)
    }))
  }
  Promise.all(allPromises).then(() => resolve(results))
}

function yubikiri(spec) {
  return new Promise((resolve, reject) => {
    resolveSpec(spec, resolve, reject)
  })
}

module.exports = yubikiri
