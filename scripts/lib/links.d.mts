export const HOST_PAUSE_MS: number
export const TIMEOUT_MS: number
export const USER_AGENT: string
export type Verdict = 'ok' | 'moved' | 'blocked' | 'broken'
export interface Link {
  url: string
  uses: string[]
}
export interface CheckResult {
  status?: number
  finalUrl?: string
  error?: string
  verdict: Verdict
}
type FetchLike = (url: string, init?: RequestInit) => Promise<Pick<Response, 'status' | 'url'> & { body?: unknown }>
export function collectLinks(data: { clubs: unknown[]; waters: unknown; salesPoints: unknown }): Link[]
export function classify(url: string, result: { status?: number; finalUrl?: string; error?: string }): Verdict
export function checkLink(url: string, options?: { fetch?: FetchLike; timeoutMs?: number }): Promise<CheckResult>
export function checkLinks(
  links: Link[],
  options?: {
    fetch?: FetchLike
    concurrency?: number
    pauseMs?: number
    timeoutMs?: number
    onResult?: (result: Link & CheckResult) => void
  },
): Promise<(Link & CheckResult)[]>
export function networkLooksDown(results: CheckResult[]): boolean
export function formatReport(results: (Link & CheckResult)[]): string
