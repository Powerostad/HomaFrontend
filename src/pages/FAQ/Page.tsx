import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import { useTranslation } from "react-i18next";

interface FAQItem {
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    question: "هما چیست؟",
    answer: "هما یک پلتفرم هوشمند تجسم مبلمان است که با استفاده از هوش مصنوعی به شما کمک می‌کند قبل از خرید، محصولات را در فضای واقعی خانه‌تان ببینید. کافیست یک عکس از اتاق خود بگیرید و مبلمان مورد نظرتان را انتخاب کنید، هما آن را در فضای شما قرار می‌دهد."
  },
  {
    question: "قابلیت تجسم (Try-On) چگونه کار می‌کند؟",
    answer: "شما یک عکس از اتاق خود آپلود می‌کنید و محصول مورد نظرتان را انتخاب می‌کنید. هوش مصنوعی هما با تحلیل فضا، نورپردازی و پرسپکتیو، محصول را به صورت واقع‌گرایانه در تصویر شما قرار می‌دهد. این کار در عرض چند ثانیه انجام می‌شود."
  },
  {
    question: "چه فرمت‌هایی برای تصاویر پشتیبانی می‌شود؟",
    answer: "هما از فرمت‌های رایج تصویر شامل JPG، JPEG و PNG پشتیبانی می‌کند. برای بهترین نتیجه، توصیه می‌کنیم تصاویر با کیفیت بالا و نورپردازی مناسب استفاده کنید. حداکثر حجم فایل ۱۰ مگابایت است."
  },
  {
    question: "آیا عکس اتاق من ذخیره می‌شود؟",
    answer: "حریم خصوصی شما برای ما اهمیت دارد. عکس‌های آپلود شده فقط برای پردازش استفاده می‌شوند و پس از تولید تصویر نهایی، از سرورهای ما حذف می‌شوند. تصاویر نهایی تجسم‌شده در گالری شخصی شما نگهداری می‌شوند."
  },
  {
    question: "تجسم چقدر دقیق است؟",
    answer: "هوش مصنوعی هما با استفاده از الگوریتم‌های پیشرفته، محصولات را با دقت بالایی در فضای شما قرار می‌دهد. البته توجه داشته باشید که تصویر نهایی یک پیش‌نمایش هنری است و ممکن است تفاوت‌های جزئی با واقعیت داشته باشد. برای اطمینان کامل، همیشه مشخصات فنی محصول را بررسی کنید."
  },
  {
    question: "آیا می‌توانم برای فضاهای تجاری استفاده کنم؟",
    answer: "بله، هما برای فضاهای مسکونی و تجاری قابل استفاده است. می‌توانید مبلمان را در دفتر کار، رستوران، هتل یا هر فضای دیگری تجسم کنید. برای پروژه‌های بزرگ تجاری، با تیم پشتیبانی ما تماس بگیرید."
  },
  {
    question: "چگونه می‌توانم با پشتیبانی تماس بگیرم؟",
    answer: "شما می‌توانید از طریق صفحه تماس با ما، ایمیل یا شبکه‌های اجتماعی با تیم پشتیبانی هما در ارتباط باشید. تیم ما در ساعات کاری پاسخگوی سوالات شما خواهد بود."
  },
  {
    question: "آیا استفاده از هما رایگان است؟",
    answer: "هما امکان تجسم رایگان با تعداد محدود در روز ارائه می‌دهد. برای استفاده نامحدود و دسترسی به امکانات پیشرفته، می‌توانید از اشتراک‌های ویژه استفاده کنید."
  }
];

function FAQAccordion({ item, isOpen, onToggle }: { item: FAQItem; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-black/[0.05] last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full py-6 flex items-center justify-between text-right gap-4 group"
      >
        <span className="font-medium text-[16px] md:text-[18px] text-black group-hover:text-black/70 transition-colors">
          {item.question}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="shrink-0"
        >
          <ChevronDown className="w-5 h-5 opacity-40" />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <p className="pb-6 text-[14px] md:text-[15px] leading-relaxed text-black/60">
              {item.answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FAQPage() {
  const { t } = useTranslation();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-surface-page flex flex-col" dir="rtl">
      <Header />

      <main className="flex-grow pt-32 pb-24 px-6 max-w-4xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-12"
        >
          {/* Header */}
          <div className="text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-black/[0.03] flex items-center justify-center mx-auto">
              <HelpCircle className="w-8 h-8 opacity-60" />
            </div>
            <h1 className="text-[32px] md:text-[42px] font-bold text-black leading-tight">
              {t('faq.title', 'سوالات متداول')}
            </h1>
            <p className="text-[16px] md:text-lg opacity-60 leading-relaxed max-w-2xl mx-auto">
              {t('faq.subtitle', 'پاسخ سوالات رایج درباره هما و نحوه استفاده از آن را اینجا بیابید.')}
            </p>
          </div>

          {/* FAQ List */}
          <div className="bg-white border border-black/[0.03] rounded-[24px] p-6 md:p-10 shadow-sm">
            {faqData.map((item, index) => (
              <FAQAccordion
                key={index}
                item={item}
                isOpen={openIndex === index}
                onToggle={() => handleToggle(index)}
              />
            ))}
          </div>

          {/* Contact CTA */}
          <div className="text-center pt-8">
            <p className="text-[14px] opacity-50 mb-4">
              {t('faq.moreQuestions', 'سوال دیگری دارید؟')}
            </p>
            <a
              href="/contact"
              className="inline-flex items-center gap-2 text-[14px] font-medium text-black border-b border-black/20 pb-1 hover:border-black transition-colors"
            >
              {t('faq.contactUs', 'با ما تماس بگیرید')}
            </a>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
