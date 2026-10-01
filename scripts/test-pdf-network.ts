// Unit tests for lib/pdfNetworkPolicy.ts (the /api/pdf SSRF guard).
// Run with: node --test scripts/test-pdf-network.ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isPdfRequestAllowed, isBlockedHost } from '../lib/pdfNetworkPolicy.ts'

test('allows only data: and about:blank with the empty allowlist', () => {
  assert.equal(isPdfRequestAllowed('about:blank'), true)
  assert.equal(isPdfRequestAllowed('data:font/woff2;base64,AAAA'), true)
  assert.equal(isPdfRequestAllowed('https://example.com/x.png'), false)
  assert.equal(isPdfRequestAllowed('https://fonts.googleapis.com/css2?family=Inter'), false)
  assert.equal(isPdfRequestAllowed('https://www.auri-resume.com/fonts/Tinos-Regular.woff2'), false)
})

test('blocks non-https schemes', () => {
  for (const u of ['http://example.com/', 'file:///etc/passwd', 'ftp://x.com/', 'chrome://version', 'blob:https://x/1', 'javascript:alert(1)', 'not a url']) {
    assert.equal(isPdfRequestAllowed(u), false, u)
  }
})

test('blocks private, loopback, link-local and metadata targets', () => {
  const blocked = [
    '169.254.169.254', '127.0.0.1', '127.1.2.3', '10.0.0.5', '172.16.0.1', '172.31.255.255',
    '192.168.1.1', '100.64.0.1', '0.0.0.0', 'localhost', 'foo.localhost', 'metadata.google.internal',
    'service.internal', '[::1]', '::1', 'fe80::1', 'fd12:3456::1', 'fd00:ec2::254', '::ffff:169.254.169.254',
    '2852039166', '0xa9fea9fe', 'localhost.', '',
  ]
  for (const h of blocked) assert.equal(isBlockedHost(h), true, h)
  for (const h of ['example.com', '8.8.8.8', '172.32.0.1', '2606:4700::1111']) assert.equal(isBlockedHost(h), false, h)
})
