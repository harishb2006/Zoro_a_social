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
    const rawMessages = await MessageService.getMessages(conversationId, user.id);
    
    // Mark messages as read
    await MessageService.markAsRead(conversationId, user.id);
    
    // Transform to frontend format
    const messages = rawMessages.map((msg: any) => ({
      id: msg.id,
      sender_id: msg.sender_id,
      receiver_id: msg.receiver_id,
      content: msg.message,
      is_read: msg.is_read,
      created_at: msg.created_at
    }));
    
    return NextResponse.json(messages);
  } catch (error: any) {
    console.error('Get messages error:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
