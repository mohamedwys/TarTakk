import { conversationsAPI } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

interface UnreadCountContextType {
  totalUnreadCount: number;
  refreshUnreadCount: () => Promise<void>;
}

const UnreadCountContext = createContext<UnreadCountContextType | undefined>(undefined);

export const useUnreadCount = () => {
  const context = useContext(UnreadCountContext);
  if (!context) {
    throw new Error('useUnreadCount must be used within UnreadCountProvider');
  }
  return context;
};

export const UnreadCountProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const { user, token } = useAuth();

  const refreshUnreadCount = async () => {
    if (!token) return;

    try {
      const response = await conversationsAPI.getConversations();
      const total = response.conversations.reduce(
        (sum: number, conv: any) => sum + (conv.unreadCount || 0),
        0
      );
      setTotalUnreadCount(total);
    } catch (error) {
      console.error('Failed to refresh unread count:', error);
    }
  };

  useEffect(() => {
    refreshUnreadCount();
  }, [token]);

  useEffect(() => {
    if (!user) return;

    // Supabase Realtime: the update_conversation_on_message trigger
    // bumps each conversation's unread counter on every new message,
    // and markAsRead resets the current user's side. Both fire UPDATE
    // events on `conversations`, so refreshing on each event keeps the
    // total in sync without subscribing to every individual message.
    //
    // RLS already restricts which conversations this client can see.
    const channel = supabase
      .channel(`unread:${user._id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
        },
        () => {
          refreshUnreadCount();
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('📡 unread channel error:', status);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return (
    <UnreadCountContext.Provider value={{ totalUnreadCount, refreshUnreadCount }}>
      {children}
    </UnreadCountContext.Provider>
  );
};
