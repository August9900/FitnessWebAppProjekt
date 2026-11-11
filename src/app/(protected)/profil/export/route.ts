// Download of everything stored about the signed-in person (AC-15). Route handlers are not
// covered by the protected layout, so this checks the session itself.
import { NextResponse } from 'next/server'
import { collectAccountExport } from '@/features/account/account.data'
import { exportFileName } from '@/features/account/account.rules'

export async function GET() {
  try {
    const now = new Date()
    const data = await collectAccountExport(now)
    if (!data) {
      return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401, headers: { 'Cache-Control': 'no-store' } })
    }
    return new NextResponse(JSON.stringify(data, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${exportFileName(now)}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('[account] export failed', { reason: error instanceof Error ? error.message : 'unknown' })
    // No file at all rather than an incomplete one.
    return NextResponse.json(
      { error: 'Der Export ist gerade nicht möglich. Bitte versuche es erneut.' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    )
  }
}
