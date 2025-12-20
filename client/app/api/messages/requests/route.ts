import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth/middleware';

// GET /api/messages/requests - No longer needed (Instagram-style)
// Everyone can message people they follow directly
export async function GET(req: NextRequest) {
  try {
    const user = authenticate(req);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Return empty array - no request system
    return NextResponse.json([]);
  } catch (error: any) {
    console.error('Get message requests error:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
