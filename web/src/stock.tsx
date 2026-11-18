// shortcut: "almost gone" threshold is fixed here; move it to the API if admins need to tune it.
export const LOW_STOCK = 3

/** "Only 2 left" / "Sold out" beside a price; nothing when stock is healthy. */
export function StockNote({ quantity }: { quantity: number }) {
  if (quantity === 0) return <span className="out">Sold out</span>
  if (quantity <= LOW_STOCK) return <span className="low">Only {quantity} left</span>
  return null
}
