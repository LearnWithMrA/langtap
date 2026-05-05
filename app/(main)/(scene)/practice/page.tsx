// ------------------------------------------------------------
// File: app/(main)/practice/page.tsx
// Purpose: Redirect handler for bare /practice URL. Sends to
//          /practice/kana for backwards compatibility with saved
//          links, browser history, and auth callbacks.
// Depends on: nothing
// ------------------------------------------------------------

import { redirect } from 'next/navigation'

export default function PracticeRedirect(): never {
  redirect('/practice/kana')
}
