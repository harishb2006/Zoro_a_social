import { NextRequest, NextResponse } from 'next/server';
import { MessageService } from '@/lib/db/services';
import { authenticate } from '@/lib/auth/middleware';

// GET /api/messages/requests - Get message requests
export async function GET(req: NextRequest) {
  try {
    const user = authenticate(req);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const rawRequests = await MessageService.getMessageRequests(user.id);
    
    // Transform data to match frontend interface
    const requests = rawRequests.map((req: any) => ({
      conversationId: req.id,
      sender: {
        id: req.sender_id,
        username: req.sender_username,
        profilePic: req.sender_profile_pic
      },
      lastMessage: req.last_message,
      lastMessageAt: req.last_message_time
    }));
    
    return NextResponse.json(requests);
  } catch (error: any) {
    console.error('Get message requests error:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
