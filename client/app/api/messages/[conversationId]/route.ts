import { NextRequest, NextResponse } from 'next/server';
import { MessageService } from '@/lib/db/services';
import { authenticate } from '@/lib/auth/middleware';

// GET /api/messages/[conversationId] - Get messages in a conversation
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const user = authenticate(req);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId } = await params;
    const messages = await MessageService.getMessages(conversationId, user.id);
    return NextResponse.json(messages);
  } catch (error: any) {
    console.error('Get messages error:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// PUT /api/messages/[conversationId] - Accept or decline request
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const user = authenticate(req);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId } = await params;
    const { action } = await req.json();

    if (action === 'accept') {
      // Mark all messages in conversation as read
      await MessageService.markAsRead(conversationId, user.id);
      return NextResponse.json({ message: 'Request accepted' });
    } else if (action === 'decline') {
      // Delete all messages in conversation
      // For now, just mark as handled - you can add delete logic if needed
      return NextResponse.json({ message: 'Request declined' });
    }

    return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Update request error:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
