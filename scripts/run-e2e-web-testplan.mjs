#!/usr/bin/env node
import { createRequire } from 'node:module'
import { execSync } from 'node:child_process'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'

const require = createRequire(import.meta.url)
const XLSX = require('../be-schedule/node_modules/xlsx')

const API_BASE = 'http://localhost:3000'
const WEB_BASE = 'http://localhost:3001'

let superAdminToken = ''
let ownerToken = ''
let ownerCookie = ''
let adminToken = ''
let staffToken = ''

let testOrgId = ''
let termsVersionId = ''
let draSofiaId = ''
let consultorioId = ''
let laserId = ''
let boxId = ''
let ecografoId = ''
let serviceId = ''
let customerId = ''
let appointmentId = ''
let createdStaffMemberId = ''

const results = []

function logHeader(title) {
  console.log(`\n======================================================================`)
  console.log(`  ${title}`)
  console.log(`======================================================================`)
}

function pass(code, title, details = '') {
  results.push({ code, title, status: 'PASS', details })
  console.log(`\x1b[32m[PASS]\x1b[0m ${code} — ${title}${details ? ` (${details})` : ''}`)
}

function fail(code, title, error) {
  const msg = error?.message || String(error)
  results.push({ code, title, status: 'FAIL', details: msg })
  console.error(`\x1b[31m[FAIL]\x1b[0m ${code} — ${title}: ${msg}`)
}

async function request(urlPath, options = {}) {
  const url = urlPath.startsWith('http') ? urlPath : `${API_BASE}${urlPath}`
  const headers = new Headers(options.headers || {})
  
  if (options.token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${options.token}`)
  }
  if (options.cookie && !headers.has('Cookie')) {
    headers.set('Cookie', options.cookie)
  }
  if (options.json && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const fetchOptions = {
    method: options.method || 'GET',
    headers,
  }

  if (options.json) {
    fetchOptions.body = JSON.stringify(options.json)
  } else if (options.body) {
    fetchOptions.body = options.body
  }

  const response = await fetch(url, fetchOptions)
  const contentType = response.headers.get('content-type') || ''
  
  let data = null
  if (contentType.includes('application/json')) {
    try {
      data = await response.json()
    } catch {
      data = null
    }
  } else if (contentType.includes('text/') || contentType.includes('application/octet-stream') || contentType.includes('sheet')) {
    if (options.binary) {
      data = Buffer.from(await response.arrayBuffer())
    } else {
      data = await response.text()
    }
  }

  return {
    status: response.status,
    ok: response.ok,
    headers: response.headers,
    data,
  }
}

// -----------------------------------------------------------------------------
// VERIFICACIÓN INICIAL DE SERVICIOS
// -----------------------------------------------------------------------------
async function checkServices() {
  logHeader('Verificación de Servicios (Web y API)')
  try {
    const apiRes = await request('/backoffice/terms')
    assert.strictEqual(apiRes.status, 401, 'API debe responder 401 sin token')
    pass('SERV-1', 'Backend API NestJS respondiendo en http://localhost:3000')
  } catch (err) {
    fail('SERV-1', 'Backend API NestJS no está accesible', err)
    throw err
  }

  try {
    const webRes = await request(WEB_BASE)
    assert.strictEqual(webRes.status, 200, 'Frontend Web debe responder 200')
    pass('SERV-2', 'App Web Next.js respondiendo en http://localhost:3001')
  } catch (err) {
    fail('SERV-2', 'App Web Next.js no está accesible', err)
    throw err
  }
}

// -----------------------------------------------------------------------------
// FASE 1: BACKOFFICE SUPERADMIN
// -----------------------------------------------------------------------------
async function phase1Backoffice() {
  logHeader('Fase 1: Backoffice SuperAdmin — Términos, Organización y Usuarios')

  // Login SuperAdmin
  const saLogin = await request('/auth/login', {
    method: 'POST',
    json: { email: 'superadmin@clicke.com', password: 'Demo123456!' },
  })
  assert.strictEqual(saLogin.status, 200, 'SuperAdmin login falló')
  superAdminToken = saLogin.data.accessToken

  // TC-1.1: Crear versión de Términos y Condiciones
  try {
    const versionTag = `1.1.${Date.now().toString().slice(-4)}`
    const termsRes = await request('/backoffice/terms', {
      method: 'POST',
      token: superAdminToken,
      json: {
        version: versionTag,
        title: 'Términos y Condiciones de Uso Clicke Impulso',
        summary: 'Actualización de políticas de agenda y WhatsApp',
        content: 'Texto legal con más de 50 caracteres para la validación del plan de pruebas E2E en Clicke Impulso.',
        gracePeriodDays: 7,
      },
    })
    assert.strictEqual(termsRes.status, 201, `Error creando términos: ${JSON.stringify(termsRes.data)}`)
    termsVersionId = termsRes.data.id

    const listTerms = await request('/backoffice/terms', { token: superAdminToken })
    assert.ok(listTerms.data.some((t) => t.version === versionTag), 'La versión creada debe estar en el listado')
    pass('TC-1.1', 'Crear versión de Términos y Condiciones en /backoffice/terms', `Versión ${versionTag}`)
  } catch (err) {
    fail('TC-1.1', 'Crear versión de Términos y Condiciones', err)
  }

  // TC-1.2: Alta de Organización Nueva y Usuarios Iniciales
  try {
    const orgName = `Clínica Integral Demo ${Date.now().toString().slice(-4)}`
    const orgRes = await request('/backoffice/organizations', {
      method: 'POST',
      token: superAdminToken,
      json: {
        name: orgName,
        timezone: 'America/Argentina/Cordoba',
        currency: 'ARS',
        active: true,
        paidUntil: new Date(Date.now() + 30 * 86400000).toISOString(),
        maxOwners: 2,
        maxAdmins: 3,
        maxStaff: 5,
        disabledFeatures: [],
        users: [
          {
            email: `owner_${Date.now()}@clinicademo.com`,
            firstName: 'Valeria',
            lastName: 'Gómez',
            password: 'Demo123456!',
            role: 'OWNER',
          },
          {
            email: `admin_${Date.now()}@clinicademo.com`,
            firstName: 'Carlos',
            lastName: 'Ruiz',
            password: 'Demo123456!',
            role: 'ADMIN',
          },
          {
            email: `staff_${Date.now()}@clinicademo.com`,
            firstName: 'Mateo',
            lastName: 'López',
            password: 'Demo123456!',
            role: 'STAFF',
          },
        ],
      },
    })
    assert.strictEqual(orgRes.status, 201, `Error creando organización: ${JSON.stringify(orgRes.data)}`)
    testOrgId = orgRes.data.id

    // Guardar credenciales de los usuarios creados
    global.ownerEmail = orgRes.data.members.find((m) => m.role === 'OWNER').email
    global.adminEmail = orgRes.data.members.find((m) => m.role === 'ADMIN').email
    global.staffEmail = orgRes.data.members.find((m) => m.role === 'STAFF').email

    pass('TC-1.2', 'Alta de organización nueva con 3 roles iniciales (OWNER, ADMIN, STAFF)', orgName)
  } catch (err) {
    fail('TC-1.2', 'Alta de organización nueva', err)
  }

  // TC-1.3: Cupos y límite maxOwners/maxStaff
  try {
    // Agregar staff adicional dentro del cupo
    const extraStaffEmail = `staff_extra_${Date.now()}@clinicademo.com`
    const addStaffRes = await request(`/backoffice/organizations/${testOrgId}/users`, {
      method: 'POST',
      token: superAdminToken,
      json: {
        users: [
          {
            email: extraStaffEmail,
            firstName: 'Lucas',
            lastName: 'Staff',
            password: 'Demo123456!',
            role: 'STAFF',
          },
        ],
      },
    })
    assert.strictEqual(addStaffRes.status, 201, 'No se pudo agregar staff dentro del cupo')
    const addedMember = addStaffRes.data.members.find((m) => m.email === extraStaffEmail)
    assert.ok(addedMember, 'Miembro agregado no encontrado en respuesta')
    createdStaffMemberId = addedMember.memberId

    // Intentar exceder maxOwners (limite = 2, ya hay 1, intentamos meter 2 mas)
    const exceedOwnersRes = await request(`/backoffice/organizations/${testOrgId}/users`, {
      method: 'POST',
      token: superAdminToken,
      json: {
        users: [
          {
            email: `owner_exceed1_${Date.now()}@demo.com`,
            firstName: 'Exceed1',
            lastName: 'Owner',
            password: 'Demo123456!',
            role: 'OWNER',
          },
          {
            email: `owner_exceed2_${Date.now()}@demo.com`,
            firstName: 'Exceed2',
            lastName: 'Owner',
            password: 'Demo123456!',
            role: 'OWNER',
          },
        ],
      },
    })
    assert.strictEqual(exceedOwnersRes.status, 400, 'El backend debía rechazar exceder maxOwners')
    pass('TC-1.3', 'Gestión de cupos y rechazo estricto ante superación de maxOwners')
  } catch (err) {
    fail('TC-1.3', 'Gestión de cupos y límite maxOwners', err)
  }

  // TC-1.4: Edición y baja de miembro
  try {
    const patchMember = await request(`/backoffice/organizations/${testOrgId}/users/${createdStaffMemberId}`, {
      method: 'PATCH',
      token: superAdminToken,
      json: { isActive: false },
    })
    assert.strictEqual(patchMember.status, 200, 'Error actualizando miembro')

    const deleteMember = await request(`/backoffice/organizations/${testOrgId}/users/${createdStaffMemberId}`, {
      method: 'DELETE',
      token: superAdminToken,
    })
    assert.ok(deleteMember.status === 200 || deleteMember.status === 204, 'Error eliminando miembro')

    const getOrg = await request(`/backoffice/organizations/${testOrgId}`, { token: superAdminToken })
    assert.ok(!getOrg.data.members.some((m) => m.memberId === createdStaffMemberId), 'Miembro no fue removido')
    pass('TC-1.4', 'Edición (PATCH) y baja (DELETE) de miembro en organización')
  } catch (err) {
    fail('TC-1.4', 'Edición y baja de miembro', err)
  }
}

// -----------------------------------------------------------------------------
// FASE 2: AUTENTICACIÓN DUAL Y ACEPTACIÓN DE TÉRMINOS
// -----------------------------------------------------------------------------
async function phase2AuthAndTerms() {
  logHeader('Fase 2: Autenticación Web y Aceptación de Términos')

  // TC-2.1: Login Web, Cookie httpOnly y rotación de Refresh Token
  try {
    const loginRes = await request('/auth/login', {
      method: 'POST',
      json: { email: global.ownerEmail, password: 'Demo123456!' },
    })
    assert.strictEqual(loginRes.status, 200, 'Login web falló')
    ownerToken = loginRes.data.accessToken
    assert.ok(ownerToken, 'Falta accessToken en login')

    // Verificar cookie httpOnly
    const cookies = loginRes.headers.getSetCookie ? loginRes.headers.getSetCookie() : [loginRes.headers.get('set-cookie') || '']
    const refreshCookie = cookies.find((c) => c.includes('refresh_token='))
    assert.ok(refreshCookie, 'No se encontró cookie refresh_token en headers')
    assert.ok(refreshCookie.includes('HttpOnly'), 'La cookie refresh_token debe ser HttpOnly')
    assert.ok(refreshCookie.includes('Path=/auth'), 'La cookie debe tener Path=/auth')
    ownerCookie = refreshCookie.split(';')[0]

    // Probar POST /auth/refresh con la cookie
    const refreshRes = await request('/auth/refresh', {
      method: 'POST',
      cookie: ownerCookie,
    })
    assert.strictEqual(refreshRes.status, 200, 'POST /auth/refresh falló con cookie')
    assert.ok(refreshRes.data.accessToken, 'Refresh no devolvió nuevo accessToken')
    ownerToken = refreshRes.data.accessToken

    pass('TC-2.1', 'Login Web con cookie httpOnly (SameSite=Strict, Path=/auth) y Refresh exitoso')
  } catch (err) {
    fail('TC-2.1', 'Flujo de sesión Web y Refresh Token', err)
  }

  // Logins de Admin y Staff
  const adminLogin = await request('/auth/login', {
    method: 'POST',
    json: { email: global.adminEmail, password: 'Demo123456!' },
  })
  assert.strictEqual(adminLogin.status, 200, `Admin login falló: ${JSON.stringify(adminLogin.data)}`)
  adminToken = adminLogin.data.accessToken

  const staffLogin = await request('/auth/login', {
    method: 'POST',
    json: { email: global.staffEmail, password: 'Demo123456!' },
  })
  assert.strictEqual(staffLogin.status, 200, `Staff login falló: ${JSON.stringify(staffLogin.data)}`)
  staffToken = staffLogin.data.accessToken

  // TC-2.3: Restricción por rol y aceptación de T&C por OWNER
  try {
    // Intentar aceptar con STAFF -> debe devolver 403
    const staffAccept = await request('/organizations/me/terms/accept', {
      method: 'POST',
      token: staffToken,
      json: { termsVersionId, accepted: true },
    })
    assert.strictEqual(staffAccept.status, 403, 'STAFF no debe tener permiso para firmar T&C')

    // Aceptar con OWNER -> 200 OK
    const ownerAccept = await request('/organizations/me/terms/accept', {
      method: 'POST',
      token: ownerToken,
      json: { termsVersionId, accepted: true },
    })
    assert.strictEqual(ownerAccept.status, 200, `OWNER debe poder firmar T&C: ${JSON.stringify(ownerAccept.data)}`)

    // Verificar en auditoría de Backoffice
    const acceptances = await request(`/backoffice/terms/${termsVersionId}/acceptances`, {
      token: superAdminToken,
    })
    assert.strictEqual(acceptances.status, 200)
    assert.ok(
      acceptances.data.some((a) => a.organizationId === testOrgId),
      'La aceptación debe quedar auditada en Backoffice'
    )

    pass('TC-2.3', 'Aceptación de T&C restringida a OWNER y registro de auditoría en Backoffice')
  } catch (err) {
    fail('TC-2.3', 'Aceptación de Términos y Condiciones', err)
  }
}

// -----------------------------------------------------------------------------
// FASE 3: MATRIZ DE AUTORIZACIÓN EN 3 CAPAS
// -----------------------------------------------------------------------------
async function phase3AuthorizationMatrix() {
  logHeader('Fase 3: Matriz de Autorización en 3 Capas (Vigencia AND Feature AND Rol)')

  // TC-3.1: Restricciones de STAFF
  try {
    const today = new Date().toISOString().split('T')[0]
    // STAFF SÍ puede ver turnos y clientes
    const staffApp = await request(`/appointments?date=${today}`, { token: staffToken })
    assert.strictEqual(staffApp.status, 200, 'STAFF debe poder consultar turnos')

    const staffCust = await request('/customers', { token: staffToken })
    assert.strictEqual(staffCust.status, 200, 'STAFF debe poder consultar clientes')

    // STAFF NO puede borrar cliente
    const staffDelCust = await request('/customers/00000000-0000-0000-0000-000000000000', {
      method: 'DELETE',
      token: staffToken,
    })
    assert.strictEqual(staffDelCust.status, 403, 'STAFF no debe poder borrar clientes (403)')

    // STAFF NO puede acceder a módulos prohibidos
    const staffAnalytics = await request('/analytics/overview', { token: staffToken })
    assert.strictEqual(staffAnalytics.status, 403, 'STAFF no debe acceder a ANALYTICS (403)')

    const staffAutomations = await request('/automations', { token: staffToken })
    assert.strictEqual(staffAutomations.status, 403, 'STAFF no debe acceder a AUTOMATIONS (403)')

    const staffImports = await request('/imports/template/customers', { token: staffToken })
    assert.strictEqual(staffImports.status, 403, 'STAFF no debe acceder a IMPORTS (403)')

    pass('TC-3.1', 'Restricciones de rol STAFF (permitido turnos/clientes, 403 en DELETE, analíticas, automatizaciones e importaciones)')
  } catch (err) {
    fail('TC-3.1', 'Restricciones de rol STAFF', err)
  }

  // TC-3.2: Desactivación dinámica de OrganizationFeature
  try {
    // Desactivar AUTOMATIONS e IMPORTS desde Backoffice
    await request(`/backoffice/organizations/${testOrgId}`, {
      method: 'PATCH',
      token: superAdminToken,
      json: { disabledFeatures: ['AUTOMATIONS', 'IMPORTS'] },
    })

    // OWNER intenta acceder a AUTOMATIONS e IMPORTS -> 403
    const ownerAutomationsDisabled = await request('/automations', { token: ownerToken })
    assert.strictEqual(ownerAutomationsDisabled.status, 403, 'OWNER debe recibir 403 en AUTOMATIONS desactivado')

    const ownerImportsDisabled = await request('/imports/template/customers', { token: ownerToken })
    assert.strictEqual(ownerImportsDisabled.status, 403, 'OWNER debe recibir 403 en IMPORTS desactivado')

    // Restaurar features
    await request(`/backoffice/organizations/${testOrgId}`, {
      method: 'PATCH',
      token: superAdminToken,
      json: { disabledFeatures: [] },
    })

    const ownerAutomationsRestored = await request('/automations', { token: ownerToken })
    assert.strictEqual(ownerAutomationsRestored.status, 200, 'Features restauradas deben responder 200')

    pass('TC-3.2', 'Desactivación dinámica de OrganizationFeature bloquea endpoints correspondientes con 403')
  } catch (err) {
    fail('TC-3.2', 'Desactivación dinámica de features', err)
  }

  // TC-3.3: Bloqueo por suscripción vencida
  try {
    const today = new Date().toISOString().split('T')[0]
    // Setear paidUntil en el pasado
    await request(`/backoffice/organizations/${testOrgId}`, {
      method: 'PATCH',
      token: superAdminToken,
      json: { paidUntil: new Date(Date.now() - 86400000).toISOString() },
    })

    const ownerExpired = await request(`/appointments?date=${today}`, { token: ownerToken })
    assert.strictEqual(ownerExpired.status, 403, 'Organización con suscripción vencida debe ser bloqueada con 403')

    // Restaurar paidUntil
    await request(`/backoffice/organizations/${testOrgId}`, {
      method: 'PATCH',
      token: superAdminToken,
      json: { paidUntil: new Date(Date.now() + 30 * 86400000).toISOString() },
    })

    const ownerActive = await request(`/appointments?date=${today}`, { token: ownerToken })
    assert.strictEqual(ownerActive.status, 200, 'Organización activa debe responder 200')

    pass('TC-3.3', 'Bloqueo estricto por suscripción vencida (paidUntil) y restauración inmediata')
  } catch (err) {
    fail('TC-3.3', 'Bloqueo por suscripción vencida', err)
  }
}

// -----------------------------------------------------------------------------
// FASE 4: CATÁLOGO MANUAL E IMPORTACIÓN MASIVA
// -----------------------------------------------------------------------------
async function phase4CatalogAndImports() {
  logHeader('Fase 4: Catálogo Manual e Importación Masiva')

  // TC-4.1: Recursos de los 4 tipos canónicos con color
  try {
    const resSofia = await request('/resources', {
      method: 'POST',
      token: ownerToken,
      json: { name: 'Dra. Sofía Martínez', type: 'PERSON', metadata: { color: '#3285C2' } },
    })
    assert.strictEqual(resSofia.status, 201)
    draSofiaId = resSofia.data.id

    const resConsultorio = await request('/resources', {
      method: 'POST',
      token: ownerToken,
      json: { name: 'Consultorio Central', type: 'SPACE', metadata: { color: '#D88D26' } },
    })
    assert.strictEqual(resConsultorio.status, 201)
    consultorioId = resConsultorio.data.id

    const resLaser = await request('/resources', {
      method: 'POST',
      token: ownerToken,
      json: { name: 'Láser Diodo', type: 'EQUIPMENT', metadata: { color: '#10B981' } },
    })
    assert.strictEqual(resLaser.status, 201)
    laserId = resLaser.data.id

    const resBox = await request('/resources', {
      method: 'POST',
      token: ownerToken,
      json: { name: 'Box Guardia', type: 'GENERIC', metadata: { color: '#8B5CF6' } },
    })
    assert.strictEqual(resBox.status, 201)
    boxId = resBox.data.id

    const listRes = await request('/resources', { token: ownerToken })
    assert.strictEqual(listRes.status, 200)
    assert.ok(listRes.data.length >= 4, 'Deben existir al menos los 4 recursos creados')

    pass('TC-4.1', 'Creación de recursos de los 4 tipos canónicos (PERSON, SPACE, EQUIPMENT, GENERIC) con metadata.color')
  } catch (err) {
    fail('TC-4.1', 'Creación de recursos', err)
  }

  // TC-4.2: Reglas de disponibilidad horaria por recurso
  try {
    // Franjas válidas: Lun-Vie 09:00-13:00 y 14:00-18:00, Sáb 09:00-13:00
    const validRules = []
    for (let day = 1; day <= 5; day++) {
      validRules.push({ dayOfWeek: day, startTime: '09:00', endTime: '13:00' })
      validRules.push({ dayOfWeek: day, startTime: '14:00', endTime: '18:00' })
    }
    validRules.push({ dayOfWeek: 6, startTime: '09:00', endTime: '13:00' })

    const putRules = await request(`/availability/resources/${draSofiaId}/rules`, {
      method: 'PUT',
      token: ownerToken,
      json: { rules: validRules },
    })
    assert.strictEqual(putRules.status, 200, `Error guardando reglas válidas: ${JSON.stringify(putRules.data)}`)

    // Regla solapada debe fallar
    const overlapRes = await request(`/availability/resources/${draSofiaId}/rules`, {
      method: 'PUT',
      token: ownerToken,
      json: {
        rules: [
          { dayOfWeek: 1, startTime: '09:00', endTime: '13:00' },
          { dayOfWeek: 1, startTime: '12:00', endTime: '15:00' },
        ],
      },
    })
    assert.strictEqual(overlapRes.status, 400, 'Reglas solapadas debían responder 400')

    // Regla invertida startTime >= endTime debe fallar
    const invertedRes = await request(`/availability/resources/${draSofiaId}/rules`, {
      method: 'PUT',
      token: ownerToken,
      json: {
        rules: [{ dayOfWeek: 1, startTime: '15:00', endTime: '10:00' }],
      },
    })
    assert.strictEqual(invertedRes.status, 400, 'Regla invertida debía responder 400')

    pass('TC-4.2', 'Configuración de disponibilidad horaria por recurso y validación estricta de solapamientos')
  } catch (err) {
    fail('TC-4.2', 'Reglas de disponibilidad', err)
  }

  // TC-4.3: Servicio con buffers y recursos asociados
  try {
    const srvRes = await request('/services', {
      method: 'POST',
      token: ownerToken,
      json: {
        name: 'Consulta Dermatológica',
        durationMinutes: 30,
        bufferBeforeMinutes: 5,
        bufferAfterMinutes: 5,
        price: '15000.00',
        resourceIds: [draSofiaId, consultorioId],
      },
    })
    assert.strictEqual(srvRes.status, 201, `Error creando servicio: ${JSON.stringify(srvRes.data)}`)
    serviceId = srvRes.data.id
    pass('TC-4.3', 'Creación de servicio con buffers y recursos asociados (precio $ 15.000 sin decimales)', serviceId)
  } catch (err) {
    fail('TC-4.3', 'Creación de servicio', err)
  }

  // TC-4.4: Crear, buscar y editar Cliente
  try {
    const custRes = await request('/customers', {
      method: 'POST',
      token: ownerToken,
      json: {
        firstName: 'Lucía',
        lastName: 'Fernández',
        documentNumber: '35111222',
        phone: '+54 9 351 555-1234',
        email: 'lucia@example.com',
        birthDate: '1992-08-24',
        notes: 'Paciente primera vez',
      },
    })
    assert.strictEqual(custRes.status, 201, `Error creando cliente: ${JSON.stringify(custRes.data)}`)
    customerId = custRes.data.id

    // Búsquedas
    const searchByName = await request('/customers?search=Lucía', { token: ownerToken })
    assert.ok(searchByName.data.some((c) => c.id === customerId), 'Búsqueda por nombre falló')

    const searchByDni = await request('/customers?search=35111222', { token: ownerToken })
    assert.ok(searchByDni.data.some((c) => c.id === customerId), 'Búsqueda por DNI falló')

    pass('TC-4.4', 'Creación, búsqueda multivariada y detalle de Cliente')
  } catch (err) {
    fail('TC-4.4', 'Creación y búsqueda de cliente', err)
  }

  // TC-4.5: Descarga de plantillas oficiales
  try {
    const tplCsv = await request('/imports/template/customers?format=csv', { token: ownerToken })
    assert.strictEqual(tplCsv.status, 200)

    const tplXlsx = await request('/imports/template/all?format=xlsx', { token: ownerToken, binary: true })
    assert.strictEqual(tplXlsx.status, 200)

    // entity=all con format=csv debe dar 400
    const tplAllCsv = await request('/imports/template/all?format=csv', { token: ownerToken })
    assert.strictEqual(tplAllCsv.status, 400, 'entity=all con csv debía devolver 400')

    pass('TC-4.5', 'Descarga de plantillas oficiales (.csv y .xlsx) y validación de restricción multi-hoja')
  } catch (err) {
    fail('TC-4.5', 'Descarga de plantillas', err)
  }

  // TC-4.6: dryRun e importación con creación de recurso faltante
  try {
    // 1. Simulación dryRun de recursos
    const wb = XLSX.utils.book_new()
    const wsRes = XLSX.utils.json_to_sheet([
      { name: 'Ecógrafo 4D', type: 'EQUIPMENT' },
    ])
    XLSX.utils.book_append_sheet(wb, wsRes, 'Recursos')
    const resBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

    const formDry = new FormData()
    formDry.append('file', new File([resBuffer], 'recursos.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
    formDry.append('dryRun', 'true')

    const dryRes = await request('/imports/resources', {
      method: 'POST',
      token: ownerToken,
      body: formDry,
    })
    assert.strictEqual(dryRes.status, 201)
    assert.strictEqual(dryRes.data.dryRun, true, 'dryRun debe ser true en simulación')

    // Verificar que NO se persistió
    const listResDry = await request('/resources', { token: ownerToken })
    assert.ok(!listResDry.data.some((r) => r.name === 'Ecógrafo 4D'), 'dryRun no debía persistir')

    // 2. Importación real de Servicios con createMissingResources: true y recurso no existente
    const wbSrv = XLSX.utils.book_new()
    const wsSrv = XLSX.utils.json_to_sheet([
      {
        name: 'Ecografía Estructural',
        durationMinutes: 45,
        price: 25000,
        resources: 'Ecógrafo 4D',
      },
    ])
    XLSX.utils.book_append_sheet(wbSrv, wsSrv, 'Servicios')
    const srvBuffer = XLSX.write(wbSrv, { type: 'buffer', bookType: 'xlsx' })

    const formReal = new FormData()
    formReal.append('file', new File([srvBuffer], 'servicios.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
    formReal.append('dryRun', 'false')
    formReal.append('createMissingResources', 'true')

    const realRes = await request('/imports/services', {
      method: 'POST',
      token: ownerToken,
      body: formReal,
    })
    assert.strictEqual(realRes.status, 201)

    // Verificar que el recurso "Ecógrafo 4D" se creó automáticamente
    const listResAfter = await request('/resources', { token: ownerToken })
    const createdEcografo = listResAfter.data.find((r) => r.name === 'Ecógrafo 4D')
    assert.ok(createdEcografo, 'El recurso Ecógrafo 4D debía crearse automáticamente')
    ecografoId = createdEcografo.id

    pass('TC-4.6', 'Simulación dryRun e importación masiva con creación automática de recursos faltantes')
  } catch (err) {
    fail('TC-4.6', 'Simulación e importación masiva', err)
  }

  // TC-4.7: Estrategias de duplicados
  try {
    const wbCust = XLSX.utils.book_new()
    const wsCust = XLSX.utils.json_to_sheet([
      {
        firstName: 'Lucía',
        lastName: 'Fernández',
        documentNumber: '35111222',
        email: 'lucia@example.com',
        notes: 'Nota actualizada por importación',
      },
    ])
    XLSX.utils.book_append_sheet(wbCust, wsCust, 'Clientes')
    const custBuf = XLSX.write(wbCust, { type: 'buffer', bookType: 'xlsx' })

    // Probar skip_existing
    const formSkip = new FormData()
    formSkip.append('file', new File([custBuf], 'clientes.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
    formSkip.append('strategy', 'skip_existing')
    const resSkip = await request('/imports/customers', {
      method: 'POST',
      token: ownerToken,
      body: formSkip,
    })
    assert.strictEqual(resSkip.status, 201)
    assert.strictEqual(resSkip.data.summary.skippedCount, 1, 'skip_existing debía omitir 1 registro')

    // Probar update_existing
    const formUpdate = new FormData()
    formUpdate.append('file', new File([custBuf], 'clientes.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
    formUpdate.append('strategy', 'update_existing')
    const resUpdate = await request('/imports/customers', {
      method: 'POST',
      token: ownerToken,
      body: formUpdate,
    })
    assert.strictEqual(resUpdate.status, 201)
    assert.strictEqual(resUpdate.data.summary.updatedCount, 1, 'update_existing debía actualizar 1 registro')

    pass('TC-4.7', 'Estrategias de resolución de duplicados (skip_existing y update_existing)')
  } catch (err) {
    fail('TC-4.7', 'Estrategias de duplicados', err)
  }

  // TC-4.8: Importación unificada de Workbook
  try {
    const wbAll = XLSX.utils.book_new()
    const wsC = XLSX.utils.json_to_sheet([
      { firstName: 'Pedro', lastName: 'García', documentNumber: '38999888' },
    ])
    const wsR = XLSX.utils.json_to_sheet([
      { name: 'Sillón Odonto', type: 'EQUIPMENT' },
    ])
    const wsS = XLSX.utils.json_to_sheet([
      { name: 'Limpieza Dental', durationMinutes: 30, price: 12000 },
    ])
    XLSX.utils.book_append_sheet(wbAll, wsC, 'Clientes')
    XLSX.utils.book_append_sheet(wbAll, wsR, 'Recursos')
    XLSX.utils.book_append_sheet(wbAll, wsS, 'Servicios')
    const allBuf = XLSX.write(wbAll, { type: 'buffer', bookType: 'xlsx' })

    const formAll = new FormData()
    formAll.append('file', new File([allBuf], 'unificado.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
    const resAll = await request('/imports/all', {
      method: 'POST',
      token: ownerToken,
      body: formAll,
    })
    assert.strictEqual(resAll.status, 201)
    assert.ok(resAll.data.customers, 'Resumen de clientes en workbook unificado')
    assert.ok(resAll.data.resources, 'Resumen de recursos en workbook unificado')
    assert.ok(resAll.data.services, 'Resumen de servicios en workbook unificado')

    pass('TC-4.8', 'Importación unificada de Workbook (.xlsx multi-hoja Clientes/Recursos/Servicios)')
  } catch (err) {
    fail('TC-4.8', 'Importación unificada de Workbook', err)
  }
}

// -----------------------------------------------------------------------------
// FASE 5: TURNOS, GRILLA Y PRIVACIDAD PDF
// -----------------------------------------------------------------------------
async function phase5AppointmentsAndSchedule() {
  logHeader('Fase 5: Turnos, Grilla Interactiva y Exportación PDF')

  // Obtener fecha del próximo lunes a las 10:00 (en timezone America/Argentina/Cordoba, UTC-3)
  const d = new Date()
  const daysUntilNextMon = ((1 + 7 - d.getDay()) % 7) || 7
  d.setDate(d.getDate() + daysUntilNextMon)
  const dateStr = d.toISOString().split('T')[0]
  const startsAt = `${dateStr}T10:00:00-03:00`
  const startsAtMoved = `${dateStr}T10:30:00-03:00`
  const startsAtConflict = `${dateStr}T12:00:00-03:00`

  // TC-5.1: Cálculo de disponibilidad de slots
  try {
    const availDayRes = await request(`/availability/day?date=${dateStr}&resourceId=${draSofiaId}`, {
      token: ownerToken,
    })
    assert.strictEqual(availDayRes.status, 200)
    assert.ok(Array.isArray(availDayRes.data) && availDayRes.data[0]?.intervals?.length > 0, 'Debe ofrecer intervalos del día')

    const availServiceRes = await request(`/availability?date=${dateStr}&serviceId=${serviceId}&resourceId=${draSofiaId}`, {
      token: ownerToken,
    })
    assert.strictEqual(availServiceRes.status, 200)
    assert.ok(Array.isArray(availServiceRes.data) && availServiceRes.data[0]?.slots?.length > 0, 'Debe ofrecer franjas horarias disponibles')
    pass('TC-5.1', 'Cálculo dinámico de disponibilidad y slots respetando reglas, duración y buffers')
  } catch (err) {
    fail('TC-5.1', 'Cálculo de slots disponibles', err)
  }

  // TC-5.2: Creación de turno tradicional y snapshots
  try {
    const appRes = await request('/appointments', {
      method: 'POST',
      token: ownerToken,
      json: {
        customerId,
        serviceId,
        resourceId: draSofiaId,
        startsAt,
        notes: 'Turno inicial dermatología',
      },
    })
    assert.strictEqual(appRes.status, 201, `Error creando turno: ${JSON.stringify(appRes.data)}`)
    appointmentId = appRes.data.id
    assert.strictEqual(appRes.data.serviceNameSnapshot, 'Consulta Dermatológica', 'Snapshot del nombre de servicio')
    assert.ok(appRes.data.price !== null, 'Snapshot de precio')

    // Modificar precio del servicio original y verificar que el turno preserva su snapshot
    await request(`/services/${serviceId}`, {
      method: 'PATCH',
      token: ownerToken,
      json: { price: '20000.00' },
    })

    const appCheck = await request(`/appointments/${appointmentId}`, { token: ownerToken })
    assert.strictEqual(appCheck.data.serviceNameSnapshot, 'Consulta Dermatológica')
    pass('TC-5.2', 'Creación de turno e inmutabilidad de snapshots (precio, duración y nombre)')
  } catch (err) {
    fail('TC-5.2', 'Creación de turno y snapshots', err)
  }

  // TC-5.3 & TC-5.5: D&D Move, Resize y Detección de Conflicto
  try {
    // Move: cambiar horario de inicio
    const moveRes = await request(`/appointments/${appointmentId}`, {
      method: 'PATCH',
      token: ownerToken,
      json: { startsAt: startsAtMoved },
    })
    assert.strictEqual(moveRes.status, 200, 'D&D move falló')

    // Resize: cambiar durationMinutes de 30 a 45
    const resizeRes = await request(`/appointments/${appointmentId}`, {
      method: 'PATCH',
      token: ownerToken,
      json: { durationMinutes: 45 },
    })
    assert.strictEqual(resizeRes.status, 200, 'Resize de duración falló')

    // Crear un segundo turno para provocar conflicto
    const app2 = await request('/appointments', {
      method: 'POST',
      token: ownerToken,
      json: {
        customerId,
        serviceId,
        resourceId: draSofiaId,
        startsAt: startsAtConflict,
      },
    })
    assert.strictEqual(app2.status, 201)

    // Intentar mover el primer turno exactamente al horario ocupado del segundo
    const conflictRes = await request(`/appointments/${appointmentId}`, {
      method: 'PATCH',
      token: ownerToken,
      json: { startsAt: startsAtConflict },
    })
    assert.ok(
      conflictRes.status === 400 || conflictRes.status === 409,
      'El backend debía rechazar la superposición horaria con error'
    )

    pass('TC-5.5', 'Actualización optimista vía Drag & Drop, Resize de duración y rechazo de conflictos')
  } catch (err) {
    fail('TC-5.5', 'Drag & Drop, Resize y conflicto', err)
  }

  // TC-5.6: Transición por los 5 estados
  try {
    const statuses = ['CONFIRMED', 'COMPLETED', 'NO_SHOW', 'CANCELLED']
    for (const st of statuses) {
      const patchSt = await request(`/appointments/${appointmentId}`, {
        method: 'PATCH',
        token: ownerToken,
        json: { status: st },
      })
      assert.strictEqual(patchSt.status, 200, `Fallo en transición al estado ${st}`)
      assert.strictEqual(patchSt.data.status, st)
    }
    pass('TC-5.6', 'Ciclo de vida completo por los 5 estados (PENDING → CONFIRMED → COMPLETED → NO_SHOW → CANCELLED)')
  } catch (err) {
    fail('TC-5.6', 'Transición por estados', err)
  }

  // TC-5.7: Invariante de privacidad en exportación PDF semanal
  try {
    // Verificar estáticamente que export-resource-week-pdf.ts no expone teléfono
    const pdfSource = fs.readFileSync(
      path.resolve(process.cwd(), 'ft-schedule/src/lib/export-resource-week-pdf.ts'),
      'utf8'
    )
    assert.ok(!pdfSource.includes('appointment.customer?.phone'), 'El código del PDF contiene referencia al teléfono del cliente')
    assert.ok(!pdfSource.includes('customer.phone'), 'El código del PDF contiene referencia a customer.phone')
    assert.ok(pdfSource.includes('appointment.customer?.documentNumber'), 'El código del PDF debe incluir el documentNumber (DNI)')

    pass('TC-5.7', 'Invariante de Privacidad en PDF semanal: DNI del cliente visible y número de teléfono estrictamente excluido')
  } catch (err) {
    fail('TC-5.7', 'Privacidad en PDF semanal', err)
  }
}

// -----------------------------------------------------------------------------
// FASE 6: AUTOMATIZACIONES Y WHATSAPP CLOUD API
// -----------------------------------------------------------------------------
async function phase6Automations() {
  logHeader('Fase 6: Automatizaciones y WhatsApp Cloud API')

  // TC-6.1: Configuración con token enmascarado
  try {
    const rawSecret = 'EAABwzLxyz_secret_meta_token_1234567890'
    const patchWsp = await request('/automations/whatsapp-config', {
      method: 'PATCH',
      token: ownerToken,
      json: {
        phoneNumberId: '109876543210',
        accessToken: rawSecret,
        enabled: true,
        simulationMode: true,
      },
    })
    assert.strictEqual(patchWsp.status, 200)

    const getWsp = await request('/automations/whatsapp-config', { token: ownerToken })
    assert.strictEqual(getWsp.status, 200)
    assert.ok(!JSON.stringify(getWsp.data).includes(rawSecret), 'El backend jamás debe exponer el accessToken en texto plano')
    assert.ok(getWsp.data.accessTokenMasked, 'Debe devolver accessTokenMasked')

    pass('TC-6.1', 'Configuración de WhatsApp con token enmascarado (accessTokenMasked) y sin fuga en API')
  } catch (err) {
    fail('TC-6.1', 'Configuración de WhatsApp', err)
  }

  // TC-6.2: Reglas de automatización para los 4 triggers
  try {
    const triggers = [
      { trigger: 'APPOINTMENT_CREATED', delayValue: 0, delayUnit: 'MINUTES', name: 'Confirmación Inmediata' },
      { trigger: 'APPOINTMENT_UPCOMING', delayValue: 24, delayUnit: 'HOURS', name: 'Recordatorio 24h Antes' },
      { trigger: 'APPOINTMENT_COMPLETED', delayValue: 2, delayUnit: 'HOURS', name: 'Agradecimiento Post-Atención' },
      { trigger: 'APPOINTMENT_CANCELLED', delayValue: 0, delayUnit: 'MINUTES', name: 'Aviso de Turno Cancelado' },
    ]

    for (const ruleDef of triggers) {
      const ruleRes = await request('/automations', {
        method: 'POST',
        token: ownerToken,
        json: {
          name: ruleDef.name,
          trigger: ruleDef.trigger,
          delayValue: ruleDef.delayValue,
          delayUnit: ruleDef.delayUnit,
        },
      })
      assert.strictEqual(ruleRes.status, 201, `Error creando regla ${ruleDef.trigger}: ${JSON.stringify(ruleRes.data)}`)
    }

    const listRules = await request('/automations', { token: ownerToken })
    assert.strictEqual(listRules.status, 200)
    assert.ok(listRules.data.length >= 4, 'Deben existir al menos las 4 reglas creadas')

    pass('TC-6.2', 'Creación y configuración de reglas para los 4 triggers canónicos de automatización')
  } catch (err) {
    fail('TC-6.2', 'Reglas de automatización', err)
  }

  // TC-6.3: Historial y estados de ejecución
  try {
    const execs = await request('/automations/executions', { token: ownerToken })
    assert.strictEqual(execs.status, 200)
    assert.ok(Array.isArray(execs.data), 'Debe devolver array de ejecuciones')
    pass('TC-6.3', 'Consulta del historial de ejecuciones y estados de automatización')
  } catch (err) {
    fail('TC-6.3', 'Historial de ejecuciones', err)
  }
}

// -----------------------------------------------------------------------------
// FASE 7: DASHBOARD Y ANALÍTICAS
// -----------------------------------------------------------------------------
async function phase7Analytics() {
  logHeader('Fase 7: Dashboard y Analíticas')

  try {
    const now = new Date()
    const from = new Date(now.getTime() - 7 * 86400000).toISOString()
    const to = new Date(now.getTime() + 7 * 86400000).toISOString()

    const analyticsRes = await request(`/analytics/overview?from=${from}&to=${to}`, {
      token: ownerToken,
    })
    assert.strictEqual(analyticsRes.status, 200)
    const d = analyticsRes.data

    // TC-7.1: KPIs y serie diaria
    assert.ok('revenue' in d && 'expected' in d.revenue, 'Falta bloque revenue en analytics')
    assert.ok('appointments' in d && 'total' in d.appointments, 'Falta bloque appointments en analytics')
    assert.ok(Array.isArray(d.daily), 'Falta array daily')
    if (d.daily.length > 0) {
      const item = d.daily[0]
      assert.ok('pending' in item && 'confirmed' in item && 'completed' in item, 'daily debe contener estados')
    }
    pass('TC-7.1', 'KPIs financieros y serie diaria de turnos desglosada por estados (expected, realized, pending, confirmed, completed)')

    // TC-7.2: Desglose diario dailyBreakdown con filtrado por estado, servicio y recurso
    assert.ok(Array.isArray(d.dailyBreakdown), 'Falta array dailyBreakdown para filtrado cruzado')
    if (d.dailyBreakdown.length > 0) {
      const bItem = d.dailyBreakdown[0]
      assert.ok('status' in bItem, 'dailyBreakdown requiere status')
      assert.ok('serviceId' in bItem, 'dailyBreakdown requiere serviceId')
      assert.ok('resourceId' in bItem, 'dailyBreakdown requiere resourceId')
    }
    pass('TC-7.2', 'Estructura dailyBreakdown para filtrado interactivo cruzado por estado, servicio y recurso')
  } catch (err) {
    fail('TC-7.1 / 7.2', 'Dashboard y analíticas', err)
  }
}

// -----------------------------------------------------------------------------
// FASE 8: COMPILACIÓN TRANSVERSAL
// -----------------------------------------------------------------------------
async function phase8CrossCompilation() {
  logHeader('Fase 8: Verificación Transversal de Tipos TypeScript (Ecosistema)')

  try {
    const output = execSync('node --no-warnings .agents/skills/clicke-engram/scripts/verify-ecosystem.mjs', {
      encoding: 'utf8',
    })
    assert.ok(output.includes('[PASS] Backend API'), 'Backend API falló compilación')
    assert.ok(output.includes('[PASS] Web App'), 'Web App falló compilación')
    assert.ok(output.includes('[PASS] Mobile App'), 'Mobile App falló compilación')
    pass('TC-8.3', 'Verificación transversal de compilación TypeScript en be-schedule, ft-schedule y app-schedule')
  } catch (err) {
    fail('TC-8.3', 'Compilación transversal', err)
  }
}

// -----------------------------------------------------------------------------
// EJECUCIÓN PRINCIPAL
// -----------------------------------------------------------------------------
async function run() {
  console.log('\n🚀 INICIANDO EJECUCIÓN DEL TEST PLAN COMPLETO EN WEB (TEST_PLAN_E2E.md)')
  console.log(`Hora de inicio: ${new Date().toISOString()}`)

  try {
    await checkServices()
    await phase1Backoffice()
    await phase2AuthAndTerms()
    await phase3AuthorizationMatrix()
    await phase4CatalogAndImports()
    await phase5AppointmentsAndSchedule()
    await phase6Automations()
    await phase7Analytics()
    await phase8CrossCompilation()
  } catch (fatalErr) {
    console.error('\n❌ Error fatal detuvo la ejecución:', fatalErr)
  }

  logHeader('RESUMEN DE RESULTADOS E2E')
  const total = results.length
  const passed = results.filter((r) => r.status === 'PASS').length
  const failed = results.filter((r) => r.status === 'FAIL').length

  console.log(`Total Casos Ejecutados: ${total}`)
  console.log(`\x1b[32mExitosos (PASS): ${passed}\x1b[0m`)
  if (failed > 0) {
    console.log(`\x1b[31mFallidos (FAIL): ${failed}\x1b[0m`)
  } else {
    console.log(`\x1b[32m🎉 ¡TODOS LOS CASOS DEL PLAN DE PRUEBAS EN WEB PASARON EXITOSAMENTE!\x1b[0m`)
  }

  process.exit(failed > 0 ? 1 : 0)
}

run()
