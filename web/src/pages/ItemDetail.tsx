import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api, money, type Item } from '../api.ts'

/** Product page: full details plus how many are left in stock. */
export default function ItemDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  // Result is tagged with the id it belongs to, so a stale result never shows for a different id.
  const [result, setResult] = useState<{ id?: string; item?: Item; error?: string }>({})

  useEffect(() => {
    api<{ item: Item }>(`/items/${id}`)
      .then((r) => setResult({ id, item: r.item }))
      .catch((e) => setResult({ id, error: e.message }))
  }, [id])

  const { item, error } = result.id === id ? result : {}
  if (error) return <p className="error" role="alert">{error}. <Link to="/">Back to catalog</Link></p>
  if (!item) return <p>Loading…</p>

  return (
    <article className="detail">
      <img src={item.imageUrl ?? ''} alt={`${item.name} cover`} />
      <div>
        {/* Back keeps the catalog's filters (they live in the previous URL); opened directly, there's no previous page, so go to the catalog */}
        <button type="button" className="link" onClick={() => (window.history.state?.idx > 0 ? navigate(-1) : navigate('/'))}>← Back</button>
        <h1>{item.name}</h1>
        <p className="price">{money(item.priceCents)}</p>
        <p>{item.description}</p>
        <dl>
          <dt>Format</dt><dd>{item.category}</dd>
          <dt>Edition</dt><dd>{item.model}</dd>
          <dt>Label</dt><dd>{item.brand}</dd>
          <dt>Genre</dt><dd>{item.genre}</dd>
          <dt>In stock</dt><dd>{item.quantity > 0 ? `${item.quantity} left` : 'Out of stock'}</dd>
        </dl>
        {/* Add to cart goes here once the cart is built */}
      </div>
    </article>
  )
}
