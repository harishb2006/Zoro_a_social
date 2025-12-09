import { NextRequest, NextResponse } from 'next/server';
import { MessageService } from '@/lib/db/services';
import { authenticate } from '@/lib/auth/middleware';

// GET /api/messages - Get all conversations
export async function GET(req: NextRequest) {
  try {
    const user = authenticate(req);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const rawConversations = await MessageService.getConversations(user.id);
    
    // Transform data to match frontend interface
    const conversations = rawConversations.map((conv: any) => ({
      conversationId: conv.conversation_id,
      otherUser: {
        id: conv.other_user_id,
        username: conv.other_user_username,
        profilePic: conv.other_user_profile_picture
      },
      lastMessage: conv.message,
      lastMessageAt: conv.created_at,
      unreadCount: conv.is_read ? 0 : (conv.last_message_sender_id !== user.id ? 1 : 0)
    }));
    
    return NextResponse.json(conversations);
  } catch (error: any) {
    console.error('Get conversations error:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// POST /api/messages - Send a message
export async function POST(req: NextRequest) {
  try {
    const user = authenticate(req);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    console.log('Send message request body:', body);
    console.log('Authenticated user:', user.id);
    
    const { receiverId, content } = body;

    if (!receiverId || !content || content.trim() === '') {
      return NextResponse.json(
        { message: 'Receiver ID and content are required' },
        { status: 400 }
      );
    }

    console.log('Sending message from', user.id, 'to', receiverId);

    // Create conversation ID (smaller ID first for consistency)
    const ids = [user.id, receiverId].sort();
    const conversationId = `${ids[0]}-${ids[1]}`;

    const message = await MessageService.create({
      sender_id: user.id,
      receiver_id: receiverId,
      message: content.trim(),
      conversation_id: conversationId,
      is_read: false
    });

    console.log('Message sent successfully:', message);
    return NextResponse.json(message, { status: 201 });
  } catch (error: any) {
    console.error('Send message error:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json({ message: error.message, error: error.toString() }, { status: 500 });
  }
}
