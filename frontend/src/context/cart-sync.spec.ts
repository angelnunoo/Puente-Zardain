import assert from 'node:assert/strict'
import test from 'node:test'
import { createCartStorageController, readStoredCart, type CartItem } from './cart-sync.ts'

const tapa: CartItem = {
  productId: 'tapa-1',
  name: 'Tortilla',
  price: 8,
  quantity: 1,
  customizations: '',
}

test('the mount persist effect does not erase a cart the menu already saved', () => {
  const gate = createCartStorageController()
  const stored = JSON.stringify([tapa])

  assert.equal(gate.shouldWrite([], stored), false)
  // React Strict Mode runs the effect twice before hydration state is applied.
  assert.equal(gate.shouldWrite([], stored), false)
  assert.equal(gate.shouldWrite([tapa], stored), true)
})

test('clearing the cart still removes items after they have been shown', () => {
  const gate = createCartStorageController()
  const stored = JSON.stringify([tapa])

  assert.equal(gate.shouldWrite([], stored), false)
  assert.equal(gate.shouldWrite([tapa], stored), true)
  assert.equal(gate.shouldWrite([], stored), true)
})

test('a menu update replaces an empty in-memory cart without dropping the new line', () => {
  const storage = new Map<string, string>()
  const gate = createCartStorageController()
  let items: CartItem[] = []

  const persist = () => {
    const raw = storage.get('cart') ?? null
    if (!gate.shouldWrite(items, raw)) return
    storage.set('cart', JSON.stringify(items))
  }

  persist()
  items = readStoredCart(storage.get('cart') ?? null)
  persist()

  storage.set('cart', JSON.stringify([tapa]))
  items = readStoredCart(storage.get('cart') ?? null)
  persist()

  assert.deepEqual(items, [tapa])
  assert.deepEqual(JSON.parse(storage.get('cart') ?? '[]'), [tapa])

  items = items.map((item) => ({ ...item, quantity: 2 }))
  persist()
  assert.equal(JSON.parse(storage.get('cart') ?? '[]')[0].quantity, 2)
})

test('readStoredCart ignores corrupt payloads', () => {
  assert.deepEqual(readStoredCart(null), [])
  assert.deepEqual(readStoredCart('not-json'), [])
  assert.deepEqual(readStoredCart('{"productId":"x"}'), [])
})
