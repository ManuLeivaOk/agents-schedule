#!/usr/bin/env node
/**
 * Sincroniza los archivos AGENTS.md versionados en .agents/subprojects/
 * hacia las carpetas de los 3 subproyectos (be-schedule, ft-schedule, app-schedule)
 * si están presentes en el workspace.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.resolve(__dirname, '../..')

const MAPPINGS = [
  {
    src: path.join(__dirname, 'be-schedule.AGENTS.md'),
    dest: path.join(ROOT, 'be-schedule', 'AGENTS.md'),
  },
  {
    src: path.join(__dirname, 'ft-schedule.AGENTS.md'),
    dest: path.join(ROOT, 'ft-schedule', 'AGENTS.md'),
  },
  {
    src: path.join(__dirname, 'app-schedule.AGENTS.md'),
    dest: path.join(ROOT, 'app-schedule', 'AGENTS.md'),
  },
]

for (const { src, dest } of MAPPINGS) {
  const destDir = path.dirname(dest)
  if (fs.existsSync(src) && fs.existsSync(destDir)) {
    fs.copyFileSync(src, dest)
    console.log(`[SYNCED] ${path.relative(ROOT, dest)}`)
  }
}
