// ------------------------------------------------------------
// File: app/api/stripe/webhook/route.ts
// Purpose: Stripe webhook handler. Server-side only.
//          Processes Stripe events for the membership system.
//          Infrastructure placeholder - to be implemented in Sprint 11.
// Depends on: services/stripe.service.ts
// ------------------------------------------------------------

import { NextResponse } from 'next/server'

export async function POST(): Promise<NextResponse> {
  // Placeholder - Stripe webhook handling not yet implemented.
  return NextResponse.json({ received: true })
}
