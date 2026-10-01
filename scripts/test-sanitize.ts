// Unit tests for lib/sanitize/invisibleChars.ts.
// Run with: node --test scripts/test-sanitize.ts   (Node 23.6+ strips types natively)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { sanitizeText, sanitizeDeep, createStreamSanitizer } from '../lib/sanitize/invisibleChars.ts'

const ZWSP = '​'
const ZWNJ = '‌'
const ZWJ = '‍'
const NBSP = ' '

test('removes zero-width characters between Latin text', () => {
  const { text, report } = sanitizeText(`Sen${ZWSP}ior Eng⁠ineer﻿${ZWJ}x`)
  assert.equal(text, 'Senior Engineerx')
  assert.equal(report.zeroWidth, 4)
})

test('normalizes exotic spaces to a plain space without collapsing runs', () => {
  const { text, report } = sanitizeText(`a${NBSP}b c d　e  f\n\tg`)
  assert.equal(text, 'a b c d e  f\n\tg')
  assert.equal(report.exoticSpaces, 4)
})

test('removes bidi controls', () => {
  const { text, report } = sanitizeText('‮abc‬ ‎def‏ ⁦ghi⁩')
  assert.equal(text, 'abc def ghi')
  assert.equal(report.bidi, 6)
})

test('removes stray tag characters but keeps a valid emoji tag sequence', () => {
  const hidden = 'Hi\u{E0049}\u{E0067}\u{E006E}there'
  assert.equal(sanitizeText(hidden).text, 'Hithere')
  assert.equal(sanitizeText(hidden).report.tagChars, 3)
  const england = '\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}'
  assert.equal(sanitizeText(`Go ${england}!`).text, `Go ${england}!`)
})

test('removes soft hyphens, fillers and noncharacters', () => {
  const { text, report } = sanitizeText('ma­nagerㅤﾠ᠏﷐￿\u{1FFFE}')
  assert.equal(text, 'manager')
  assert.equal(report.softHyphen, 1)
  assert.equal(report.reservedIgnorable, 3)
  assert.equal(report.noncharacters, 3)
})

test('preserves ZWJ inside emoji sequences and VS16 after emoji', () => {
  const family = `\u{1F468}${ZWJ}\u{1F469}${ZWJ}\u{1F467}`
  const heartOnFire = `❤️${ZWJ}\u{1F525}`
  const input = `Team ${family} and ${heartOnFire} ❤️`
  assert.equal(sanitizeText(input).text, input)
})

test('preserves ZWNJ / ZWJ next to Korean text', () => {
  const input = `조${ZWNJ}성인 김${ZWJ}a`
  assert.equal(sanitizeText(input).text, input)
})

test('strips ZWNJ only when both neighbours are Latin', () => {
  assert.equal(sanitizeText(`ab${ZWNJ}cd`).text, 'abcd')
  assert.equal(sanitizeText(`ab ${ZWNJ}${ZWNJ} cd`).text, 'ab  cd')
})

test('is idempotent', () => {
  const samples = [
    `x${ZWSP}${ZWJ}${ZWSP}y`,
    `조${ZWSP}${ZWNJ}${ZWSP}a`,
    `a${NBSP}${ZWJ}${NBSP}b`,
    `\u{1F468}${ZWSP}${ZWJ}\u{1F469}`,
    '\u{1F3F4}\u{E0067}\u{E007F}\u{E0067}',
  ]
  for (const s of samples) {
    const once = sanitizeText(s).text
    assert.equal(sanitizeText(once).text, once, JSON.stringify(s))
  }
})

test('never alters visible text', () => {
  const visible = 'Jane Doe — Sr. Engineer @ Acme (2019–2024) • 조성인 · Ñandú café 東京 ½ “quotes” 🚀 👩🏽‍💻'
  assert.equal(sanitizeText(visible).text, visible)
  assert.equal(sanitizeText('').text, '')
})

test('sanitizeDeep walks nested structures and aggregates the report', () => {
  const input = {
    name: `Jane${ZWSP} Doe`,
    years: 5,
    bullets: [`Led${NBSP}team`, { nested: `x‮y` }],
    when: null,
  }
  const { value, report } = sanitizeDeep(input)
  assert.deepEqual(value, { name: 'Jane Doe', years: 5, bullets: ['Led team', { nested: 'xy' }], when: null })
  assert.equal(report.zeroWidth, 1)
  assert.equal(report.exoticSpaces, 1)
  assert.equal(report.bidi, 1)
  assert.equal(input.name, `Jane${ZWSP} Doe`, 'input is not mutated')
})

test('stream sanitizer matches the one-shot result for every split point', () => {
  const input = `Hi${ZWSP} a${ZWJ}b 조${ZWNJ}성 \u{1F468}${ZWJ}\u{1F469} \u{1F3F4}\u{E0067}\u{E0062}\u{E007F}${NBSP}end${ZWJ}`
  const expected = sanitizeText(input).text
  const units = input.split('') // UTF-16 units, so splits can land mid-surrogate
  for (let i = 0; i <= units.length; i++) {
    for (let j = i; j <= units.length; j++) {
      const s = createStreamSanitizer()
      const out =
        s.push(units.slice(0, i).join('')) +
        s.push(units.slice(i, j).join('')) +
        s.push(units.slice(j).join('')) +
        s.flush()
      assert.equal(out, expected, `split at ${i},${j}`)
    }
  }
})
