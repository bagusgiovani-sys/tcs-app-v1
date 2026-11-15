/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS Node test harness. */
const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')

function load(relative, dependencies = {}, globals = {}) {
  const source = fs.readFileSync(path.join(__dirname, '..', relative), 'utf8')
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 } }).outputText
  const exports = {}
  vm.runInNewContext(code, { exports, URL, ...globals, require: (id) => {
    if (!(id in dependencies)) throw new Error(`Unexpected import: ${id}`)
    return dependencies[id]
  } })
  return exports
}

const { safeRedirect } = load('lib/utils/safe-redirect.ts')
test('redirects reject external destinations and parser tricks', () => {
  for (const input of [null, {}, 'https://evil.test', '//evil.test', '/\\evil.test', '/%2fexample.com', '/%5cevil.test', '/\nevil.test', '/%0devil.test', '/%zz']) {
    assert.equal(safeRedirect(input), '/', String(input))
  }
  assert.equal(safeRedirect('/order/123?from=checkout#status'), '/order/123?from=checkout#status')
})

function adminGuard(user, profile, authError = null, profileError = null) {
  const client = {
    auth: { getUser: async () => ({ data: { user }, error: authError }) },
    from: () => ({ select: () => ({ eq: () => ({ single: async () => ({ data: profile, error: profileError }) }) }) }),
  }
  return load('lib/auth/require-shop-admin.ts', {
    'server-only': {},
    '@/lib/supabase/server': { createClient: async () => client },
    '@/lib/utils/constants': { SHOP_ID: 'shop-a' },
  }).requireShopAdmin
}

test('admin action guard fails closed for missing identity, wrong role, wrong shop and query errors', async () => {
  for (const guard of [
    adminGuard(null, null),
    adminGuard({ id: 'a' }, { role: 'customer', org_id: 'shop-a' }),
    adminGuard({ id: 'a' }, { role: 'staff', org_id: 'shop-a' }),
    adminGuard({ id: 'a' }, { role: 'admin', org_id: 'shop-b' }),
    adminGuard({ id: 'a' }, null, null, new Error('database unavailable')),
    adminGuard({ id: 'a' }, { role: 'admin', org_id: 'shop-a' }, new Error('expired')),
  ]) await assert.rejects(guard)
  assert.ok(await adminGuard({ id: 'a' }, { role: 'admin', org_id: 'shop-a' })())
})

test('all product actions require authorization before accessing mutations', async () => {
  let checks = 0
  const actions = load('lib/actions/products.ts', {
    'next/cache': { revalidatePath: () => assert.fail('unexpected revalidation') },
    'next/navigation': { redirect: () => assert.fail('unexpected redirect') },
    '@/lib/utils/constants': { SHOP_ID: 'shop-a' },
    '@/lib/auth/require-shop-admin': { requireShopAdmin: async () => { checks++; throw new Error('Forbidden') } },
  })
  await assert.rejects(() => actions.createProduct({}), /Forbidden/)
  await assert.rejects(() => actions.updateProduct('id', {}), /Forbidden/)
  await assert.rejects(() => actions.deleteProduct('id'), /Forbidden/)
  await assert.rejects(() => actions.toggleProductAvailability('id', true), /Forbidden/)
  assert.equal(checks, 4)
})

test('service worker never caches pages or API responses and removes legacy data caches', async () => {
  let options, activate
  const deleted = []
  class NetworkOnly {}
  load('app/sw.ts', { serwist: {
    NetworkOnly,
    Serwist: class { constructor(config) { options = config } addEventListeners() {} },
  } }, {
    self: {
      location: { origin: 'https://coffee.test' },
      __SW_MANIFEST: ['/checkout', '/admin', '/auth/callback', '/api/profile', '/',
        '/_next/static/chunk.js', { url: '/icons/icon.png', revision: '1' },
        'https://external.test/_next/static/chunk.js'],
      addEventListener: (type, handler) => { assert.equal(type, 'activate'); activate = handler },
    },
    caches: {
      keys: async () => ['pages', 'pages-rsc', 'cross-origin', 'next-data', 'static-data-assets', 'unrelated-cache'],
      delete: async (name) => { deleted.push(name); return true },
    },
  })
  assert.deepEqual(Array.from(options.precacheEntries, (x) => typeof x === 'string' ? x : x.url),
    ['/_next/static/chunk.js', '/icons/icon.png'])
  assert.ok(options.runtimeCaching[0].handler instanceof NetworkOnly)
  assert.equal(options.runtimeCaching[0].matcher(), true)
  let completion
  activate({ waitUntil: (promise) => { completion = promise } })
  await completion
  assert.deepEqual(deleted, ['pages', 'pages-rsc', 'cross-origin', 'next-data', 'static-data-assets'])
})

test('checkout transmits no prices, uses trusted total, and never falls back to direct writes', async () => {
  const { createTrustedOrder, OrderRejectedError } = load('lib/orders/create-order.ts', {
    '@/lib/utils/constants': { SHOP_ID: 'shop-a' },
  }, { crypto: require('node:crypto').webcrypto })
  const request = { items: [{ product_id: '30000000-0000-0000-0000-000000000001', quantity: 2, price: 1, total: 2 }],
    type: 'pickup', paymentMethod: 'qris' }
  const first = { key: require('node:crypto').randomUUID() }
  let sent
  const client = { rpc: async (name, args) => {
    assert.equal(name, 'create_order'); sent = args
    return { data: { id: '50000000-0000-0000-0000-000000000001', total: 36000 }, error: null }
  } }
  const result = await createTrustedOrder(client, request, first.key)
  assert.equal(result.total, 36000)
  assert.deepEqual(JSON.parse(JSON.stringify(sent.p_items)), [{ product_id: request.items[0].product_id, quantity: 2, notes: null }])
  assert.equal(sent.p_idempotency_key, first.key)
  assert.equal(sent.p_shop_id, 'shop-a')
  await assert.rejects(() => createTrustedOrder({ rpc: async () => ({ error: { message: 'missing RPC' } }) }, request, first.key))
  await assert.rejects(() => createTrustedOrder({ rpc: async () => ({ data: { id: 'bad', total: 1 } }) }, request, first.key))
  await assert.rejects(() => createTrustedOrder({ rpc: async () => ({ error: { code: '22023', message: 'Invalid quantity' } }) }, request, first.key), (cause) => cause instanceof OrderRejectedError)
  await assert.rejects(() => createTrustedOrder({ rpc: async () => ({ error: { code: '22023', message: 'Request key already used for a different order' } }) }, request, first.key),
    (cause) => !(cause instanceof OrderRejectedError))
})

function pendingHarness() {
  const values = new Map()
  const held = new Set()
  class OrderRejectedError extends Error {}
  let submissions = 0
  let fail = false
  let release
  let gate = null
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  }
  const globals = {
    crypto: require('node:crypto').webcrypto, TextEncoder, localStorage: storage,
    navigator: { locks: { request: async (key, options, action) => {
      assert.equal(options.ifAvailable, true)
      if (held.has(key)) return action(null)
      held.add(key)
      try { return await action({ name: key }) }
      finally { held.delete(key) }
    } } },
  }
  const client = { from: () => {
    const query = {
      select: () => query, eq: () => query,
      single: async () => ({ data: { status: 'pending', payment_status: 'pending', payment_method: 'qris' } }),
      maybeSingle: async () => ({ data: { id: 'order-1', total: 25000, status: 'pending', payment_status: 'pending', payment_method: 'qris' } }),
    }
    return query
  } }
  function reload() {
    return load('lib/orders/pending-order.ts', {
      '@/lib/utils/constants': { SHOP_ID: 'shop-a' },
      './create-order': { OrderRejectedError, createTrustedOrder: async (supabase, request, key) => {
        submissions++
        if (gate) await gate
        if (fail === 'rejected') throw new OrderRejectedError('invalid input')
        if (fail) throw new Error('lost response')
        return { id: key, total: 25000 }
      } },
    }, globals)
  }
  const request = { items: [{ product_id: 'product-a', quantity: 1 }], type: 'pickup', paymentMethod: 'qris' }
  return { reload, request, client, values, globals,
    count: () => submissions,
    fail: (value) => { fail = value },
    pause: () => { gate = new Promise((resolve) => { release = resolve }) },
    resume: () => { release(); gate = null },
  }
}

test('lost responses preserve a durable key across reloads, with account and POS isolation', async () => {
  const h = pendingHarness()
  h.fail(true)
  await assert.rejects(() => h.reload().placePendingOrder(h.client, 'user-a', 'customer', h.request), /lost response/)
  const saved = JSON.parse([...h.values.values()][0])
  assert.ok(saved.key)
  assert.ok(!JSON.stringify(saved).includes('product-a'))
  h.fail(false)
  const resumed = await h.reload().placePendingOrder(h.client, 'user-a', 'customer', h.request)
  assert.equal(resumed.id, saved.key)
  const otherUser = await h.reload().placePendingOrder(h.client, 'user-b', 'customer', h.request)
  const pos = await h.reload().placePendingOrder(h.client, 'user-a', 'pos', h.request)
  assert.notEqual(otherUser.id, saved.key)
  assert.notEqual(pos.id, saved.key)
  await assert.rejects(() => h.reload().placePendingOrder(h.client, 'user-a', 'customer', { ...h.request, notes: 'changed' }), /belum selesai/)
  assert.equal(h.count(), 4)
})

test('two tabs cannot submit concurrently; stale cleanup cannot remove a newer attempt', async () => {
  const h = pendingHarness()
  h.pause()
  const first = h.reload().placePendingOrder(h.client, 'user-a', 'customer', h.request)
  await assert.rejects(() => h.reload().placePendingOrder(h.client, 'user-a', 'customer', h.request), /tab lain/)
  h.resume()
  const order = await first
  assert.equal(h.count(), 1)
  await h.reload().finishPendingOrder('user-a', 'customer', 'stale-key')
  assert.equal(h.values.size, 1)
  const recovered = await h.reload().recoverPendingOrder(h.client, 'user-a', 'customer')
  assert.equal(recovered.attemptKey, order.attemptKey)
  await h.reload().finishPendingOrder('user-a', 'customer', order.attemptKey)
  assert.equal(h.values.size, 0)
  const next = await h.reload().placePendingOrder(h.client, 'user-a', 'customer', h.request)
  assert.notEqual(next.attemptKey, order.attemptKey)
})

test('unavailable storage, malformed attempts and unsupported tab coordination fail before submission', async () => {
  for (const mode of ['storage', 'corrupt', 'locks']) {
    const h = pendingHarness()
    if (mode === 'storage') h.globals.localStorage.setItem = () => { throw new Error('storage blocked') }
    if (mode === 'locks') h.globals.navigator.locks = undefined
    if (mode === 'corrupt') h.values.set('tcs-order-attempt:v1:shop-a:user-a:customer', '{broken')
    await assert.rejects(() => h.reload().placePendingOrder(h.client, 'user-a', 'customer', h.request))
    assert.equal(h.count(), 0)
  }
})

test('payment confirmation updates only pending unpaid orders and accepts prior success without rewriting it', async () => {
  const { confirmOrderPayment } = load('lib/orders/confirm-payment.ts', {
    '@/lib/utils/constants': { SHOP_ID: 'shop-a' },
  })
  let state = { id: 'order-a', status: 'pending', payment_status: 'pending' }
  let writes = 0
  const client = { from: (table) => {
    assert.equal(table, 'orders')
    let mutation = null
    const filters = {}
    const query = {
      update: (value) => { mutation = value; return query },
      select: () => query,
      eq: (key, value) => { filters[key] = value; return query },
      maybeSingle: async () => {
        assert.equal(filters.shop_id, 'shop-a')
        assert.equal(filters.id, 'order-a')
        if (!mutation) return { data: state }
        assert.equal(filters.status, 'pending')
        assert.equal(filters.payment_status, 'pending')
        if (state && state.status === filters.status && state.payment_status === filters.payment_status) {
          writes++
          state = { ...state, ...mutation }
          return { data: state }
        }
        return { data: null }
      },
    }
    return query
  } }
  const [first, second] = await Promise.all([confirmOrderPayment(client, 'order-a'), confirmOrderPayment(client, 'order-a')])
  assert.equal(first.payment_status, 'paid')
  assert.equal(second.payment_status, 'paid')
  assert.equal(writes, 1)
  state.status = 'preparing'
  assert.equal((await confirmOrderPayment(client, 'order-a')).status, 'preparing')
  assert.equal(writes, 1)
  state = null
  await assert.rejects(() => confirmOrderPayment(client, 'order-a'))
  state = { id: 'order-a', status: 'cancelled', payment_status: 'paid' }
  await assert.rejects(() => confirmOrderPayment(client, 'order-a'))
})

test('definite transaction rejection releases the attempt for corrected input', async () => {
  const h = pendingHarness()
  h.fail('rejected')
  await assert.rejects(() => h.reload().placePendingOrder(h.client, 'user-a', 'customer', h.request), /invalid input/)
  assert.equal(h.values.size, 0)
  h.fail(false)
  await h.reload().placePendingOrder(h.client, 'user-a', 'customer', { ...h.request, notes: 'corrected' })
  assert.equal(h.count(), 2)
})
