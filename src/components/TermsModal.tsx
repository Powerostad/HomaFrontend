import {
  SimpleDialog as Dialog,
  SimpleDialogContent as DialogContent,
  SimpleDialogDescription as DialogDescription,
  SimpleDialogHeader as DialogHeader,
  SimpleDialogTitle as DialogTitle,
} from "./SimpleDialog";

interface TermsModalProps {
  open: boolean;
  onClose: () => void;
}

export function TermsModal({ open, onClose }: TermsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto bg-white rounded-3xl border-gray-200">
        <DialogHeader>
          <DialogTitle className="text-gray-900">شرایط استفاده و حریم خصوصی</DialogTitle>
          <DialogDescription className="text-gray-600">
            لطفاً این شرایط را قبل از استفاده از سرویس ما با دقت بخوانید.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-5 text-gray-900">
          <section>
            <h4 className="text-gray-900 mb-2">پذیرش شرایط</h4>
            <p className="text-gray-600 leading-relaxed">
              با بارگذاری تصاویر به هوم ویژن / آتلیو هوش مصنوعی، شما این شرایط استفاده را می‌پذیرید. 
              اگر موافق نیستید، لطفاً از سرویس ما استفاده نکنید.
            </p>
          </section>

          <section>
            <h4 className="text-gray-900 mb-2">بارگذاری و پردازش تصویر</h4>
            <p className="text-gray-600 leading-relaxed">
              شما تمام حقوق تصاویری را که بارگذاری می‌کنید حفظ می‌کنید. با بارگذاری، شما به ما اجازه می‌دهید 
              تا تصاویر شما را با استفاده از فناوری هوش مصنوعی خود به منظور ارائه سرویس تبدیل پردازش کنیم.
            </p>
          </section>

          <section>
            <h4 className="text-gray-900 mb-2">حریم خصوصی و امنیت داده</h4>
            <p className="text-gray-600 leading-relaxed">
              ما حریم خصوصی شما را جدی می‌گیریم. تصاویر بارگذاری شده شما به صورت ایمن پردازش می‌شوند و 
              با اشخاص ثالث به اشتراک گذاشته نمی‌شوند. تصاویر به طور موقت برای پردازش ذخیره می‌شوند 
              و ممکن است پس از ۳۰ روز حذف شوند.
            </p>
          </section>

          <section>
            <h4 className="text-gray-900 mb-2">استفاده مجاز</h4>
            <p className="text-gray-600 leading-relaxed">
              شما موافقت می‌کنید که تصاویری حاوی محتوای غیرقانونی، نقض حقوق مالکیت معنوی، 
              یا به هر نحو نامناسب بارگذاری نکنید. ما حق حذف هر محتوایی که این شرایط را نقض کند، 
              محفوظ می‌داریم.
            </p>
          </section>

          <section>
            <h4 className="text-gray-900 mb-2">در دسترس بودن سرویس</h4>
            <p className="text-gray-600 leading-relaxed">
              در حالی که ما تلاش می‌کنیم تا سرویس مداوم ارائه دهیم، دسترسی بدون وقفه را تضمین نمی‌کنیم. 
              ما این حق را محفوظ می‌داریم که سرویس را در هر زمان تغییر دهیم یا متوقف کنیم.
            </p>
          </section>

          <section>
            <h4 className="text-gray-900 mb-2">تماس</h4>
            <p className="text-gray-600 leading-relaxed">
              برای سوالات در مورد این شرایط یا رویه‌های حریم خصوصی ما، لطفاً با ما تماس بگیرید: 
              privacy@attelio.ai
            </p>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}