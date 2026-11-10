#!/usr/bin/env node
/**
 * Script de verificación transversal del ecosistema Clicke Impulso.
 * Ejecuta chequeo de tipos TypeScript (`tsc --noEmit`) en los 3 repositorios
 * (`be-schedule`, `ft-schedule`, `app-schedule`) y reporta el estado consolidado.
 *
 * Uso:
 *   node --no-warnings .agents/skills/clicke-engram/scripts/verify-ecosystem.mjs
 *   node --no-warnings .agents/skills/clicke-engram/scripts/verify-ecosystem.mjs --only=mobile
 */

import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.resolve(__dirname, '../../../..')

const TARGETS = [
  {
    id: 'backend',
    name: 'Backend API (be-schedule)',
    cwd: path.join(ROOT, 'be-schedule'),
    cmd: './node_modules/.bin/tsc',
    args: ['--noEmit'],
  },
  {
    id: 'web',
    name: 'Web App (ft-schedule)',
    cwd: path.join(ROOT, 'ft-schedule'),
    cmd: './node_modules/.bin/tsc',
    args: ['--noEmit'],
  },
  {
    id: 'mobile',
    name: 'Mobile App (app-schedule)',
    cwd: path.join(ROOT, 'app-schedule'),
    cmd: './node_modules/.bin/tsc',
    args: ['--noEmit'],
  },
]

const onlyArg = process.argv.find((a) => a.startsWith('--only='))?.split('=')[1]
const selected = onlyArg ? TARGETS.filter((t) => t.id === onlyArg) : TARGETS

let hasFailure = false
const summary = []

for (const target of selected) {
  const start = Date.now()
  const res = spawnSync(target.cmd, target.args, {
    cwd: target.cwd,
    encoding: 'utf8',
    env: {
      ...process.env,
      PATH: `${path.dirname(process.execPath)}:/usr/local/bin:/opt/homebrew/bin:${process.env.PATH || ''}`,
    },
  })
  const elapsedMs = Date.now() - start
  const ok = res.status === 0
  if (!ok) hasFailure = true

  summary.push({
    id: target.id,
    name: target.name,
    ok,
    elapsedMs,
    output: (res.stdout || '') + (res.stderr || ''),
  })
}

for (const item of summary) {
  const icon = item.ok ? 'PASS' : 'FAIL'
  console.log(`[${icon}] ${item.name} (${item.elapsedMs}ms)`)
  if (!item.ok && item.output.trim()) {
    console.log(item.output.trim())
  }
}

process.exit(hasFailure ? 1 : 0)
