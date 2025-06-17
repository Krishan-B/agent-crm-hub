
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Phone, Video, MoreVertical, Users, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  sender_name: string;
  timestamp: string;
  type: 'text' | 'system';
}

interface RealTimeCommunicationsProps {
  leadId?: string;
  leadName?: string;
}

export const RealTimeCommunications: React.FC<RealTimeCommunicationsProps> = ({
  leadId,
  leadName
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isOnline, setIsOnline] = useState(false);
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!leadId || !user) return;

    // Subscribe to real-time messages
    const channel = supabase
      .channel(`chat_${leadId}`)
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        setIsOnline(Object.keys(newState).length > 1);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
        setIsOnline(true);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
        setIsOnline(false);
      })
      .on('broadcast', { event: 'message' }, ({ payload }) => {
        setMessages(prev => [...prev, payload]);
      })
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.user_id !== user.id) {
          setTyping(payload.isTyping);
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: user.id,
            user_name: `${user.user_metadata?.first_name} ${user.user_metadata?.last_name}`,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [leadId, user]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !leadId || !user) return;

    const message: Message = {
      id: `msg_${Date.now()}`,
      content: newMessage,
      sender_id: user.id,
      sender_name: `${user.user_metadata?.first_name} ${user.user_metadata?.last_name}`,
      timestamp: new Date().toISOString(),
      type: 'text'
    };

    const channel = supabase.channel(`chat_${leadId}`);
    await channel.send({
      type: 'broadcast',
      event: 'message',
      payload: message
    });

    setMessages(prev => [...prev, message]);
    setNewMessage('');

    // Save message to database using 'note' type instead of 'chat'
    try {
      await supabase.from('communications').insert({
        lead_id: leadId,
        type: 'note',
        content: newMessage,
        status: 'sent',
        created_by: user.id
      });
    } catch (error) {
      console.error('Error saving message:', error);
    }
  };

  const handleTyping = () => {
    if (!leadId || !user) return;

    const channel = supabase.channel(`chat_${leadId}`);
    channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: { user_id: user.id, isTyping: true }
    });

    setTimeout(() => {
      channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: { user_id: user.id, isTyping: false }
      });
    }, 1000);
  };

  const initiateCall = () => {
    toast({
      title: "Call Feature",
      description: "Voice calling will be available in the next update.",
    });
  };

  const initiateVideoCall = () => {
    toast({
      title: "Video Call Feature", 
      description: "Video calling will be available in the next update.",
    });
  };

  return (
    <Card className="flex flex-col h-96">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Chat with {leadName || 'Lead'}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={isOnline ? "default" : "secondary"}>
              {isOnline ? "Online" : "Offline"}
            </Badge>
            <Button size="sm" variant="ghost" onClick={initiateCall}>
              <Phone className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={initiateVideoCall}>
              <Video className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Start a conversation with your lead</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-2 ${
                  message.sender_id === user?.id ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.sender_id !== user?.id && (
                  <Avatar className="w-6 h-6">
                    <AvatarFallback className="text-xs">
                      {message.sender_name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`max-w-xs px-3 py-2 rounded-lg ${
                    message.sender_id === user?.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))
          )}
          
          {typing && (
            <div className="flex items-center gap-2 text-gray-500">
              <div className="flex gap-1">
                <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <span className="text-xs">Typing...</span>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type a message..."
              className="flex-1"
            />
            <Button onClick={sendMessage} disabled={!newMessage.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RealTimeCommunications;
