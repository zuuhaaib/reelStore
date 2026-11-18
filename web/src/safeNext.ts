import { useSearchParams } from 'react-router-dom'

/** Reads ?next= (e.g. /checkout) but only allows same-site paths, so a link can't bounce users off-site after login. */
export function useSafeNext(): string {
  const next = useSearchParams()[0].get('next') ?? '/'
  return next.startsWith('/') && !next.startsWith('//') ? next : '/'
}
