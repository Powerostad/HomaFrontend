import { Image as ImageIcon } from 'lucide-react';
import { Button } from '../ui/button';
import { useNavigate } from 'react-router-dom';

export function EmptyGallery() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center py-20 px-8 text-center gap-6">
      <div className="w-24 h-24 bg-secondary rounded-full flex items-center justify-center text-muted-foreground/40">
        <ImageIcon size={48} strokeWidth={1} />
      </div>
      
      <div className="flex flex-col gap-2 max-w-[280px]">
        <h3 className="text-[18px] font-bold text-foreground">هنوز نتیجه‌ای ذخیره نکردی</h3>
        <p className="text-[14px] text-muted-foreground leading-relaxed">
          با قابلیت Try-On می‌توانید محصولات را در فضای خود ببینید و طرح‌هایتان را اینجا ذخیره کنید.
        </p>
      </div>

      <Button 
        onClick={() => navigate('/studio/upload')}
        className="h-[56px] px-10 bg-foreground text-background rounded-full font-bold text-[14px] active:scale-95 transition-all shadow-lg"
      >
        شروع Try-On
      </Button>
    </div>
  );
}