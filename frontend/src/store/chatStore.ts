import { create } from 'zustand';
import type { ChatMessage } from '@/types';

interface ChatState {
  messages:     ChatMessage[];
  isLoading:    boolean;
  sessionId:    string | null;
  addMessage:   (msg: ChatMessage) => void;
  setLoading:   (v: boolean) => void;
  setSessionId: (id: string) => void;
  clearChat:    () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages:     [],
  isLoading:    false,
  sessionId:    null,
  addMessage:   (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  setLoading:   (v)   => set({ isLoading: v }),
  setSessionId: (id)  => set({ sessionId: id }),
  clearChat:    ()    => set({ messages: [], sessionId: null }),
}));
