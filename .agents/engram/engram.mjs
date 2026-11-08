#!/usr/bin/env node
/**
 * Clicke Engram — Persistent Agentic Memory Engine (SQLite + FTS5)
 * Works both as:
 *   1. MCP Server over stdio: `node .agents/engram/engram.mjs mcp`
 *   2. Direct CLI tool:       `node .agents/engram/engram.mjs <context|search|save|delete|stats>`
 *
 * Uses Node.js 22+ built-in `node:sqlite` (zero external npm dependencies).
 */

import { DatabaseSync } from 'node:sqlite'
import fs from 'node:fs'
import path from 'node:path'
import readline from 'node:readline'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DB_PATH = path.join(__dirname, 'engram.db')
const SEED_PATH = path.join(__dirname, 'seed-memories.json')

const VALID_SCOPES = ['global', 'contracts', 'backend', 'web', 'mobile']
const VALID_TYPES = ['architecture', 'contract', 'decision', 'bugfix', 'progress', 'pattern']

function initDb() {
  const db = new DatabaseSync(DB_PATH)

  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;

    CREATE TABLE IF NOT EXISTS memories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      topic_key TEXT NOT NULL UNIQUE,
      scope TEXT NOT NULL DEFAULT 'global',
      type TEXT NOT NULL DEFAULT 'decision',
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      files_json TEXT NOT NULL DEFAULT '[]',
      revision INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL
    );

    CREATE VIRTUAL TABLE IF NOT EXISTS memories_fts USING fts5(
      topic_key,
      scope,
      type,
      title,
      content,
      files_json,
      content='memories',
      content_rowid='id'
    );

    CREATE TRIGGER IF NOT EXISTS memories_ai AFTER INSERT ON memories BEGIN
      INSERT INTO memories_fts(rowid, topic_key, scope, type, title, content, files_json)
      VALUES (new.id, new.topic_key, new.scope, new.type, new.title, new.content, new.files_json);
    END;

    CREATE TRIGGER IF NOT EXISTS memories_ad AFTER DELETE ON memories BEGIN
      INSERT INTO memories_fts(memories_fts, rowid, topic_key, scope, type, title, content, files_json)
      VALUES ('delete', old.id, old.topic_key, old.scope, old.type, old.title, old.content, old.files_json);
    END;

    CREATE TRIGGER IF NOT EXISTS memories_au AFTER UPDATE ON memories BEGIN
      INSERT INTO memories_fts(memories_fts, rowid, topic_key, scope, type, title, content, files_json)
      VALUES ('delete', old.id, old.topic_key, old.scope, old.type, old.title, old.content, old.files_json);
      INSERT INTO memories_fts(rowid, topic_key, scope, type, title, content, files_json)
      VALUES (new.id, new.topic_key, new.scope, new.type, new.title, new.content, new.files_json);
    END;
  `)

  const countRow = db.prepare('SELECT COUNT(*) AS count FROM memories').get()
  if (countRow && countRow.count === 0 && fs.existsSync(SEED_PATH)) {
    try {
      const seeds = JSON.parse(fs.readFileSync(SEED_PATH, 'utf8'))
      const insert = db.prepare(`
        INSERT OR IGNORE INTO memories (topic_key, scope, type, title, content, files_json, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      for (const item of seeds) {
        insert.run(
          item.topic_key,
          item.scope || 'global',
          item.type || 'decision',
          item.title,
          item.content,
          JSON.stringify(Array.isArray(item.files) ? item.files : []),
          item.updated_at || new Date().toISOString(),
        )
      }
    } catch {
      // Ignore seed parse errors on bootstrap
    }
  }

  return db
}

function exportSeedsSnapshot(db) {
  try {
    const rows = db
      .prepare(
        'SELECT topic_key, scope, type, title, content, files_json, revision, updated_at FROM memories ORDER BY id ASC',
      )
      .all()
    const formatted = rows.map((r) => ({
      topic_key: r.topic_key,
      scope: r.scope,
      type: r.type,
      title: r.title,
      content: r.content,
      files: JSON.parse(r.files_json || '[]'),
      revision: r.revision,
      updated_at: r.updated_at,
    }))
    fs.writeFileSync(SEED_PATH, JSON.stringify(formatted, null, 2) + '\n', 'utf8')
  } catch {
    // Non-fatal if snapshot write fails
  }
}

function formatRow(row) {
  return {
    topic_key: row.topic_key,
    scope: row.scope,
    type: row.type,
    title: row.title,
    content: row.content,
    files: JSON.parse(row.files_json || '[]'),
    revision: row.revision,
    updated_at: row.updated_at,
  }
}

function getContext(db, { scope, type, limit = 25 } = {}) {
  const clauses = []
  const params = []
  if (scope) {
    clauses.push('(scope = ? OR scope = \'global\' OR scope = \'contracts\')')
    params.push(scope)
  }
  if (type) {
    clauses.push('type = ?')
    params.push(type)
  }
  const whereSql = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : ''
  const rows = db
    .prepare(
      `SELECT topic_key, scope, type, title, content, files_json, revision, updated_at
       FROM memories
       ${whereSql}
       ORDER BY CASE scope
         WHEN 'contracts' THEN 1
         WHEN 'global' THEN 2
         ELSE 3
       END, updated_at DESC
       LIMIT ?`,
    )
    .all(...params, Number(limit) || 25)

  return rows.map(formatRow)
}

function searchMemories(db, { query, scope, type, limit = 10 } = {}) {
  if (!query || !String(query).trim()) {
    return getContext(db, { scope, type, limit })
  }

  const sanitizedTokens = String(query)
    .trim()
    .replace(/[^\p{L}\p{N}_/-]+/gu, ' ')
    .split(/\s+/)
    .filter(Boolean)

  let rows = []
  if (sanitizedTokens.length > 0) {
    const ftsQuery = sanitizedTokens.map((t) => `"${t}"*`).join(' OR ')
    const clauses = ['memories_fts MATCH ?']
    const params = [ftsQuery]

    if (scope) {
      clauses.push('m.scope = ?')
      params.push(scope)
    }
    if (type) {
      clauses.push('m.type = ?')
      params.push(type)
    }

    try {
      rows = db
        .prepare(
          `SELECT m.topic_key, m.scope, m.type, m.title, m.content, m.files_json, m.revision, m.updated_at
           FROM memories_fts f
           JOIN memories m ON m.id = f.rowid
           WHERE ${clauses.join(' AND ')}
           ORDER BY bm25(memories_fts)
           LIMIT ?`,
        )
        .all(...params, Number(limit) || 10)
    } catch {
      rows = []
    }
  }

  if (rows.length === 0) {
    const likePattern = `%${String(query).trim()}%`
    const clauses = ['(topic_key LIKE ? OR title LIKE ? OR content LIKE ? OR files_json LIKE ?)']
    const params = [likePattern, likePattern, likePattern, likePattern]
    if (scope) {
      clauses.push('scope = ?')
      params.push(scope)
    }
    if (type) {
      clauses.push('type = ?')
      params.push(type)
    }
    rows = db
      .prepare(
        `SELECT topic_key, scope, type, title, content, files_json, revision, updated_at
         FROM memories
         WHERE ${clauses.join(' AND ')}
         ORDER BY updated_at DESC
         LIMIT ?`,
      )
      .all(...params, Number(limit) || 10)
  }

  return rows.map(formatRow)
}

function saveMemory(db, { topic_key, scope = 'global', type = 'decision', title, content, files = [] }) {
  if (!topic_key || !title || !content) {
    throw new Error('topic_key, title, and content are required to save an Engram.')
  }
  const normalizedScope = VALID_SCOPES.includes(scope) ? scope : 'global'
  const normalizedType = VALID_TYPES.includes(type) ? type : 'decision'
  const filesArray = Array.isArray(files)
    ? files
    : typeof files === 'string' && files.trim()
      ? files.split(',').map((s) => s.trim())
      : []
  const now = new Date().toISOString()

  const existing = db
    .prepare('SELECT id, revision FROM memories WHERE topic_key = ?')
    .get(topic_key)

  if (existing) {
    db.prepare(
      `UPDATE memories
       SET scope = ?, type = ?, title = ?, content = ?, files_json = ?, revision = revision + 1, updated_at = ?
       WHERE topic_key = ?`,
    ).run(normalizedScope, normalizedType, title, content, JSON.stringify(filesArray), now, topic_key)
  } else {
    db.prepare(
      `INSERT INTO memories (topic_key, scope, type, title, content, files_json, revision, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 1, ?)`,
    ).run(topic_key, normalizedScope, normalizedType, title, content, JSON.stringify(filesArray), now)
  }

  exportSeedsSnapshot(db)
  const saved = db
    .prepare(
      'SELECT topic_key, scope, type, title, content, files_json, revision, updated_at FROM memories WHERE topic_key = ?',
    )
    .get(topic_key)
  return formatRow(saved)
}

function deleteMemory(db, { topic_key }) {
  if (!topic_key) {
    throw new Error('topic_key is required.')
  }
  const info = db.prepare('DELETE FROM memories WHERE topic_key = ?').run(topic_key)
  exportSeedsSnapshot(db)
  return { deleted: info.changes > 0, topic_key }
}

// ============================================================================
// MCP Server (Stdio JSON-RPC 2.0)
// ============================================================================

const MCP_TOOLS = [
  {
    name: 'engram_context',
    description:
      'Retrieve active architectural context, cross-app contracts (Backend NestJS ↔ Web Next.js ↔ Mobile Expo), and recent decisions from the Clicke Engram memory store. Call this at the start of tasks.',
    inputSchema: {
      type: 'object',
      properties: {
        scope: {
          type: 'string',
          enum: VALID_SCOPES,
          description:
            'Optional filter by scope (includes global and contracts automatically). Values: global, contracts, backend, web, mobile.',
        },
        type: {
          type: 'string',
          enum: VALID_TYPES,
          description: 'Optional filter by memory type.',
        },
        limit: {
          type: 'number',
          description: 'Max entries to return (default 25).',
        },
      },
    },
  },
  {
    name: 'engram_search',
    description:
      'Full-text search (SQLite FTS5) across Clicke Engram memories by keyword, endpoint, component, DTO, or topic.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query (e.g. "appointments", "refreshToken", "timezone", "OrgRolesGuard").',
        },
        scope: {
          type: 'string',
          enum: VALID_SCOPES,
          description: 'Optional filter by scope: global, contracts, backend, web, mobile.',
        },
        type: {
          type: 'string',
          enum: VALID_TYPES,
          description: 'Optional filter by type: architecture, contract, decision, bugfix, progress, pattern.',
        },
        limit: {
          type: 'number',
          description: 'Max results to return (default 10).',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'engram_save',
    description:
      'Save or update (upsert by topic_key) a persistent memory in Clicke Engram. Use after modifying API contracts, fixing cross-app bugs, completing mobile stages, or making architectural decisions.',
    inputSchema: {
      type: 'object',
      properties: {
        topic_key: {
          type: 'string',
          description:
            'Unique hierarchical slug (e.g. "contract/appointments-dto", "bugfix/mobile-refresh-race", "progress/mobile-stages-status"). Reusing an existing topic_key updates it in-place.',
        },
        scope: {
          type: 'string',
          enum: VALID_SCOPES,
          description: 'Target scope: global, contracts, backend, web, or mobile.',
        },
        type: {
          type: 'string',
          enum: VALID_TYPES,
          description: 'Memory category: architecture, contract, decision, bugfix, progress, or pattern.',
        },
        title: {
          type: 'string',
          description: 'Concise, descriptive title of the memory.',
        },
        content: {
          type: 'string',
          description: 'Detailed explanation including invariants, endpoints, or behavior.',
        },
        files: {
          type: 'array',
          items: { type: 'string' },
          description: 'Relative paths from workspace root related to this memory.',
        },
      },
      required: ['topic_key', 'scope', 'type', 'title', 'content'],
    },
  },
  {
    name: 'engram_delete',
    description: 'Delete an obsolete memory entry from Clicke Engram by its topic_key.',
    inputSchema: {
      type: 'object',
      properties: {
        topic_key: {
          type: 'string',
          description: 'The topic_key to delete.',
        },
      },
      required: ['topic_key'],
    },
  },
]

function startMcpServer(db) {
  const rl = readline.createInterface({
    input: process.stdin,
    terminal: false,
  })

  function send(msg) {
    process.stdout.write(JSON.stringify(msg) + '\n')
  }

  rl.on('line', (line) => {
    const trimmed = line.trim()
    if (!trimmed) return
    let req
    try {
      req = JSON.parse(trimmed)
    } catch {
      return
    }

    const { id, method, params } = req
    if (id === undefined || id === null) {
      // Notification (e.g. notifications/initialized)
      return
    }

    try {
      if (method === 'initialize') {
        send({
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: {
              tools: {},
            },
            serverInfo: {
              name: 'clicke-engram',
              version: '1.0.0',
            },
          },
        })
        return
      }

      if (method === 'ping') {
        send({ jsonrpc: '2.0', id, result: {} })
        return
      }

      if (method === 'tools/list') {
        send({
          jsonrpc: '2.0',
          id,
          result: {
            tools: MCP_TOOLS,
          },
        })
        return
      }

      if (method === 'tools/call') {
        const toolName = params?.name
        const args = params?.arguments || {}
        let output

        if (toolName === 'engram_context') {
          output = getContext(db, args)
        } else if (toolName === 'engram_search') {
          output = searchMemories(db, args)
        } else if (toolName === 'engram_save') {
          output = saveMemory(db, args)
        } else if (toolName === 'engram_delete') {
          output = deleteMemory(db, args)
        } else {
          throw new Error(`Unknown tool: ${toolName}`)
        }

        send({
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify(output, null, 2),
              },
            ],
          },
        })
        return
      }

      send({
        jsonrpc: '2.0',
        id,
        error: {
          code: -32601,
          message: `Method not found: ${method}`,
        },
      })
    } catch (err) {
      send({
        jsonrpc: '2.0',
        id,
        result: {
          isError: true,
          content: [
            {
              type: 'text',
              text: err instanceof Error ? err.message : String(err),
            },
          ],
        },
      })
    }
  })
}

// ============================================================================
// CLI Interface
// ============================================================================

function parseFlags(args) {
  const flags = {}
  const positional = []
  for (const arg of args) {
    if (arg.startsWith('--')) {
      const eqIdx = arg.indexOf('=')
      if (eqIdx !== -1) {
        flags[arg.slice(2, eqIdx)] = arg.slice(eqIdx + 1)
      } else {
        flags[arg.slice(2)] = true
      }
    } else {
      positional.push(arg)
    }
  }
  return { flags, positional }
}

function runCli() {
  const db = initDb()
  const rawArgs = process.argv.slice(2)
  const command = rawArgs[0] || 'context'

  if (command === 'mcp' || command === '--mcp') {
    startMcpServer(db)
    return
  }

  const { flags, positional } = parseFlags(rawArgs.slice(1))

  if (command === 'context') {
    const scope = flags.scope || positional[0]
    const results = getContext(db, { scope, type: flags.type, limit: flags.limit })
    console.log(JSON.stringify(results, null, 2))
    return
  }

  if (command === 'search') {
    const query = flags.query || positional.join(' ')
    const results = searchMemories(db, {
      query,
      scope: flags.scope,
      type: flags.type,
      limit: flags.limit,
    })
    console.log(JSON.stringify(results, null, 2))
    return
  }

  if (command === 'save') {
    const saved = saveMemory(db, {
      topic_key: flags.key || flags.topic_key,
      scope: flags.scope || 'global',
      type: flags.type || 'decision',
      title: flags.title,
      content: flags.content,
      files: flags.files,
    })
    console.log(JSON.stringify(saved, null, 2))
    return
  }

  if (command === 'delete') {
    const key = flags.key || flags.topic_key || positional[0]
    const res = deleteMemory(db, { topic_key: key })
    console.log(JSON.stringify(res, null, 2))
    return
  }

  if (command === 'stats') {
    const byScope = db
      .prepare('SELECT scope, COUNT(*) AS count FROM memories GROUP BY scope ORDER BY count DESC')
      .all()
    const byType = db
      .prepare('SELECT type, COUNT(*) AS count FROM memories GROUP BY type ORDER BY count DESC')
      .all()
    console.log(JSON.stringify({ total: byScope.reduce((a, b) => a + b.count, 0), byScope, byType }, null, 2))
    return
  }

  console.error(
    'Usage: node .agents/engram/engram.mjs <context|search|save|delete|stats|mcp> [--scope=...] [--type=...]',
  )
  process.exit(1)
}

runCli()

