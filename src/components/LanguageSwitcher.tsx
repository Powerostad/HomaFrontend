import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { languages, updateDocumentLanguage, type LanguageCode } from '@/i18n/config';
import { useSiteTranslation } from '@/i18n/siteCopy';
import { Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface LanguageSwitcherProps {
  variant?: 'default' | 'compact' | 'full';
  className?: string;
}

export function LanguageSwitcher({ variant = 'default', className = '' }: LanguageSwitcherProps) {
  const { siteValue } = useSiteTranslation();
  const { i18n } = useTranslation();
  const currentLanguage = languages.find((lang) => lang.code === i18n.language) || languages[0];

  const handleLanguageChange = (langCode: LanguageCode) => {
    i18n.changeLanguage(langCode);
    updateDocumentLanguage(langCode);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={variant === 'compact' ? 'icon' : 'default'}
          className={`gap-2 ${className}`}
        >
          <Globe className="h-4 w-4" />
          {siteValue(variant !== 'compact' && (
            <span className="text-sm">{siteValue(currentLanguage.name)}</span>
          ))}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[140px]">
        {siteValue(languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={`cursor-pointer justify-between ${
              lang.code === i18n.language ? 'bg-surface-elevated' : ''
            }`}
          >
            <span
              style={{
                fontFamily: lang.dir === 'rtl' ? 'Vazirmatn, sans-serif' : 'Inter, sans-serif',
              }}
            >
              {siteValue(lang.name)}
            </span>
            {siteValue(lang.code === i18n.language && (
              <span className="text-brand-primary">✓</span>
            ))}
          </DropdownMenuItem>
        )))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default LanguageSwitcher;
