let yubikiri = require('../')
let assert = require('chai').assert

describe('yubikiri', () => {
  it('loads data', function(done) {
    const promise = yubikiri({
      one: Promise.resolve(1),
      two: Promise.resolve(2)
    })
    promise.then(function(data) {
      assert.deepEqual(data, {one: 1, two: 2})
    }).then(done, done)
  })

  describe('dependent data', function() {
    it('loads a promise dependent on another value', function(done) {
      const promise = yubikiri({
        one: Promise.resolve(1),
        two: function(q) {
          return q.one.then(function(value) {
            return value + 1
          })
        }
      })
      promise.then(function(data) {
        assert.deepEqual(data, {one: 1, two: 2})
      }).then(done, done)
    })

    it('works independent of timing', function(done) {
      const promise = yubikiri({
        one: Promise.resolve(1),
        two: function(q) {
          return q.one.then(function(value) {
            return new Promise((r) => setTimeout(() => r(value + 1), 10))
          })
        }
      })
      promise.then(function(data) {
        assert.deepEqual(data, {one: 1, two: 2})
      }).then(done, done)
    })

    it('allows depending on other depdendent values', function(done) {
      const promise = yubikiri({
        one: function(q) {
          return q.two.then(function(value) {
            return value - 1
          })
        },
        two: Promise.resolve(2),
        three: function(q) {
          return q.one.then(function(value) {
            return value + 2
          })
        },
      })
      promise.then(function(data) {
        assert.deepEqual(data, {one: 1, two: 2, three: 3})
      }).then(done, done)
    })

    it('rejects immediately when any promise fails', function(done) {
      const promise = yubikiri({
        one: Promise.resolve(1),
        two: new Promise((res, rej) => {
          setTimeout(() => rej(new Error('oops')), 10)
        })
      })
      promise.then(() => {
        done(new Error('Expected to reject'))
      }, function(err) {
        assert.equal(err.message, 'oops')
        done()
      }).then(null, done)
    })

    it('works independent of order', function(done) {
      const promise = yubikiri({
        one: function(q) {
          return q.three.then(function(value) {
            return value - 2
          })
        },
        two: Promise.resolve(2),
        three: function(q) {
          return q.two.then(function(value) {
            return value + 1
          })
        },
      })
      promise.then(function(data) {
        assert.deepEqual(data, {one: 1, two: 2, three: 3})
      }).then(done, done)
    })

    it('does not loop infinitely', function(done) {
      const promise = yubikiri({
        one: function(q) {
          return q.three.then(function(value) {
            return value - 2
          })
        },
        two: function(q) {
          return q.one.then(function(value) {
            return value + 1
          })
        },
        three: function(q) {
          return q.two.then(function(value) {
            return value + 1
          })
        },
      })
      promise.then(function() {
        done(new Error('Excepted to reject with an error'))
      }, function(err) {
        assert.match(err.message, /loop.*one -> three -> two -> one/)
        done()
      }).then(null, done)
    })
  })
})
