import { useSiteTranslation } from '@/i18n/siteCopy';
import { useTranslation } from 'react-i18next';
import {
  SimpleDialog as Dialog,
  SimpleDialogContent as DialogContent,
  SimpleDialogDescription as DialogDescription,
  SimpleDialogHeader as DialogHeader,
  SimpleDialogTitle as DialogTitle,
} from './SimpleDialog';

interface TermsModalProps { open: boolean; onClose: () => void }

export function TermsModal({ open, onClose }: TermsModalProps) {
  const { siteText, siteDirection } = useSiteTranslation();
  const { i18n } = useTranslation();
  const language = i18n.language?.startsWith('en') ? 'en' : 'fa';
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto bg-white rounded-3xl border-gray-200">
        <DialogHeader>
          <DialogTitle>{siteText('شرایط استفاده و حریم خصوصی')}</DialogTitle>
          <DialogDescription>{siteText('این صفحات پیش‌نویس برای بازبینی هستند.')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-5 text-gray-600 leading-relaxed" dir={siteDirection()}>
          <p>{siteText('برای مطالعه جزئیات پردازش داده‌ها و شرایط HOMA، صفحات زیر را ببینید. تصویر هوش مصنوعی پیش‌نمایش است؛ ابعاد و مشخصات محصول را با فروشنده بررسی کنید.')}</p>
          <a className="block underline" href={`/privacy?lang=${language}`}>{siteText('حریم خصوصی')}</a>
          <a className="block underline" href={`/terms?lang=${language}`}>{siteText('شرایط استفاده')}</a>
          <a className="block underline" href="mailto:FARBOD.LOTFI@PARSMEHRAGRO.COM">FARBOD.LOTFI@PARSMEHRAGRO.COM</a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
