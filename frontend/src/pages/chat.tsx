import Head from 'next/head';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { Send, Trash2, Globe, Scale, User, Sparkles, AlertCircle } from 'lucide-react';
import clsx from 'clsx';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useChatStore } from '@/store/chatStore';
import { useLocationStore } from '@/store/locationStore';
import { chatApi } from '@/utils/api';
import type { ChatMessage } from '@/types';

const COUNTRIES = [
  { code: 'IN', name: 'India' },
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'AU', name: 'Australia' },
  { code: 'CA', name: 'Canada' },
  { code: 'SG', name: 'Singapore' },
  { code: 'AE', name: 'UAE' },
];

const FALLBACK_QUESTIONS: Record<string, string[]> = {
  IN: [
    'What are the fines under the Motor Vehicles Act 2019?',
    'How many demerit points before license suspension in India?',
    'Is it mandatory to have a PUC certificate?',
    'What is the fine for using a mobile phone while driving?',
  ],
  default: [
    'What are the penalties for drunk driving?',
    'How do I contest a traffic fine?',
    'What documents must I carry while driving?',
    'What happens if I miss the fine payment deadline?',
  ],
};

const MessageBubble: React.FC<{ msg: ChatMessage }> = ({ msg }) => {
  const isUser = msg.role === 'user';
  return (
    <div className={clsx('flex gap-3 animate-slide-up', isUser ? 'flex-row-reverse' : 'flex-row')}>
      <div className={clsx(
        'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
        isUser ? 'bg-primary-500/20 border border-primary-500/30' : 'bg-gradient-primary shadow-glow-sm',
      )}>
        {isUser ? <User className="w-4 h-4 text-primary-400" /> : <Scale className="w-4 h-4 text-white" />}
      </div>
      <div className={clsx(
        'max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
        isUser
          ? 'bg-primary-600/25 border border-primary-500/25 text-slate-100 rounded-tr-sm'
          : 'bg-surface-800 border border-white/6 text-slate-200 rounded-tl-sm',
      )}>
        <p className={clsx('text-[10px] font-semibold uppercase tracking-wider mb-1.5',
          isUser ? 'text-primary-400' : 'text-emerald-400'
        )}>
          {isUser ? 'You' : 'DriveLegal AI'}
        </p>
        <div className="whitespace-pre-wrap">{msg.content}</div>
        <p className="text-[10px] text-slate-500 mt-2 text-right">
          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
};

const TypingIndicator: React.FC = () => (
  <div className="flex gap-3 animate-fade-in">
    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center shadow-glow-sm">
      <Scale className="w-4 h-4 text-white" />
    </div>
    <div className="bg-surface-800 border border-white/6 rounded-2xl rounded-tl-sm px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 mb-2">DriveLegal AI</p>
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <span key={i} className="w-2 h-2 rounded-full bg-primary-400 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  </div>
);

const EmptyState: React.FC<{ questions: string[]; onAsk: (q: string) => void }> = ({ questions, onAsk }) => (
  <div className="flex flex-col items-center justify-center h-full text-center px-4 py-12 gap-6">
    <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow-md animate-float">
      <Scale className="w-8 h-8 text-white" />
    </div>
    <div>
      <h2 className="text-xl font-bold text-white mb-2">Ask DriveLegal AI</h2>
      <p className="text-slate-400 text-sm max-w-sm">
        Get instant, jurisdiction-specific answers about traffic laws, fines, and your legal rights.
      </p>
    </div>
    <div className="w-full max-w-md">
      <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-3">Suggested questions</p>
      <div className="flex flex-col gap-2">
        {questions.map((q, i) => (
          <button key={i} onClick={() => onAsk(q)}
            className="text-left px-4 py-2.5 glass-sm hover:bg-surface-700/60 hover:border-white/10 rounded-xl transition-all duration-200 text-sm text-slate-300 hover:text-slate-100 flex items-center gap-2 group">
            <Sparkles className="w-3.5 h-3.5 text-primary-400 flex-shrink-0 group-hover:scale-110 transition-transform" />
            {q}
          </button>
        ))}
      </div>
    </div>
  </div>
);

export default function ChatPage() {
  const router = useRouter();
  const { messages, isLoading, addMessage, setLoading, clearChat } = useChatStore();
  const { countryCode, countryName, setCountry } = useLocationStore();
  const [input, setInput]             = useState('');
  const [error, setError]             = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>(
    FALLBACK_QUESTIONS[countryCode] || FALLBACK_QUESTIONS.default
  );
  const bottomRef   = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isLoading]);

  useEffect(() => {
    const q = router.query.q as string | undefined;
    if (q && !input) setInput(q);
  }, [router.query.q]);

  useEffect(() => {
    chatApi.suggested(countryCode)
      .then((res) => { if (Array.isArray(res.data)) setSuggestions(res.data); })
      .catch(() => setSuggestions(FALLBACK_QUESTIONS[countryCode] || FALLBACK_QUESTIONS.default));
  }, [countryCode]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 140) + 'px';
  }, [input]);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;
    setError(null);
    setInput('');
    addMessage({ role: 'user', content: trimmed, timestamp: new Date() });
    setLoading(true);
    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    try {
      const res = await chatApi.sendMessage({
        message: trimmed,
        conversation_history: history,
        country_code: countryCode || undefined,
        language: 'en',
      });
      const reply = res.data?.response || res.data?.message || res.data;
      addMessage({
        role: 'assistant',
        content: typeof reply === 'string' ? reply : JSON.stringify(reply),
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
      setError(isAuthError ? 'Invalid AI key configured.' : 'Backend offline — showing placeholder response.');
    } finally {
      setLoading(false);
    }
  }, [isLoading, messages, countryCode, addMessage, setLoading]);

  return (
    <>
      <Head>
        <title>AI Legal Chat — DriveLegal</title>
        <meta name="description" content="Ask our AI traffic law assistant about violations, fines, and your legal rights." />
      </Head>

      <div className="flex flex-col h-[calc(100vh-4rem)]">
        {/* Top bar */}
        <div className="flex-shrink-0 border-b border-white/5 bg-surface-900/60 backdrop-blur-md px-4 py-3">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow-sm">
                <Scale className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-white leading-none">AI Legal Assistant</h1>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Powered by Claude · {messages.length} message{messages.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1.5 bg-surface-800 border border-white/8 rounded-lg px-2.5 py-1.5">
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                <select id="chat-country-select" value={countryCode}
                  onChange={(e) => { const c = COUNTRIES.find((c) => c.code === e.target.value); if (c) setCountry(c.code, c.name); }}
                  className="bg-transparent text-slate-300 text-xs font-medium focus:outline-none cursor-pointer">
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code} className="bg-surface-800">{c.code} — {c.name}</option>
                  ))}
                </select>
              </div>
              {messages.length > 0 && (
                <Button id="clear-chat-btn" variant="ghost" size="sm" icon={<Trash2 className="w-3.5 h-3.5" />} onClick={clearChat}>
                  <span className="hidden sm:inline">Clear</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="max-w-4xl mx-auto">
            {messages.length === 0
              ? <EmptyState questions={suggestions} onAsk={sendMessage} />
              : (
                <div className="flex flex-col gap-5">
                  {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}
                  {isLoading && <TypingIndicator />}
                  <div ref={bottomRef} />
                </div>
              )}
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="flex-shrink-0 border-t border-amber-500/20 bg-amber-500/5 px-4 py-2">
            <div className="max-w-4xl mx-auto flex items-center gap-2 text-xs text-amber-400">
              <AlertCircle className="w-3.5 h-3.5" />{error}
            </div>
          </div>
        )}

        {/* Suggestion chips */}
        {messages.length > 0 && !isLoading && (
          <div className="flex-shrink-0 border-t border-white/5 bg-surface-950/60 px-4 py-2 overflow-x-auto no-scrollbar">
            <div className="max-w-4xl mx-auto flex gap-2">
              {suggestions.slice(0, 3).map((q, i) => (
                <button key={i} onClick={() => sendMessage(q)}
                  className="flex-shrink-0 px-3 py-1.5 text-xs text-slate-400 bg-surface-800 hover:bg-surface-700 hover:text-slate-200 border border-white/6 rounded-full transition-all duration-200">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input bar */}
        <div className="flex-shrink-0 border-t border-white/5 bg-surface-950/80 backdrop-blur-xl px-4 py-4">
          <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }} className="max-w-4xl mx-auto">
            <div className="flex items-end gap-3 bg-surface-800 border border-white/8 rounded-2xl px-4 py-3 focus-within:border-primary-500/40 focus-within:shadow-glow-sm transition-all duration-200">
              <textarea
                id="chat-input" ref={textareaRef} value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
                placeholder={`Ask about traffic laws in ${countryName}…`}
                rows={1} disabled={isLoading}
                className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 resize-none focus:outline-none leading-relaxed"
                style={{ maxHeight: '140px' }}
              />
              <button id="chat-send-btn" type="submit" disabled={!input.trim() || isLoading}
                className={clsx(
                  'flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200',
                  input.trim() && !isLoading
                    ? 'bg-gradient-primary text-white shadow-glow-sm hover:brightness-110 active:scale-95'
                    : 'bg-surface-700 text-slate-500 cursor-not-allowed',
                )} aria-label="Send message">
                {isLoading ? <Spinner size="sm" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-center text-[10px] text-slate-600 mt-2">
              Press <kbd className="px-1 py-0.5 bg-surface-700 rounded text-slate-500">Enter</kbd> to send ·{' '}
              <kbd className="px-1 py-0.5 bg-surface-700 rounded text-slate-500">Shift+Enter</kbd> for new line
            </p>
          </form>
        </div>
      </div>
    </>
  );
}
