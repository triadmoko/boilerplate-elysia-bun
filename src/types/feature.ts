import type { AnyElysia } from 'elysia'

/** Kontrak setiap feature module; didaftarkan di `src/app/app.ts`. */
export interface Feature {
  name: string
  routes: AnyElysia
}
