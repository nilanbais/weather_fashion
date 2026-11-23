/**
 * Tests voor de rekenlogica. Draaien met:  npm test
 * Gebruikt de ingebouwde test-runner van Node (geen extra pakketten nodig).
 * https://nodejs.org/api/test.html
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { bodyBuildOffset, personalOffset, windChill } from './thermalComfort.js'
import { getClothingAdvice } from './clothingRules.js'
import { summarizeManual } from './weatherSummary.js'

const baseProfile = {
  heightCm: 175,
  weightKg: 70,
  sex: 'man',
  sensitivity: 3,
  activity: 'wandelen',
  extraOffset: 0,
}

/** Maak snel een context met redelijke standaardwaarden. */
const ctx = (overrides) => ({
  temp: 10, warmest: 10, tempRange: 0, wind: 10, rainChance: 0, rainMm: 0,
  sunny: false, snow: false, activity: 'wandelen', ...overrides,
})

/** Het gekozen kledingstuk voor een slot. */
const itemFor = (advice, slotId) => advice.items.find((e) => e.slot.id === slotId).item

test('referentiepersoon heeft geen correctie', () => {
  assert.equal(personalOffset(baseProfile).total, 0)
})

test('klein/licht persoon krijgt het sneller koud dan groot/zwaar persoon', () => {
  assert.ok(bodyBuildOffset(160, 50) < 0)
  assert.ok(bodyBuildOffset(190, 100) > 0)
})

test('snel koud + vrouw geeft een negatieve correctie', () => {
  const { total } = personalOffset({ ...baseProfile, sex: 'vrouw', sensitivity: 1 })
  assert.ok(total < -5)
})

test('wind chill maakt het kouder bij wind, niet bij warm weer', () => {
  assert.ok(windChill(0, 30) < -5)
  assert.equal(windChill(20, 30), 20)
})

test('bij vorst: winterjas, muts, handschoenen en sjaal', () => {
  const advice = getClothingAdvice(ctx({ temp: -1 }))
  assert.match(itemFor(advice, 'jas'), /Winterjas/)
  assert.match(itemFor(advice, 'hoofd'), /Muts/)
  assert.ok(itemFor(advice, 'handen'))
  assert.ok(itemFor(advice, 'nek'))
})

test('bij 25 graden: geen jas, korte broek', () => {
  const advice = getClothingAdvice(ctx({ temp: 25, warmest: 25 }))
  assert.equal(itemFor(advice, 'jas'), null)
  assert.match(itemFor(advice, 'benen'), /Korte broek/)
})

test('regenkans geeft regenbescherming en een laagjes-tip bij groot verschil', () => {
  const advice = getClothingAdvice(ctx({ temp: 8, warmest: 16, tempRange: 8, rainChance: 70 }))
  assert.ok(itemFor(advice, 'regen'))
  assert.ok(advice.tips.some((t) => t.includes('laagjes')))
})

test('handmatige invoer berekent gevoelstemperatuur', () => {
  const c = summarizeManual({ temperature: 2, windSpeed: 30, rainChance: 0, sunny: false })
  assert.ok(c.feelsLike < 2)
})
