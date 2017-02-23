module.exports = function(spec) {
  const specPromises = Object.assign({}, spec)
  Object.keys(spec).forEach(key => {
    const value = spec[key]
    if (typeof value === 'function') {
      specPromises[key] = new Promise(function(resolve, reject) {
        setImmediate(() => value(specPromises).then(resolve, reject))
      })
    }
  })
  return new Promise(function(resolve, reject) {
    const results = {}
    const promises = Object.keys(specPromises).map(key => {
      return specPromises[key].then(val => {
        results[key] = val
      })
    })
    Promise.all(promises).then(_ => resolve(results))
  })
}
