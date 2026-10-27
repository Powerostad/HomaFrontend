import { useSeo } from "@/hooks/useSeo";
import { useSiteTranslation } from '@/i18n/siteCopy';
import { Mail, MessageCircle, Send, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";
import { Footer } from "../../components/Footer";
import { Header } from "../../components/Header";

export function ContactPage() {
  const { siteText, siteValue, siteDirection } = useSiteTranslation();
  useSeo({
    title: siteText("تماس با ما"),
    description: siteText("راه‌های ارتباط با تیم HOMA."),
  });
  const contactMethods = [
    {
      icon: <Mail className="w-6 h-6" />,
      title: siteText("ایمیل پشتیبانی"),
      value: "FARBOD.LOTFI@PARSMEHRAGRO.COM",
      link: "mailto:FARBOD.LOTFI@PARSMEHRAGRO.COM"
    },
    {
      icon: <ShieldCheck className="w-6 h-6" />,
      title: siteText("واحد ضمانت و اعتماد"),
      value: siteText("پیش‌نمایش هوش مصنوعی جایگزین بررسی مشخصات نیست"),
      link: `/support?lang=${siteDirection() === 'ltr' ? 'en' : 'fa'}`
    }
  ];

  const faqs = [
    { q: siteText("آیا ابعاد محصولات در تصویر واقعی است؟"), a: siteText("تصویر تولیدشده پیش‌نمایش است. پیش از خرید ابعاد محصول و فضای خود را بررسی کنید.") },
    { q: siteText("چگونه می‌توانم از کیفیت متریال مطمئن شوم؟"), a: siteText("مشخصات و تصاویر محصول را بررسی کنید و درباره جنس و کیفیت از فروشنده بپرسید.") },
    { q: siteText("اگر محصول با دکور من هماهنگ نبود چه؟"), a: siteText("شرایط مرجوعی هر محصول را پیش از خرید از فروشنده همان محصول بپرسید.") }
  ];

  return (
    <div className="min-h-screen bg-[#FDFDFB] flex flex-col font-vazirmatn" dir={siteDirection()}>
      <Header />
      
      <main className="flex-grow pt-32 pb-24 px-6 max-w-5xl mx-auto w-full">
        <div className="space-y-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-8"
          >
            {/* Header Section */}
            <div className="space-y-4">
              <h1 className="text-[42px] font-bold text-black leading-tight">
                {siteText("مرکز پشتیبانی و اعتماد هُما")}</h1>
              <p className="text-lg opacity-60 leading-relaxed max-w-2xl mx-auto">
                {siteText("ما اینجا هستیم تا تجربه‌ی طراحی و خرید شما را به آرام‌ترین شکل ممکن رقم بزنیم. هُما فراتر از یک ابزار، همراه شما در خلق خانه است.")}</p>
            </div>

            {/* Contact Methods */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {siteValue(contactMethods.map((item, index) => (
                <motion.a
                  key={index}
                  href={item.link}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-white border border-black/[0.03] p-10 flex flex-col items-center gap-4 group rounded-[32px] shadow-sm shadow-black/[0.02]"
                >
                  <div className="w-14 h-14 rounded-full bg-black/[0.02] flex items-center justify-center text-black group-hover:bg-black group-hover:text-white transition-all duration-500">
                    {siteValue(item.icon)}
                  </div>
                  <h4 className="opacity-40 text-[12px] font-bold uppercase tracking-widest">{siteValue(item.title)}</h4>
                  <p className="font-bold text-[14px] md:text-[18px] tracking-tight" style={{ overflowWrap: 'anywhere' }}>{siteValue(item.value)}</p>
                </motion.a>
              )))}
            </div>

            {/* FAQ Center */}
            <div className="space-y-10 pt-10 text-start">
              <h2 className="text-[24px] font-bold text-black border-s-4 border-accent ps-4">{siteText("سوالات متداول (Smart FAQ)")}</h2>
              <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                {siteValue(faqs.map((faq, idx) => (
                  <div key={idx} className="p-6 bg-white border border-black/[0.02] rounded-[24px]">
                    <h4 className="font-bold text-[16px] text-black mb-2">{siteValue(faq.q)}</h4>
                    <p className="text-[14px] text-black/50 leading-relaxed">{siteValue(faq.a)}</p>
                  </div>
                )))}
              </div>
            </div>

            {/* Platforms */}
            <div className="pt-16 border-t border-black/[0.05]">
              <div className="flex flex-col items-center gap-6">
                <span className="text-sm font-medium opacity-50 uppercase tracking-widest">{siteText("پلتفرم‌های آنلاین")}</span>
                <div className="flex items-center gap-12">
                  <a href="#" className="flex flex-col items-center gap-2 group">
                    <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center group-hover:bg-[#25D366] group-hover:text-white transition-all duration-300">
                      <MessageCircle className="w-7 h-7" />
                    </div>
                    <span className="text-xs font-bold">{siteText("واتس‌اپ")}</span>
                  </a>
                  <a href="#" className="flex flex-col items-center gap-2 group">
                    <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center group-hover:bg-[#0088cc] group-hover:text-white transition-all duration-300">
                      <Send className="w-7 h-7" />
                    </div>
                    <span className="text-xs font-bold">{siteText("تلگرام")}</span>
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
