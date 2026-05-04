import { useCallback } from 'react';
import { useChatStore } from '@/store/chatStore';
import { useLocationStore } from '@/store/locationStore';
import { chatApi } from '@/utils/api';

export function useChat() {
  const { messages, isLoading, addMessage, setLoading, clearChat } = useChatStore();
  const { countryCode } = useLocationStore();

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      addMessage({ role: 'user', content: trimmed, timestamp: new Date() });
      setLoading(true);

      const history = messages.map((m) => ({ role: m.role, content: m.content }));

      try {
        const res = await chatApi.sendMessage({
          message:              trimmed,
          conversation_history: history,
          country_code:         countryCode || undefined,
          language:             'en',
        });
        const reply = res.data?.response || res.data?.message || res.data;
        addMessage({
          role:      'assistant',
          content:   typeof reply === 'string' ? reply : JSON.stringify(reply),
          timestamp: new Date(),
        });
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const isAuthError = errorMessage.toLowerCase().includes('invalid x-api-key') ||
                            errorMessage.toLowerCase().includes('authentication_error');
        addMessage({
          role: 'assistant',
          content: isAuthError
            ? `⚠️ The AI backend received an invalid Anthropic API key.\n\nPlease configure a valid ANTHROPIC_API_KEY or GEMINI_API_KEY in backend .env and restart the server.\n\nYour question: "${trimmed}"`
            : `⚠️ The AI backend isn't reachable right now.\n\nYour question: "${trimmed}"\n\nStart the backend at localhost:8000 with your ANTHROPIC_API_KEY configured to get live answers.`,
          timestamp: new Date(),
        });
      } finally {
        setLoading(false);
      }
    },
    [isLoading, messages, countryCode, addMessage, setLoading],
  );

  return { messages, isLoading, sendMessage, clearChat };
}
