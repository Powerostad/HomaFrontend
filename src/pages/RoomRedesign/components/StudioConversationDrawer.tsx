import * as Dialog from '@radix-ui/react-dialog';
import { useRef, type ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { ConversationPanel } from './ConversationPanel';

/** One composer across desktop and mobile. Closed history never receives focus. */
export function StudioConversationDrawer({ open, onOpenChange, compact, error, onRetry, ...conversation }: ComponentProps<typeof ConversationPanel> & {
  open: boolean; onOpenChange: (open: boolean) => void; compact: boolean;
  error?: string | null; onRetry?: () => void;
}) {
  const { t, i18n } = useTranslation();
  const returnFocus = useRef<HTMLElement | null>(null);
  const content = useRef<HTMLDivElement>(null);
  return <Dialog.Root open={open} onOpenChange={onOpenChange} modal={compact}>
    <Dialog.Portal>
      {compact && <Dialog.Overlay className="studio-conversation-backdrop" />}
      <Dialog.Content ref={content} className="studio-conversation-drawer" dir={i18n.dir()}
        onOpenAutoFocus={event => {
          returnFocus.current = document.activeElement as HTMLElement;
          // Opening on touch must not cover the room with the soft keyboard.
          if (compact) { event.preventDefault(); content.current?.focus(); }
        }}
        onCloseAutoFocus={event => { event.preventDefault(); returnFocus.current?.focus(); }}>
        <div className="studio-conversation-drawer-heading">
          <Dialog.Title>{t('studioChat.chat')}</Dialog.Title>
          <Dialog.Close asChild><Button variant="outline">{t('studioFlow.backToDesign')}</Button></Dialog.Close>
        </div>
        <Dialog.Description className="sr-only">{t('studioChat.chatHint')}</Dialog.Description>
        {error && <div className="studio-flow-error" role="alert"><p>{error}</p><Button variant="outline" disabled={conversation.busy} onClick={onRetry}>{t('redesignJourney.retry')}</Button></div>}
        <ConversationPanel {...conversation} active={open} />
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
