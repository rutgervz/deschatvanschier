'use client';

import { useState, useRef, useEffect } from 'react';
import type { Plan, Enrichment } from '@/lib/plans';

interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatInterfaceProps {
  plan: Plan;
  onEnrichment?: (enrichments: Omit<Enrichment, 'id' | 'created_at'>[]) => void;
  onCanvasUpdate?: () => void;
  onCostsUpdate?: () => void;
}

export default function ChatInterface({ plan, onEnrichment, onCanvasUpdate, onCostsUpdate }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load chat history from DB
  useEffect(() => {
    setHistoryLoaded(false);
    fetch(`/api/history?planId=${plan.id}`)
      .then(r => r.json())
      .then(data => {
        if (data.messages && data.messages.length > 0) {
          setMessages(data.messages.map((m: { role: string; content: string }) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content
              .replace(/---CANVAS---[\s\S]*?---EINDE_CANVAS---/g, '')
              .replace(/---KOSTEN---[\s\S]*?---EINDE_KOSTEN---/g, '')
              .replace(/---VERRIJKING---[\s\S]*?---EINDE---/g, '')
              .trim(),
          })));
        } else {
          setMessages([]);
        }
        setHistoryLoaded(true);
      })
      .catch(() => setHistoryLoaded(true));
  }, [plan.id]);

  useEffect(() => {
    if (historyLoaded) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, historyLoaded]);

  useEffect(() => {
    if (historyLoaded) inputRef.current?.focus();
  }, [historyLoaded]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg: ChatMsg = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan.id,
          messages: newMessages,
          plan,
        }),
      });

      const data = await res.json();

      if (data.error) {
        setMessages([...newMessages, { role: 'assistant', content: data.error }]);
      } else {
        setMessages([...newMessages, { role: 'assistant', content: data.message }]);
        if (data.enrichments?.length > 0 && onEnrichment) {
          onEnrichment(data.enrichments);
        }
        if (data.canvasUpdated && onCanvasUpdate) onCanvasUpdate();
        if (data.costsUpdated && onCostsUpdate) onCostsUpdate();
      }
    } catch {
      setMessages([...newMessages, {
        role: 'assistant',
        content: 'Er ging iets mis met de verbinding. Probeer het opnieuw.'
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const suggestions = [
    'Welke vergunningen heb ik nodig?',
    'Reken de kosten opnieuw door',
    'Wat zijn vergelijkbare projecten?',
    'Hoe organiseren we het onderhoud?',
  ];

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '420px',
      border: '1px solid var(--border)', borderRadius: '12px',
      overflow: 'hidden', background: 'var(--sand)',
    }}>
      <div style={{
        flex: 1, overflowY: 'auto', padding: '16px',
        display: 'flex', flexDirection: 'column', gap: '12px',
      }}>
        {!historyLoaded && (
          <div style={{ textAlign: 'center', padding: '20px', fontSize: 13, color: 'var(--ink-h)' }}>
            Chatgeschiedenis laden...
          </div>
        )}
        {historyLoaded && messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <p style={{ fontSize: '13px', color: 'var(--ink-m)', marginBottom: '16px' }}>
              Stel een vraag over dit plan. De AI helpt met kosten, vergunningen en haalbaarheid en verrijkt het canvas automatisch.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center' }}>
              {suggestions.map((s, i) => (
                <button key={i} onClick={() => { setInput(s); inputRef.current?.focus(); }}
                  style={{
                    fontSize: '12px', padding: '6px 12px', borderRadius: '16px',
                    border: '1px solid var(--border-h)', background: 'var(--wh)',
                    color: 'var(--ink-l)', cursor: 'pointer', fontFamily: 'inherit',
                  }}>{s}</button>
              ))}
            </div>
          </div>
        )}
        {historyLoaded && messages.length > 0 && (
          <div style={{
            textAlign: 'center', padding: '4px 0 8px', fontSize: 11, color: 'var(--ink-h)',
            borderBottom: '1px solid var(--border)', marginBottom: 4,
          }}>
            {messages.filter(m => m.role === 'user').length} berichten in dit gesprek
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} style={{
            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '85%', padding: '10px 14px',
            borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
            background: msg.role === 'user' ? 'var(--sea)' : 'var(--wh)',
            color: msg.role === 'user' ? '#fff' : 'var(--ink-l)',
            fontSize: '14px', lineHeight: '1.55', whiteSpace: 'pre-wrap',
            border: msg.role === 'assistant' ? '1px solid var(--border)' : 'none',
          }}>{msg.content}</div>
        ))}
        {loading && (
          <div style={{
            alignSelf: 'flex-start', padding: '10px 14px',
            borderRadius: '14px 14px 14px 4px', background: 'var(--wh)',
            border: '1px solid var(--border)', fontSize: '14px', color: 'var(--ink-h)',
          }}>
            <span style={{ animation: 'pulse 1.5s infinite' }}>Denkt na...</span>
            <style>{`@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div style={{
        padding: '12px 16px', borderTop: '1px solid var(--border)',
        background: 'var(--wh)', display: 'flex', gap: '8px', alignItems: 'flex-end',
      }}>
        <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value.slice(0, 2000))}
          onKeyDown={handleKeyDown} placeholder="Stel een vraag over dit plan..." rows={1}
          maxLength={2000}
          style={{
            flex: 1, resize: 'none', border: '1px solid var(--border-h)',
            borderRadius: '10px', padding: '10px 14px', fontSize: '14px',
            fontFamily: 'inherit', background: 'var(--sand)', color: 'var(--ink)',
            outline: 'none', minHeight: '40px', maxHeight: '120px',
          }}
          onInput={e => {
            const t = e.target as HTMLTextAreaElement;
            t.style.height = 'auto';
            t.style.height = Math.min(t.scrollHeight, 120) + 'px';
          }}
        />
        {input.length > 1800 && <span style={{ fontSize: 10, color: input.length >= 2000 ? '#c53030' : 'var(--ink-h)', alignSelf: 'center', flexShrink: 0 }}>{input.length}/2000</span>}
        <button onClick={sendMessage} disabled={!input.trim() || loading}
          style={{
            padding: '10px 18px', borderRadius: '10px', border: 'none',
            background: input.trim() && !loading ? 'var(--sea)' : 'var(--ink-h)',
            color: '#fff', fontSize: '14px', fontWeight: 500, fontFamily: 'inherit',
            cursor: input.trim() && !loading ? 'pointer' : 'default', whiteSpace: 'nowrap',
          }}>Verstuur</button>
      </div>
    </div>
  );
}
