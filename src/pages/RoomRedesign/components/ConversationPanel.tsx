import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AuthenticatedImage } from '@/components/figma/AuthenticatedImage';
import { ArrowDown, Check, Loader2, MessageSquare, Send, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ChatMessage, ChipGroup } from '../types';

/** A small, escaped text renderer: paragraphs, lists, headings and emphasis only.
 * Model text never becomes HTML, links, code or an executable instruction. */
function Emphasis({ text }: { text: string }) {
  return <>{text.split(/(\*\*[^*]+\*\*)/g).map((part, index) => part.startsWith('**') && part.endsWith('**')
    ? <strong key={index}>{part.slice(2, -2)}</strong> : part)}</>;
}

export function MessageText({ text }: { text: string }) {
  const blocks = text.trim().split(/\n\s*\n/);
  return <div className="studio-message-text">{blocks.map((block, index) => {
    const lines = block.split('\n');
    const list = lines.every(line => /^\s*(?:[-*•]|\d+[.)]|[۰-۹]+[.)])\s+/.test(line));
    if (list) return <ul key={index}>{lines.map((line, itemIndex) => <li key={itemIndex}><Emphasis text={line.replace(/^\s*(?:[-*•]|\d+[.)]|[۰-۹]+[.)])\s+/, '')} /></li>)}</ul>;
    return <div key={index}>{lines.map((line, lineIndex) => /^#{1,4}\s/.test(line)
      ? <p className="studio-message-heading" key={lineIndex}><Emphasis text={line.replace(/^#{1,4}\s+/, '')} /></p>
      : <p key={lineIndex}><Emphasis text={line} /></p>)}</div>;
  })}</div>;
}

interface Props {
  messages: ChatMessage[];
  chipGroups: ChipGroup[];
  busy: boolean;
  failed?: boolean;
  active?: boolean;
  statusText: string;
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onSelectChip: (groupId: string, chipId: string) => void;
}

export function ConversationPanel({ messages, chipGroups, busy, failed = false, active = true, statusText, value, onChange, onSend, onSelectChip }: Props) {
  const { t } = useTranslation();
  const logRef = useRef<HTMLDivElement>(null);
  const following = useRef(true);
  const [showJump, setShowJump] = useState(false);
  const latest = messages[messages.length - 1]?.text;
  const scrollToLatest = () => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
    following.current = true;
    setShowJump(false);
  };
  useEffect(() => {
    if (!active) return;
    const log = logRef.current;
    if (following.current && log) log.scrollTop = log.scrollHeight;
    else if (log) setShowJump(true);
  }, [messages.length, latest, chipGroups, busy, active]);
  useEffect(() => {
    const focus = () => document.getElementById('studio-message')?.focus();
    window.addEventListener('homa-redesign-focus-composer', focus);
    return () => window.removeEventListener('homa-redesign-focus-composer', focus);
  }, []);

  return <>
    <div className="studio-conversation-heading">
      <span className="studio-homa-mark" aria-hidden="true"><Sparkles size={20} /></span>
      <div><h2>{t('studioChat.chat')}</h2><p>{t('studioChat.chatHint')}</p></div>
    </div>
    <div className="studio-chat-log" ref={logRef} role="log" aria-label={t('studioChat.chat')} aria-live="polite" aria-relevant="additions" onScroll={() => {
      const log = logRef.current;
      if (log) {
        following.current = log.scrollHeight - log.scrollTop - log.clientHeight < 80;
        if (following.current) setShowJump(false);
      }
    }}>
      {!messages.length && <div className="studio-chat-empty"><MessageSquare size={28} aria-hidden="true" /><p>{t(busy ? 'studioChat.emptyChatProcessing' : failed ? 'studioChat.emptyChatFailed' : 'studioChat.emptyChat')}</p></div>}
      {messages.map(message => message.kind === 'event'
        ? <p className={`studio-chat-event studio-chat-event--${message.eventKind ?? 'info'}`} key={message.id}>{message.text}</p>
        : <article key={message.id} className={`studio-message studio-message--${message.role}`}>
          <div className="studio-message-author"><span>{t(message.role === 'user' ? 'studioChat.you' : 'studioChat.homa')}</span>{message.time && <time>{message.time}</time>}</div>
          {message.imageUrl && <AuthenticatedImage className="studio-message-photo" src={message.imageUrl} alt={t('redesignJourney.original')} onLoad={() => { if (following.current) scrollToLatest(); }} />}
          {message.text && <MessageText text={message.text} />}
        </article>)}
      {!!chipGroups.length && <div className="studio-questions"><h3>{t('studioChat.questions')}</h3>{chipGroups.map(group => <div className="studio-question" key={group.id}>
        {group.question && <p>{group.question}</p>}
        {group.recommendation && <p className="studio-question-hint"><Check size={16} aria-hidden="true" />{t('studioChat.suggested')}: {group.recommendation}{group.recommendationReason && ` · ${group.recommendationReason}`}</p>}
        <div className="studio-question-options">{group.chips.map(chip => <Button key={chip.id} variant="outline" disabled={busy} aria-pressed={group.selectedId === chip.id} onClick={() => onSelectChip(group.id, chip.id)}>{chip.label}</Button>)}</div>
      </div>)}</div>}
      {busy && <div className="studio-processing" role="status"><Loader2 size={18} className="studio-spinner" aria-hidden="true" /><span>{statusText}</span></div>}
    </div>
    {!busy && !failed && messages.length > 0 && <div className="studio-edit-examples">
      <span className="studio-edit-examples-label">{t('studio.v9.editExamplesLabel', 'می‌تونی از اینجا شروع کنی:')}</span>
      <div className="studio-edit-examples-options">
        {[
          t('studio.v9.editExampleColor', 'رنگ‌ها رو متفاوت پیشنهاد بده'),
          t('studio.v9.editExampleProducts', 'محصولات دیگه‌ای پیشنهاد بده'),
          t('studio.v9.editExampleLayout', 'چیدمان اتاق رو دوباره بررسی کن'),
        ].map(example => <button key={example} type="button" onClick={() => { onChange(example); document.getElementById('studio-message')?.focus(); }}>{example}</button>)}
      </div>
    </div>}
    {showJump && <Button variant="secondary" className="studio-jump" onClick={scrollToLatest}><ArrowDown size={16} />{t('studioChat.jump')}</Button>}
    <form className="studio-composer" onSubmit={event => { event.preventDefault(); if (!busy && value.trim()) onSend(); }}>
      <label htmlFor="studio-message">{t('studioChat.message')}</label>
      <div className="studio-composer-field">
        <Textarea id="studio-message" value={value} onChange={event => onChange(event.target.value)} placeholder={t('studioChat.placeholder')} rows={2} onKeyDown={event => {
          if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing && !busy && value.trim()) { event.preventDefault(); onSend(); }
        }} />
        <Button type="submit" disabled={busy || !value.trim()} className="studio-send" aria-label={t('studioChat.send')}><Send size={18} aria-hidden="true" /><span>{t('studioChat.send')}</span></Button>
      </div>
      <p>{t(busy ? 'studioChat.busyHint' : 'studioChat.composerHint')}</p>
    </form>
  </>;
}
