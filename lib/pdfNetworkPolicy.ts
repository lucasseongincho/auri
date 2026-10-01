/**
 * Network policy for the /api/pdf Chromium page.
 *
 * The export HTML is fully self-contained: lib/pdf.ts inlines the resume fonts
 * as data: URIs and every stylesheet as <style>, and templates use no images.
 * So nothing needs the network and the host allowlist is empty. Every other
 * request is aborted, which closes the SSRF hole where submitted HTML could
 * make the server fetch arbitrary URLs (cloud metadata, internal services).
 *
 * If a host ever has to be added, private/loopback/link-local/metadata
 * targets stay blocked regardless. Matching is by hostname only and
 * Chromium resolves DNS itself, so only add hosts you control or fully trust.
 *
 * Free of `@/` imports so scripts/ tests can load it directly with Node.
 */

export const PDF_ALLOWED_HOSTS: readonly string[] = []

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'metadata.google.internal',
  'metadata',
  'instance-data',
])

function ipv4Parts(host: string): number[] | null {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host)
  if (!m) return null
  const parts = m.slice(1).map(Number)
  return parts.every((n) => n <= 255) ? parts : null
}

function isPrivateIPv4([a, b]: number[]): boolean {
  return (
    a === 0 ||                            // 0.0.0.0/8
    a === 10 ||                           // 10/8
    a === 127 ||                          // loopback
    (a === 100 && b >= 64 && b <= 127) || // CGNAT 100.64/10
    (a === 169 && b === 254) ||           // link-local + cloud metadata
    (a === 172 && b >= 16 && b <= 31) ||  // 172.16/12
    (a === 192 && b === 168) ||           // 192.168/16
    a >= 224                              // multicast / reserved
  )
}

function isPrivateIPv6(host: string): boolean {
  const h = host.toLowerCase()
  if (h === '::' || h === '::1') return true
  if (/^f[cd][0-9a-f]{2}:/.test(h)) return true // fc00::/7 unique local
  if (/^fe[89ab][0-9a-f]:/.test(h)) return true // fe80::/10 link-local
  if (h.startsWith('fd00:ec2::')) return true  // AWS IMDS over IPv6
  const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(h) // IPv4-mapped
  if (mapped) {
    const v4 = ipv4Parts(mapped[1])
    return v4 ? isPrivateIPv4(v4) : true
  }
  return false
}

export function isBlockedHost(hostname: string): boolean {
  const host = hostname.replace(/^\[|\]$/g, '').replace(/\.$/, '').toLowerCase()
  if (!host) return true
  if (BLOCKED_HOSTNAMES.has(host) || host.endsWith('.localhost') || host.endsWith('.internal')) return true
  const v4 = ipv4Parts(host)
  if (v4) return isPrivateIPv4(v4)
  if (host.includes(':')) return isPrivateIPv6(host)
  // Bare numeric / hex hosts (e.g. "2852039166", "0xa9fea9fe") are alternate
  // IPv4 spellings Chromium accepts — never legitimate here.
  if (/^(0x[0-9a-f]+|\d+)$/.test(host)) return true
  return false
}

export function isPdfRequestAllowed(rawUrl: string): boolean {
  if (rawUrl === 'about:blank' || rawUrl.startsWith('data:')) return true
  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    return false
  }
  if (url.protocol !== 'https:') return false
  if (isBlockedHost(url.hostname)) return false
  return PDF_ALLOWED_HOSTS.includes(url.hostname.toLowerCase())
}
