'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';

interface Conversation {
  conversationId: string;
  otherUser: {
    id: string;
    username: string;
    profilePic: string | null;
  };
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

interface FollowedUser {
  id: string;
  username: string;
  profilePic: string | null;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export default function MessagesPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [followedUsers, setFollowedUsers] = useState<FollowedUser[]>([]);
  const [showFollowedList, setShowFollowedList] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Selected conversation state
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!user) return;
    
    fetchConversations();
    fetchFollowedUsers();
    
    // Polling only when window is focused - every 5 seconds (less aggressive)
    let interval: NodeJS.Timeout;
    
    const startPolling = () => {
      interval = setInterval(() => {
        if (document.visibilityState === 'visible') {
          fetchConversations();
          if (selectedConversation) {
            fetchMessages(selectedConversation.conversationId);
          }
        }
      }, 5000); // 5 seconds - more reasonable
    };
    
    startPolling();
    
    // Stop polling when tab is not visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchConversations();
        if (selectedConversation) {
          fetchMessages(selectedConversation.conversationId);
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [selectedConversation, user]);

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/messages');
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      setLoadingMessages(true);
      const response = await fetch(`/api/messages/${conversationId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    fetchMessages(conversation.conversationId);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || sending) return;

    const messageContent = newMessage.trim();
    setSending(true);
    setNewMessage('');

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: selectedConversation.otherUser.id,
          content: messageContent
        }),
      });

      if (response.ok) {
        // Immediately fetch only messages (not conversations to reduce load)
        await fetchMessages(selectedConversation.conversationId);
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to send message');
        setNewMessage(messageContent);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
      setNewMessage(messageContent);
    } finally {
      setSending(false);
    }
  };

  const handleStartNewChat = (followedUser: FollowedUser) => {
    if (!user) return;
    
    // Check if conversation already exists
    const existingConv = conversations.find(c => c.otherUser.id === followedUser.id);
    
    if (existingConv) {
      setSelectedConversation(existingConv);
      fetchMessages(existingConv.conversationId);
    } else {
      // Create conversation ID for new chat (smaller ID first)
      const ids = [user.id, followedUser.id].sort();
      const tempConv: Conversation = {
        conversationId: `${ids[0]}-${ids[1]}`,
        otherUser: {
          id: followedUser.id,
          username: followedUser.username,
          profilePic: followedUser.profilePic
        },
        lastMessage: null,
        lastMessageAt: null,
        unreadCount: 0
      };
      setSelectedConversation(tempConv);
      setMessages([]);
    }
    setShowFollowedList(false);
  };

  const fetchFollowedUsers = async () => {
    try {
      const response = await fetch('/api/users/following');
      if (response.ok) {
        const data = await response.json();
        setFollowedUsers(data);
      }
    } catch (error) {
      console.error('Error fetching followed users:', error);
    }
  };

  const formatTimestamp = (timestamp: string | null) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (days > 7) {
      return date.toLocaleDateString();
    } else if (days > 0) {
      return `${days}d`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else if (minutes > 0) {
      return `${minutes}m`;
    } else {
      return 'now';
    }
  };

  const getInitials = (username: string) => {
    return username.substring(0, 2).toUpperCase();
  };

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white text-gray-900">
      {/* Left Sidebar - Chat List */}
      <div className="w-96 border-r border-gray-200 flex flex-col bg-white">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white">
          <h1 className="text-xl font-semibold text-gray-900">Messages</h1>
          <button
            onClick={() => setShowFollowedList(!showFollowedList)}
            className="p-2 hover:bg-gray-100 rounded-full transition text-gray-700"
            title="New message"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {/* New Message Dropdown */}
        {showFollowedList && (
          <div className="border-b border-gray-200 bg-white max-h-64 overflow-y-auto">
            <div className="p-3 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-gray-900">New Message</h3>
                <button
                  onClick={() => setShowFollowedList(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            {followedUsers.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                <p>You don&apos;t follow anyone yet</p>
                <p className="text-xs mt-1 text-gray-400">Go to Explore to find people to follow</p>
              </div>
            ) : (
              followedUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleStartNewChat(user)}
                  className="w-full p-3 hover:bg-gray-50 flex items-center gap-3 transition text-gray-900"
                >
                  {user.profilePic ? (
                    <Image
                      src={user.profilePic}
                      alt={user.username}
                      width={48}
                      height={48}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-semibold text-white">
                      {getInitials(user.username)}
                    </div>
                  )}
                  <div className="text-left">
                    <p className="font-medium">{user.username}</p>
                    <p className="text-xs text-gray-500">Following</p>
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-sm font-medium">No messages yet</p>
              <p className="text-xs mt-2 text-gray-400">Message people you follow</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.conversationId}
                onClick={() => handleSelectConversation(conv)}
                className={`w-full p-4 hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100 transition ${
                  selectedConversation?.conversationId === conv.conversationId ? 'bg-gray-100' : ''
                }`}
              >
                {conv.otherUser.profilePic ? (
                  <Image
                    src={conv.otherUser.profilePic}
                    alt={conv.otherUser.username}
                    width={56}
                    height={56}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-lg font-semibold text-white">
                    {getInitials(conv.otherUser.username)}
                  </div>
                )}
                <div className="flex-1 text-left">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-900">{conv.otherUser.username}</span>
                    <span className="text-xs text-gray-500">
                      {formatTimestamp(conv.lastMessageAt)}
                    </span>
                  </div>
                  <p className={`text-sm mt-1 truncate ${conv.unreadCount > 0 ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>
                    {conv.lastMessage || 'Start a conversation'}
                  </p>
                </div>
                {conv.unreadCount > 0 && (
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right Side - Conversation View */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {selectedConversation.otherUser.profilePic ? (
                  <Image
                    src={selectedConversation.otherUser.profilePic}
                    alt={selectedConversation.otherUser.username}
                    width={40}
                    height={40}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-semibold text-white">
                    {getInitials(selectedConversation.otherUser.username)}
                  </div>
                )}
                <button
                  onClick={() => router.push(`/profile/${selectedConversation.otherUser.id}`)}
                  className="font-semibold text-gray-900 hover:text-gray-600 transition"
                >
                  {selectedConversation.otherUser.username}
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  {selectedConversation.otherUser.profilePic ? (
                    <Image
                      src={selectedConversation.otherUser.profilePic}
                      alt={selectedConversation.otherUser.username}
                      width={80}
                      height={80}
                      className="rounded-full object-cover border-4 border-gray-200 mb-4"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl font-semibold text-white border-4 border-gray-200 mb-4">
                      {getInitials(selectedConversation.otherUser.username)}
                    </div>
                  )}
                  <p className="text-gray-900 font-semibold text-lg">{selectedConversation.otherUser.username}</p>
                  <p className="text-gray-500 text-sm mt-1">
                    Send a message to start the conversation
                  </p>
                </div>
              ) : (
                <>
                  {messages.map((msg) => {
                    const isOwn = user && msg.sender_id === user.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                            isOwn
                              ? 'bg-blue-500 text-white'
                              : 'bg-white text-gray-900 border border-gray-200'
                          }`}
                        >
                          <p className="text-sm break-words">{msg.content}</p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={`Message ${selectedConversation.otherUser.username}...`}
                  disabled={sending}
                  autoFocus
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm text-gray-900 disabled:bg-gray-100 transition-all"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className={`p-3 rounded-full transition-all ${
                    newMessage.trim() && !sending
                      ? 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
                      : 'text-gray-300'
                  }`}
                >
                  {sending ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  ) : (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                    </svg>
                  )}
                </button>
              </form>
            </div>
          </>
        ) : (
          // Empty state when no conversation selected
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="w-24 h-24 rounded-full border-4 border-gray-200 flex items-center justify-center mb-6">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold mb-2 text-gray-900">Your Messages</h2>
            <p className="text-gray-500 mb-6 text-center max-w-sm">
              Send messages to people you follow
            </p>
            <button
              onClick={() => setShowFollowedList(true)}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition"
            >
              Send Message
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
