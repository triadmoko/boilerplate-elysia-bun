// Integration test HTTP: app lengkap (routing, validasi, middleware, error handler) dengan dependency fake.
import { beforeEach, describe, expect, it } from 'bun:test'
import { createTestContainer } from '@/shared/testing/fakes'
import { createApp, type App } from './app'

const BASE = 'http://localhost/api/v1'

describe('HTTP API', () => {
  let app: App

  beforeEach(() => {
    app = createApp(createTestContainer())
  })

  const request = async (method: string, path: string, { body, token }: { body?: unknown; token?: string } = {}) => {
    const headers: Record<string, string> = {}
    if (body !== undefined) headers['content-type'] = 'application/json'
    if (token) headers.authorization = `Bearer ${token}`
    const response = await app.handle(
      new Request(`${BASE}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) }),
    )
    return { status: response.status, json: (await response.json()) as any }
  }

  const registerAndLogin = async () => {
    await request('POST', '/auth/register', { body: { name: 'Budi', email: 'budi@mail.com', password: 'secret123' } })
    const { json } = await request('POST', '/auth/login', { body: { email: 'budi@mail.com', password: 'secret123' } })
    return json.data.accessToken as string
  }

  it('GET /health → 200', async () => {
    const response = await app.handle(new Request('http://localhost/health'))
    expect(response.status).toBe(200)
  })

  it('register → 201, register ulang → 409', async () => {
    const body = { name: 'Budi', email: 'budi@mail.com', password: 'secret123' }

    const first = await request('POST', '/auth/register', { body })
    expect(first.status).toBe(201)
    expect(first.json.data).not.toHaveProperty('password')

    const second = await request('POST', '/auth/register', { body })
    expect(second.status).toBe(409)
    expect(second.json).toMatchObject({ success: false, code: 'CONFLICT' })
  })

  it('validasi body gagal → 422', async () => {
    const { status, json } = await request('POST', '/auth/register', { body: { email: 'bukan-email' } })
    expect(status).toBe(422)
    expect(json.code).toBe('VALIDATION_ERROR')
  })

  it('GET /auth/me tanpa token → 401, dengan token → 200', async () => {
    expect((await request('GET', '/auth/me')).status).toBe(401)
    expect((await request('GET', '/auth/me', { token: 'rusak' })).status).toBe(401)

    const token = await registerAndLogin()
    const { status, json } = await request('GET', '/auth/me', { token })
    expect(status).toBe(200)
    expect(json.data.email).toBe('budi@mail.com')
  })

  it('CRUD /users', async () => {
    const token = await registerAndLogin()

    const created = await request('POST', '/users', {
      token,
      body: { name: 'Siti', email: 'siti@mail.com', password: 'secret123', role: 'admin' },
    })
    expect(created.status).toBe(201)
    const id = created.json.data.id

    const list = await request('GET', '/users?page=1&limit=1', { token })
    expect(list.status).toBe(200)
    expect(list.json.data).toHaveLength(1)
    expect(list.json.meta).toEqual({ page: 1, limit: 1, total: 2, totalPages: 2 })

    const updated = await request('PUT', `/users/${id}`, { token, body: { name: 'Siti Baru' } })
    expect(updated.json.data.name).toBe('Siti Baru')

    expect((await request('DELETE', `/users/${id}`, { token })).status).toBe(200)
    expect((await request('GET', `/users/${id}`, { token })).status).toBe(404)
  })

  it('route tidak dikenal → 404 dengan format seragam', async () => {
    const { status, json } = await request('GET', '/tidak-ada')
    expect(status).toBe(404)
    expect(json).toMatchObject({ success: false, code: 'NOT_FOUND' })
  })
})
