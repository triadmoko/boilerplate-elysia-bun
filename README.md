# Popix API

REST API berbasis **Bun + Elysia** dengan pola **Clean Architecture (feature-based)**, MySQL via **Drizzle ORM**, dan autentikasi JWT.

## Stack

| Komponen | Library |
| --- | --- |
| Runtime | Bun 1.4 |
| HTTP framework | Elysia 1.4 |
| Database / ORM | MySQL 8.4 + Drizzle ORM (`mysql2`) |
| Auth | JWT HS256 (`jose`) + bcrypt (`Bun.password`) |
| Dokumentasi API | `@elysiajs/openapi` (Scalar UI) |
| Test | `bun test` |

## Memulai

```bash
cp .env.example .env          # sesuaikan nilainya, terutama JWT_SECRET
bun install
docker compose up -d mysql    # MySQL lokal
bun run db:migrate            # jalankan migrasi
bun run dev                   # http://localhost:3000
```

Dokumentasi API interaktif: http://localhost:3000/openapi (spec JSON di `/openapi/json`).

Menjalankan semuanya via Docker (migrasi otomatis saat container start):

```bash
docker compose up -d --build
```

## Script

| Perintah | Fungsi |
| --- | --- |
| `bun run dev` | Server dengan hot-reload |
| `bun run start` | Server mode production |
| `bun test` | Unit test usecase + integration test HTTP (tanpa DB) |
| `bun run typecheck` | Type checking `tsc --noEmit` |
| `bun run db:generate` | Generate file migrasi dari perubahan schema |
| `bun run db:migrate` | Terapkan migrasi ke database |
| `bun run db:studio` | Buka Drizzle Studio |

## Endpoint

Semua endpoint berada di bawah `/api/v1`. 🔒 = butuh header `Authorization: Bearer <token>`.

| Method | Path | Keterangan |
| --- | --- | --- |
| GET | `/health` | Health check (termasuk ping DB) |
| POST | `/api/v1/auth/register` | Registrasi user (role `user`) |
| POST | `/api/v1/auth/login` | Login, mengembalikan `accessToken` |
| GET | `/api/v1/auth/me` 🔒 | Profil user yang login |
| GET | `/api/v1/users?page=&limit=&search=` 🔒 | Daftar user terpaginasi |
| GET | `/api/v1/users/:id` 🔒 | Detail user |
| POST | `/api/v1/users` 🔒 | Buat user |
| PUT | `/api/v1/users/:id` 🔒 | Ubah user (partial) |
| DELETE | `/api/v1/users/:id` 🔒 | Hapus user |

Format response seragam:

```json
{ "success": true, "message": "Success", "data": {}, "meta": { "page": 1, "limit": 10, "total": 1, "totalPages": 1 } }
{ "success": false, "message": "User not found", "code": "NOT_FOUND" }
```

## Struktur

Lihat [CLAUDE.md](./CLAUDE.md) untuk penjelasan arsitektur dan cara menambah feature baru.

```
src/
├── main.ts            # bootstrap + graceful shutdown
├── app/               # composition root (container DI, registrasi feature)
├── core/config/       # konfigurasi dari env
├── features/          # auth, user — masing-masing: module, delivery/http, usecase
├── shared/            # domain, infrastructure, delivery/http bersama
├── pkg/               # utilitas reusable (jwt, crypto, logger, pagination)
└── types/
```
