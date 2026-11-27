#!/usr/bin/env node
// Local demo data for PULSE: one demo account (age band "ab 16", complete answers) with check-ins,
// actions, feedback, own workouts and weight entries, so every area looks filled when trying the app.
//
// LOCAL ONLY. Refuses any API URL that is not the local Supabase stack, and never touches migrations
// (migrations go to production at /deploy; this data must not). Re-runnable: the demo account is
// deleted and created again on every run. Keys come from `npx supabase status` and are never printed.
//
// Usage: npm run seed:demo   (local Supabase must be running: `npx supabase start`)
import { execFileSync } from 'node:child_process'
import { createClient } from '@supabase/supabase-js'

const DEMO_EMAIL = 'demo@pulse.test'
const DEMO_PASSWORD = 'PulseDemo-2026'

function localEnv() {
  const out = execFileSync('npx', ['supabase', 'status', '-o', 'env'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
  const env = Object.fromEntries(
    out
      .split('\n')
      .map((line) => line.match(/^([A-Z_]+)="?(.*?)"?$/))
      .filter(Boolean)
      .map((match) => [match[1], match[2]])
  )
  if (!/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(env.API_URL ?? '')) {
    throw new Error('Refusing to seed: the API URL is not the local Supabase stack.')
  }
  if (!env.SERVICE_ROLE_KEY) throw new Error('Local Supabase is not running (no service role key). Run `npx supabase start`.')
  return env
}

function dbContainer() {
  const names = execFileSync('docker', ['ps', '--format', '{{.Names}}'], { encoding: 'utf8' }).split('\n')
  const name = names.find((entry) => entry.startsWith('supabase_db'))
  if (!name) throw new Error('Local Supabase database container not found.')
  return name
}

function sql(container, statement) {
  execFileSync('docker', ['exec', container, 'psql', '-U', 'postgres', '-v', 'ON_ERROR_STOP=1', '-qtAc', statement], { stdio: 'ignore' })
}

/** An instant on a past day (0 = today) at a given UTC hour. */
function at(dayOffset, hourUtc, minute = 0) {
  const date = new Date()
  date.setUTCHours(hourUtc, minute, 0, 0)
  date.setUTCDate(date.getUTCDate() + dayOffset)
  return date
}

function isoDay(dayOffset) {
  return at(dayOffset, 12).toISOString().slice(0, 10)
}

function must(result, what) {
  if (result.error) throw new Error(`${what} failed (${result.error.code ?? result.error.message}).`)
  return result.data
}

const env = localEnv()
const container = dbContainer()
const admin = createClient(env.API_URL, env.SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } })

// 1. Fresh demo account (deleting it removes all its data through the cascades).
const existing = must(await admin.auth.admin.listUsers({ perPage: 1000 }), 'Listing users')
for (const user of existing.users.filter((entry) => entry.email === DEMO_EMAIL)) {
  must(await admin.auth.admin.deleteUser(user.id), 'Deleting the old demo account')
}
const created = must(
  await admin.auth.admin.createUser({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { age_band: '16_plus' },
  }),
  'Creating the demo account'
)
const userId = created.user.id

// The week view only goes back to the account's start, so the account "exists" for a while already.
sql(container, `update auth.users set created_at = now() - interval '130 days' where id = '${userId}'`)
sql(container, `update public.profiles set created_at = now() - interval '130 days' where user_id = '${userId}'`)

// 2. Complete answers (PROJ-3); "Gewicht" visible (PROJ-11).
must(
  await admin
    .from('profiles')
    .update({
      goal: 'fitness',
      experience: 'occasional',
      places: ['home', 'outdoors'],
      home_equipment: ['mat', 'dumbbells'],
      diet: 'vegetarian',
      show_weight_in_nav: true,
    })
    .eq('user_id', userId),
  'Saving the answers'
)

// 3. Content to choose from — only what is offered, so every reference is valid.
const workouts = must(await admin.from('workouts').select('id, duration_minutes, places').eq('is_offered', true).order('sort_order'), 'Reading workouts')
const meals = must(await admin.from('meals').select('id, diet, effort').eq('is_offered', true).order('sort_order'), 'Reading meals')

function suggestWorkouts(chosen, minutes, place) {
  const others = workouts.filter((w) => w.id !== chosen && w.duration_minutes === minutes && w.places.includes(place)).map((w) => w.id)
  return [chosen, ...others].slice(0, 3)
}

function suggestMeals(chosen, effort) {
  const others = meals.filter((m) => m.id !== chosen && m.effort === effort && m.diet !== 'meat_fish').map((m) => m.id)
  return [chosen, ...others].slice(0, 3)
}

// 4. Daily decisions of the last three weeks (PROJ-6), feedback on some (PROJ-7) → Heute and Wochenblick (PROJ-8).
const days = [
  { day: -20, kind: 'move', minutes: 10, energy: 'low', place: 'home', target: 'sanft_bewegen_10', status: 'done', felt: 'just_right' },
  { day: -19, kind: 'eat', effort: 'quick', target: 'ruehrei_brot', status: 'done' },
  { day: -17, kind: 'move', minutes: 15, energy: 'medium', place: 'outdoors', target: 'eine_runde_gehen_15', status: 'done', felt: 'just_right', again: 'yes' },
  { day: -16, kind: 'eat', effort: 'no_cook', target: 'haferflocken_obst', status: 'done' },
  { day: -14, kind: 'move', minutes: 5, energy: 'low', place: 'home', target: 'morgen_mobil_5', status: 'skipped' },
  { day: -13, kind: 'move', minutes: 10, energy: 'medium', place: 'home', target: 'ganzkoerper_10', status: 'done', felt: 'too_much' },
  { day: -12, kind: 'eat', effort: 'up_to_20', target: 'rote_linsen_suppe', status: 'done', again: 'yes' },
  { day: -10, kind: 'move', minutes: 15, energy: 'high', place: 'home', target: 'kraft_hanteln_15', status: 'done', felt: 'just_right' },
  { day: -9, kind: 'eat', effort: 'quick', target: 'couscous_erbsen', status: 'done' },
  { day: -7, kind: 'move', minutes: 5, energy: 'medium', place: 'home', target: 'kurz_lockern_5', status: 'done' },
  { day: -6, kind: 'eat', effort: 'no_cook', target: 'joghurt_apfel_nuesse', status: 'done', again: 'no' },
  { day: -5, kind: 'move', minutes: 10, energy: 'medium', place: 'outdoors', target: 'kraft_band_10', status: 'done', felt: 'just_right' },
  { day: -4, kind: 'eat', effort: 'up_to_20', target: 'kartoffeln_quark', status: 'skipped' },
  { day: -3, kind: 'move', minutes: 10, energy: 'low', place: 'home', target: 'ruhig_matte_10', status: 'started' },
  { day: -2, kind: 'eat', effort: 'quick', target: 'tofu_gemuese_pfanne', status: 'done' },
  { day: -1, kind: 'move', minutes: 15, energy: 'medium', place: 'outdoors', target: 'eine_runde_gehen_15', status: 'done', felt: 'just_right' },
  { day: 0, kind: 'move', minutes: 10, energy: 'medium', place: 'home', target: 'ganzkoerper_10', status: 'started' },
]

for (const entry of days) {
  const hour = entry.kind === 'move' ? 7 : 11
  const checkIn = must(
    await admin
      .from('check_ins')
      .insert({
        user_id: userId,
        kind: entry.kind,
        minutes: entry.kind === 'move' ? entry.minutes : null,
        energy: entry.kind === 'move' ? entry.energy : null,
        place: entry.kind === 'move' ? entry.place : null,
        effort: entry.kind === 'eat' ? entry.effort : null,
        suggested_ids:
          entry.kind === 'move' ? suggestWorkouts(entry.target, entry.minutes, entry.place) : suggestMeals(entry.target, entry.effort),
        created_at: at(entry.day, hour).toISOString(),
      })
      .select('id')
      .single(),
    `Check-in day ${entry.day}`
  )
  const action = must(
    await admin
      .from('actions')
      .insert({
        user_id: userId,
        check_in_id: checkIn.id,
        kind: entry.kind,
        workout_id: entry.kind === 'move' ? entry.target : null,
        meal_id: entry.kind === 'eat' ? entry.target : null,
        status: entry.status,
        started_at: at(entry.day, hour, 2).toISOString(),
        concluded_at: entry.status === 'started' ? null : at(entry.day, hour, 25).toISOString(),
      })
      .select('id')
      .single(),
    `Action day ${entry.day}`
  )
  if (entry.status === 'done' && (entry.felt || entry.again)) {
    must(
      await admin.from('action_feedback').insert({
        action_id: action.id,
        user_id: userId,
        effort: entry.felt ?? null,
        suggest_again: entry.again ?? null,
      }),
      `Feedback day ${entry.day}`
    )
  }
}

// 5. Own workouts (PROJ-10).
must(
  await admin.from('custom_workouts').insert([
    {
      id: crypto.randomUUID(),
      user_id: userId,
      name: 'Morgenrunde',
      steps: [
        { exercise_id: 'armkreisen', mode: 'time', amount: 30 },
        { exercise_id: 'arm_bein_strecken', mode: 'reps', amount: 10 },
        { exercise_id: 'kurze_pause', mode: 'time', amount: 30 },
        { exercise_id: 'beckenheben', mode: 'reps', amount: 12 },
      ],
    },
    {
      id: crypto.randomUUID(),
      user_id: userId,
      name: 'Kurz & kräftig',
      steps: [
        { exercise_id: 'ausfallschritt', mode: 'reps', amount: 10 },
        { exercise_id: 'bergsteiger', mode: 'time', amount: 30 },
        { exercise_id: 'kurze_pause', mode: 'time', amount: 20 },
        { exercise_id: 'band_rudern', mode: 'reps', amount: 12 },
        { exercise_id: 'beckenheben', mode: 'reps', amount: 15 },
      ],
    },
  ]),
  'Own workouts'
)

// 6. Weight entries (PROJ-11): about every four days over four months, gently varying.
const weights = []
for (let day = -120; day <= -1; day += 4) {
  const trend = 75.2 - ((day + 120) / 120) * 1.6
  const wobble = Math.sin(day / 5) * 0.3
  weights.push({ user_id: userId, entry_date: isoDay(day), weight_kg: Math.round((trend + wobble) * 10) / 10 })
}
weights.push({ user_id: userId, entry_date: isoDay(0), weight_kg: 73.4 })
must(await admin.from('weight_entries').insert(weights), 'Weight entries')

console.log('Demo-Daten angelegt.')
console.log(`  Anmelden mit: ${DEMO_EMAIL}`)
console.log(`  Passwort:     ${DEMO_PASSWORD}`)
console.log(`  ${days.length} Check-ins mit Aktionen, 2 eigene Workouts, ${weights.length} Gewichtseinträge.`)
