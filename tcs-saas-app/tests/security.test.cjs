/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS Node test harness. */
const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')

function load(relative, dependencies = {}, globals = {}) {
  const source = fs.readFileSync(path.join(__dirname, '..', relative), 'utf8')
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
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
  const { createTrustedOrder, orderAttempt } = load('lib/orders/create-order.ts', {
    '@/lib/utils/constants': { SHOP_ID: 'shop-a' },
  }, { crypto: require('node:crypto').webcrypto })
  const request = { items: [{ product_id: '30000000-0000-0000-0000-000000000001', quantity: 2, price: 1, total: 2 }],
    type: 'pickup', paymentMethod: 'qris' }
  const first = orderAttempt(request, null)
  assert.equal(orderAttempt(request, first).key, first.key)
  assert.notEqual(orderAttempt({ ...request, items: [{ ...request.items[0], quantity: 3 }] }, first).key, first.key)
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
})
