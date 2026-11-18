import { useEffect, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api, money, type Facets, type Item } from '../api.ts'

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
  const filters = [
    ['category', 'Format', facets?.categories],
    ['brand', 'Label', facets?.brands],
    ['model', 'Edition', facets?.models],
    ['genre', 'Genre', facets?.genres],
  ] as const
  const filtered = filters.some(([key]) => params.get(key)) || params.get('q')

  return (
    <>
      <h1>Catalog</h1>
      <div className="toolbar">
        <form onSubmit={onSearch} role="search" className="search">
          {/* key resets the box when the URL's q changes (e.g. "Clear filters") */}
          <input key={params.get('q') ?? ''} name="q" type="search" placeholder="Search titles, genres, labels…"
            defaultValue={params.get('q') ?? ''} aria-label="Search" />
          <button>Search</button>
        </form>
        {filters.map(([key, label, options]) => (
          <label key={key}>
            {label}
            <select value={params.get(key) ?? ''} onChange={(e) => set({ [key]: e.target.value })}>
              <option value="">All</option>
              {options?.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </label>
        ))}
        <label>
          Sort
          <select value={sortKey} onChange={(e) => {
            const [sort, dir] = e.target.value.split('-')
            set({ sort, dir })
          }}>
            {Object.entries(SORTS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        {filtered && <button type="button" className="link" onClick={() => setParams({})}>Clear filters</button>}
      </div>

      {error && <p className="error" role="alert">{error}</p>}
      {items === null ? (
        <p>Loading…</p>
      ) : items.length === 0 ? (
        <p>No items match. Try clearing a filter.</p>
      ) : (
        <ul className="grid">
          {items.map((item) => (
            <li key={item.id} className="card">
              <Link to={`/items/${item.id}`}>
                <img src={item.imageUrl ?? ''} alt={`${item.name} cover`} loading="lazy" />
                <strong>{item.name}</strong>
              </Link>
              <span className="muted">{item.category} · {item.model}</span>
              <span>{money(item.priceCents)}</span>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
