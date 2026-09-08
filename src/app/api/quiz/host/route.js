import { NextResponse } from 'next/server';
import { hostActionServer } from '../../../../lib/quiz/scoreAnswerServer';
import { requireAdmin, authErrorResponse, rateLimit, ROLES } from '../../../../lib/auth/serverAuth';
import { isFirebaseAdminConfigured } from '../../../../lib/auth/firebaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST { sessionId, action, playerId?, reason? }
 * Requires Firebase Auth admin (editor+).
 */
export async function POST(request) {
  try {
    if (!isFirebaseAdminConfigured()) {
      return NextResponse.json(
        { error: 'Server host actions unavailable', code: 'admin_not_configured' },
        { status: 503 },
      );
    }

    const ctx = await requireAdmin(request, { minRole: ROLES.EDITOR });
    rateLimit(`quiz-host:${ctx.uid}`, { limit: 60, windowMs: 60_000 });

    const body = await request.json();
    const sessionId = String(body?.sessionId || '').trim();
    const action = String(body?.action || '').trim().toLowerCase();
    if (!sessionId || !action) {
      return NextResponse.json({ error: 'sessionId and action required' }, { status: 400 });
    }

    const result = await hostActionServer({
      sessionId,
      action,
      actorUid: ctx.uid,
      actorRole: ctx.role,
      actorName: ctx.adminDoc?.username || ctx.email || ctx.uid,
      patch: {
        playerId: body.playerId,
        reason: body.reason,
        settings: body.settings,
      },
    });

    return NextResponse.json(result);
  } catch (err) {
    return authErrorResponse(err);
  }
}
