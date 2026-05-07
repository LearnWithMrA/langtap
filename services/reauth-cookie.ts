// ─────────────────────────────────────────────
// File: services/reauth-cookie.ts
// Purpose: HMAC-SHA256 signed cookie utilities for the OAuth delete
//          re-authentication flow. Creates and verifies short-lived
//          signed payloads stored in HttpOnly cookies. Used by the
//          reauth start route and the auth callback.
// Depends on: Web Crypto API (available in Node.js 18+ and Edge)
// ─────────────────────────────────────────────

// ── Types ─────────────────────────────────────

export type ReauthPendingPayload = {
  userId: string
  provider: string
  purpose: 'delete-reauth-pending'
  nonce: string
  expiresAt: number
}

export type ReauthVerifiedPayload = {
  userId: string
  provider: string
  purpose: 'delete-reauth-verified'
  verifiedAt: number
  expiresAt: number
}

type ReauthPayload = ReauthPendingPayload | ReauthVerifiedPayload

// ── Constants ─────────────────────────────────

export const PENDING_COOKIE_NAME = 'lt-reauth-pending'
export const VERIFIED_COOKIE_NAME = 'lt-reauth-verified'
const REAUTH_TTL_SECONDS = 300

// ── Helpers ───────────────────────────────────

function getSecret(): string {
  const secret = process.env.AUTH_REAUTH_COOKIE_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('AUTH_REAUTH_COOKIE_SECRET must be set and at least 32 characters')
  }
  return secret
}

function toBase64Url(str: string): string {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function fromBase64Url(b64: string): string {
  const padded =
    b64.replace(/-/g, '+').replace(/_/g, '/') + '=='.slice(0, (4 - (b64.length % 4)) % 4)
  return atob(padded)
}

function hexFromBytes(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function bytesFromHex(hex: string): Uint8Array {
  const pairs = hex.match(/.{2}/g)
  if (!pairs) return new Uint8Array(0)
  return new Uint8Array(pairs.map((b) => parseInt(b, 16)))
}

async function importKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  )
}

// ── Sign / Verify ─────────────────────────────

async function signPayload(payload: ReauthPayload): Promise<string> {
  const secret = getSecret()
  const key = await importKey(secret)
  const json = JSON.stringify(payload)
  const dataB64 = toBase64Url(json)
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(json))
  return `${dataB64}.${hexFromBytes(new Uint8Array(sig))}`
}

async function verifyToken<T extends ReauthPayload>(token: string): Promise<T | null> {
  const dotIndex = token.indexOf('.')
  if (dotIndex === -1) return null

  const dataB64 = token.slice(0, dotIndex)
  const sigHex = token.slice(dotIndex + 1)
  if (!dataB64 || !sigHex) return null

  let json: string
  try {
    json = fromBase64Url(dataB64)
  } catch {
    return null
  }

  const secret = getSecret()
  const key = await importKey(secret)
  const sigBytes = bytesFromHex(sigHex)
  const valid = await crypto.subtle.verify(
    'HMAC',
    key,
    sigBytes.buffer as ArrayBuffer,
    new TextEncoder().encode(json),
  )
  if (!valid) return null

  let payload: T
  try {
    payload = JSON.parse(json) as T
  } catch {
    return null
  }

  if (typeof payload.expiresAt !== 'number') return null
  if (payload.expiresAt < Math.floor(Date.now() / 1000)) return null

  return payload
}

// ── Public API ────────────────────────────────

export async function createPendingToken(userId: string, provider: string): Promise<string> {
  const payload: ReauthPendingPayload = {
    userId,
    provider,
    purpose: 'delete-reauth-pending',
    nonce: crypto.randomUUID(),
    expiresAt: Math.floor(Date.now() / 1000) + REAUTH_TTL_SECONDS,
  }
  return signPayload(payload)
}

export async function verifyPendingToken(token: string): Promise<ReauthPendingPayload | null> {
  const payload = await verifyToken<ReauthPendingPayload>(token)
  if (!payload) return null
  if (payload.purpose !== 'delete-reauth-pending') return null
  return payload
}

export async function createVerifiedToken(userId: string, provider: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const payload: ReauthVerifiedPayload = {
    userId,
    provider,
    purpose: 'delete-reauth-verified',
    verifiedAt: now,
    expiresAt: now + REAUTH_TTL_SECONDS,
  }
  return signPayload(payload)
}

export async function verifyVerifiedToken(token: string): Promise<ReauthVerifiedPayload | null> {
  const payload = await verifyToken<ReauthVerifiedPayload>(token)
  if (!payload) return null
  if (payload.purpose !== 'delete-reauth-verified') return null
  return payload
}

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: REAUTH_TTL_SECONDS,
}

export const CLEAR_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 0,
}
