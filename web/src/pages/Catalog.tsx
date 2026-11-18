import { useEffect, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api, money, type Facets, type Item } from '../api.ts'
import { LOW_STOCK, StockNote } from '../stock.tsx'

const SORTS = {
  'name-asc': 'Name: A to Z',
  'name-desc': 'Name: Z to A',
  'price-asc': 'Price: low to high',
  'price-desc': 'Price: high to low',
} as const

/**
 * Catalog with filters, search and sort. All state lives in the URL (?brand=A24&sort=price...),
 * so the back button and "continue shopping" return to the same filtered list.
 */
export default function Catalog() {
  const [params, setParams] = useSearchParams()
  const [items, setItems] = useState<Item[] | null>(null)
  const [facets, setFacets] = useState<Facets | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api<Facets>('/items/facets').then(setFacets).catch((e) => setError(e.message))
  }, [])

  const query = params.toString()
  useEffect(() => {
    let current = true // ignore responses that arrive after the filters changed again
    api<{ items: Item[] }>(`/items${query ? `?${query}` : ''}`)
      .then((r) => current && setItems(r.items))
      .catch((e) => current && setError(e.message))
    return () => {
      current = false
    }
  }, [query])

  function set(changes: Record<string, string>) {
    const next = new URLSearchParams(params)
    for (const [k, v] of Object.entries(changes)) {
      if (v) next.set(k, v)
      else next.delete(k)
    }
    setParams(next)
  }

  function onSearch(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    set({ q: String(new FormData(e.currentTarget).get('q') ?? '').trim() })
  }

  const sortKey = `${params.get('sort') ?? 'name'}-${params.get('dir') ?? 'asc'}`
  // Format is the tab row; the rest are dropdowns.
  const filters = [
    ['brand', 'Label', facets?.brands],
    ['model', 'Edition', facets?.models],
    ['genre', 'Genre', facets?.genres],
  ] as const
  const category = params.get('category') ?? ''
  const filtered = category || filters.some(([key]) => params.get(key)) || params.get('q')
  const lowCount = items?.filter((i) => i.quantity > 0 && i.quantity <= LOW_STOCK).length ?? 0

  return (
    <>
      <div className="title-row">
        <h1>Catalog</h1>
        <p className="subline">
          {items === null ? ' ' : `${items.length} ${items.length === 1 ? 'title' : 'titles'}`}
          {lowCount > 0 && <> · <span className="low">{lowCount} almost gone</span></>}
        </p>
      </div>

      <nav className="tabs" aria-label="Format">
        {['', ...(facets?.categories ?? [])].map((c) => (
          <button key={c || 'all'} type="button" aria-pressed={category === c} onClick={() => set({ category: c })}>
            {c || 'All formats'}
          </button>
        ))}
      </nav>

      <div className="toolbar">
        <form onSubmit={onSearch} role="search" className="search">
          {/* key resets the box when the URL's q changes (e.g. "Clear filters") */}
          <input key={params.get('q') ?? ''} name="q" type="search" placeholder="Title, genre or label"
            defaultValue={params.get('q') ?? ''} aria-label="Search the catalog" />
          <button className="secondary">Search</button>
        </form>
        {filters.map(([key, label, options]) => (
          <select key={key} aria-label={label} value={params.get(key) ?? ''} onChange={(e) => set({ [key]: e.target.value })}>
            <option value="">Any {label.toLowerCase()}</option>
            {options?.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        ))}
        <select aria-label="Sort" className="sort" value={sortKey} onChange={(e) => {
          const [sort, dir] = e.target.value.split('-')
          set({ sort, dir })
        }}>
          {Object.entries(SORTS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        {filtered && <button type="button" className="link" onClick={() => setParams({})}>Clear</button>}
      </div>

      {error && <p className="error" role="alert">Couldn't load the catalog: {error}</p>}
      {items === null && !error ? (
        <ul className="grid" aria-busy="true" aria-label="Loading">
          {Array.from({ length: 8 }, (_, i) => <li key={i} className="card skeleton"><div className="cover" /></li>)}
        </ul>
      ) : items?.length === 0 ? (
        <p className="empty">Nothing matches those filters. <button type="button" className="link" onClick={() => setParams({})}>Clear them</button></p>
      ) : (
        <ul className="grid">
          {items?.map((item) => (
            <li key={item.id} className="card">
              <Link to={`/items/${item.id}`}>
                <span className="cover">
                  <img src={item.imageUrl ?? ''} alt="" loading="lazy" />
                  <span className="case">{item.category}</span>
                </span>
                <span className="name">{item.name}</span>
              </Link>
              <span className="meta">{item.brand} · {item.model}</span>
              <span className="price-line">
                <span className="num">{money(item.priceCents)}</span>
                <StockNote quantity={item.quantity} />
              </span>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
