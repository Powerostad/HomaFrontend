import { motion } from "motion/react";
import { Phone, ShieldCheck, MessageCircle, Send } from "lucide-react";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import { useSeo } from "@/hooks/useSeo";

export function ContactPage() {
  useSeo({
    title: 'تماس با ما',
    description: 'راه‌های ارتباط با تیم HOMA.',
  });
  const contactMethods = [
    {
      icon: <Phone className="w-6 h-6" />,
      title: "تماس با کارشناس طراحی",
      value: "۰۲۱-۸۸۸۸۴۴۴۴",
      link: "tel:+982188884444"
    },
    {
      icon: <ShieldCheck className="w-6 h-6" />,
      title: "واحد ضمانت و اعتماد",
      value: "تضمین ۱۰۰٪ تطابق با AI",
      link: "#"
    }
  ];

  const faqs = [
    { q: "آیا ابعاد محصولات در تصویر واقعی است؟", a: "بله، هوش مصنوعی هما با کالیبره کردن لنز دوربین شما، محصولات را با دقت میلی‌متری در فضا جایگذاری می‌کند." },
    { q: "چگونه می‌توانم از کیفیت متریال مطمئن شوم؟", a: "تمامی محصولات دارای شناسنامه اصالت هستند و شما می‌توانید در بخش جزئیات محصول، ویدیوهای نمای نزدیک از بافت پارچه و چوب را مشاهده کنید." },
    { q: "اگر محصول با دکور من هماهنگ نبود چه؟", a: "ما سرویس بازگشت بی‌قید و شرط ۷ روزه داریم، هرچند دقت AI هما احتمال عدم هماهنگی را به زیر ۵٪ رسانده است." }
  ];

  return (
    <div className="min-h-screen bg-[#FDFDFB] flex flex-col font-vazirmatn" dir="rtl">
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
                مرکز پشتیبانی و اعتماد هُما
              </h1>
              <p className="text-lg opacity-60 leading-relaxed max-w-2xl mx-auto">
                ما اینجا هستیم تا تجربه‌ی طراحی و خرید شما را به آرام‌ترین شکل ممکن رقم بزنیم. هُما فراتر از یک ابزار، همراه شما در خلق خانه است.
              </p>
            </div>

            {/* Contact Methods */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {contactMethods.map((item, index) => (
                <motion.a
                  key={index}
                  href={item.link}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-white border border-black/[0.03] p-10 flex flex-col items-center gap-4 group rounded-[32px] shadow-sm shadow-black/[0.02]"
                >
                  <div className="w-14 h-14 rounded-full bg-black/[0.02] flex items-center justify-center text-black group-hover:bg-black group-hover:text-white transition-all duration-500">
                    {item.icon}
                  </div>
                  <h4 className="opacity-40 text-[12px] font-bold uppercase tracking-widest">{item.title}</h4>
                  <p className="font-bold text-[20px] tracking-tight">{item.value}</p>
                </motion.a>
              ))}
            </div>

            {/* FAQ Center */}
            <div className="space-y-10 pt-10 text-start">
              <h2 className="text-[24px] font-bold text-black border-r-4 border-accent pr-4">سوالات متداول (Smart FAQ)</h2>
              <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                {faqs.map((faq, idx) => (
                  <div key={idx} className="p-6 bg-white border border-black/[0.02] rounded-[24px]">
                    <h4 className="font-bold text-[16px] text-black mb-2">{faq.q}</h4>
                    <p className="text-[14px] text-black/50 leading-relaxed">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Platforms */}
            <div className="pt-16 border-t border-black/[0.05]">
              <div className="flex flex-col items-center gap-6">
                <span className="text-sm font-medium opacity-50 uppercase tracking-widest">پلتفرم‌های آنلاین</span>
                <div className="flex items-center gap-12">
                  <a href="#" className="flex flex-col items-center gap-2 group">
                    <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center group-hover:bg-[#25D366] group-hover:text-white transition-all duration-300">
                      <MessageCircle className="w-7 h-7" />
                    </div>
                    <span className="text-xs font-bold">واتس‌اپ</span>
                  </a>
                  <a href="#" className="flex flex-col items-center gap-2 group">
                    <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center group-hover:bg-[#0088cc] group-hover:text-white transition-all duration-300">
                      <Send className="w-7 h-7" />
                    </div>
                    <span className="text-xs font-bold">تلگرام</span>
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