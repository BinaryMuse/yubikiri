let yubikiri = require('../')
let assert = require('chai').assert

describe('yubikiri', function () {
  it('loads data', async function() {
    const promise = yubikiri({
      one: Promise.resolve(1),
      two: Promise.resolve(2)
    })
    const data = await promise
    assert.deepEqual(data, {one: 1, two: 2})
  })

  describe('dependent data', function() {
    it('loads a promise dependent on another value', async function() {
      const promise = yubikiri({
        one: Promise.resolve(1),
        two: async (q) => {
          const one = await q.one
          return one + 1
        }
      })
      const data = await promise
      assert.deepEqual(data, {one: 1, two: 2})
    })

    it('works independent of timing', async function() {
      const promise = yubikiri({
        one: Promise.resolve(1),
        two: async (q) => {
          const one = await q.one
          return new Promise(res => setTimeout(() => res(one + 1), 10))
        }
      })
      const data = await promise
      assert.deepEqual(data, {one: 1, two: 2})
    })

    it('allows depending on other depdendent values', async function() {
      const promise = yubikiri({
        one: async (q) => {
          const two = await q.two
          return two - 1
        },
        two: Promise.resolve(2),
        three: async (q) => {
          const one = await q.one
          return one + 2
        },
      })
      const data = await promise
      assert.deepEqual(data, {one: 1, two: 2, three: 3})
    })

    it('allows depending on multiple values', async function() {
      const promise = yubikiri({
        one: Promise.resolve(1),
        two: Promise.resolve(2),
        three: async (q) => {
          const one = await q.one
          const two = await q.two
          return one + two
        },
      })
      const data = await promise
      assert.deepEqual(data, {one: 1, two: 2, three: 3})
    })

    it('rejects immediately when any promise fails', async function() {
      const promise = yubikiri({
        one: Promise.resolve(1),
        two: new Promise((res, rej) => {
          setTimeout(() => rej(new Error('oops')), 10)
        })
      })
      try {
        await promise
        throw new Error('Expected promise to be rejected')
      } catch (err) {
        assert.equal(err.message, 'oops')
      }
    })

    it('works independent of order', async function() {
      const promise = yubikiri({
        one: async (q) => {
          const three = await q.three
          return three - 2
        },
        two: Promise.resolve(2),
        three: async (q) => {
          const two = await q.two
          return two + 1
        },
      })
      const data = await promise
      assert.deepEqual(data, {one: 1, two: 2, three: 3})
    })

    it('does not loop infinitely', async function() {
      const promise = yubikiri({
        one: async (q) => {
          const three = await q.three
          return three - 2
        },
        two: async (q) => {
          const one = await q.one
          return one + 1
        },
        three: async (q) => {
          const two = await q.two
          return two + 1
        },
      })
      try {
        const data = await promise
        throw new Error('Expected promise to be rejected')
      } catch (err) {
        assert.match(err.message, /loop.*one -> three -> two -> one/)
      }
    })

    it('only calculates a value once', async function() {
      const data = await yubikiri({
        random: () => new Promise(res => res(Math.random())),
        one: (q) => q.random,
        two: (q) => q.random,
        three: (q) => q.random
      })

      assert.equal(data.random, data.one)
      assert.equal(data.random, data.two)
      assert.equal(data.random, data.three)
    })
  })
})
