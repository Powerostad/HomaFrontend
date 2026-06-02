import { motion } from "motion/react";
import { FileText } from "lucide-react";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import { useTranslation } from "react-i18next";
import { useSeo } from "@/hooks/useSeo";

interface TermsSection {
  title: string;
  content: string[];
}

const termsData: TermsSection[] = [
  {
    title: "شرح خدمات",
    content: [
      "هما یک پلتفرم تجسم مبلمان مبتنی بر هوش مصنوعی است که به کاربران امکان می‌دهد محصولات را در فضای واقعی خود مشاهده کنند.",
      "این سرویس صرفاً جهت پیش‌نمایش و کمک به تصمیم‌گیری خرید ارائه می‌شود و تضمینی برای تطابق کامل تصویر تولیدشده با واقعیت نیست.",
      "تصاویر تولیدشده توسط هوش مصنوعی جنبه هنری دارند و ممکن است تفاوت‌هایی با ابعاد و رنگ واقعی محصولات داشته باشند."
    ]
  },
  {
    title: "مسئولیت‌های کاربر",
    content: [
      "کاربران موظف‌اند از تصاویری استفاده کنند که حق استفاده از آن‌ها را دارند و از آپلود تصاویر نامناسب یا غیرقانونی خودداری کنند.",
      "اطلاعات حساب کاربری باید صحیح و به‌روز باشد.",
      "کاربران مسئول حفظ امنیت حساب کاربری خود هستند.",
      "استفاده از خدمات هما برای اهداف غیرقانونی یا نقض حقوق دیگران ممنوع است."
    ]
  },
  {
    title: "استفاده از تصاویر و حریم خصوصی",
    content: [
      "تصاویر آپلود‌شده توسط کاربران صرفاً برای پردازش و تولید تصویر نهایی استفاده می‌شوند.",
      "تصاویر اتاق پس از پردازش از سرورها حذف می‌شوند مگر اینکه کاربر درخواست ذخیره‌سازی داشته باشد.",
      "تصاویر نهایی تجسم‌شده در گالری شخصی کاربر ذخیره می‌شوند و کاربر می‌تواند آن‌ها را حذف کند.",
      "هما متعهد به حفظ حریم خصوصی کاربران است و اطلاعات شخصی را با اشخاص ثالث به اشتراک نمی‌گذارد مگر با رضایت کاربر یا الزام قانونی."
    ]
  },
  {
    title: "مالکیت معنوی",
    content: [
      "کلیه حقوق مالکیت معنوی پلتفرم هما شامل نرم‌افزار، طراحی و محتوا متعلق به شرکت است.",
      "کاربران حق استفاده شخصی از تصاویر تولیدشده را دارند.",
      "استفاده تجاری از تصاویر تولیدشده بدون مجوز کتبی ممنوع است.",
      "تصاویر محصولات متعلق به فروشندگان مربوطه است و حقوق آن‌ها محفوظ می‌باشد."
    ]
  },
  {
    title: "محدودیت مسئولیت",
    content: [
      "هما تضمینی برای دقت کامل تصاویر تولیدشده نمی‌دهد و کاربران باید قبل از خرید، مشخصات فنی محصولات را بررسی کنند.",
      "هما مسئولیتی در قبال تصمیمات خرید کاربران بر اساس تصاویر تولیدشده ندارد.",
      "در صورت بروز هرگونه خسارت ناشی از استفاده از سرویس، مسئولیت هما محدود به هزینه‌های پرداختی کاربر است.",
      "هما مسئولیتی در قبال کیفیت، قیمت یا خدمات محصولات فروشندگان ندارد."
    ]
  },
  {
    title: "تغییرات در قوانین",
    content: [
      "هما حق دارد این قوانین و مقررات را در هر زمان تغییر دهد.",
      "تغییرات از طریق وب‌سایت اطلاع‌رسانی می‌شود و ادامه استفاده از خدمات به منزله پذیرش قوانین جدید است.",
      "کاربران توصیه می‌شوند به صورت دوره‌ای این صفحه را مرور کنند."
    ]
  },
  {
    title: "اطلاعات تماس",
    content: [
      "برای سوالات، پیشنهادات یا شکایات می‌توانید از طریق صفحه تماس با ما ارتباط برقرار کنید.",
      "تیم پشتیبانی هما در اسرع وقت به درخواست‌های شما رسیدگی خواهد کرد."
    ]
  }
];

export function TermsPage() {
  useSeo({
    title: 'قوانین و مقررات',
    description: 'قوانین و مقررات استفاده از پلتفرم HOMA.',
  });
  const { t } = useTranslation();

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
              <FileText className="w-8 h-8 opacity-60" />
            </div>
            <h1 className="text-[32px] md:text-[42px] font-bold text-black leading-tight">
              {t('terms.title', 'قوانین و مقررات')}
            </h1>
            <p className="text-[16px] md:text-lg opacity-60 leading-relaxed max-w-2xl mx-auto">
              {t('terms.subtitle', 'لطفاً قبل از استفاده از خدمات هما، این قوانین را به دقت مطالعه کنید.')}
            </p>
            <p className="text-[13px] opacity-40">
              {t('terms.lastUpdate', 'آخرین به‌روزرسانی: دی ۱۴۰۴')}
            </p>
          </div>

          {/* Terms Content */}
          <div className="bg-white border border-black/[0.03] rounded-[24px] p-6 md:p-10 shadow-sm space-y-10">
            {termsData.map((section, index) => (
              <section key={index} className="space-y-4">
                <h2 className="text-[18px] md:text-[20px] font-bold text-black border-r-4 border-black/10 pr-4">
                  {index + 1}. {section.title}
                </h2>
                <ul className="space-y-3 pr-4">
                  {section.content.map((item, itemIndex) => (
                    <li
                      key={itemIndex}
                      className="text-[14px] md:text-[15px] leading-relaxed text-black/60 flex gap-3"
                    >
                      <span className="text-black/20 shrink-0">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          {/* Contact CTA */}
          <div className="text-center pt-8">
            <p className="text-[14px] opacity-50 mb-4">
              {t('terms.questions', 'سوالی درباره قوانین دارید؟')}
            </p>
            <a
              href="/contact"
              className="inline-flex items-center gap-2 text-[14px] font-medium text-black border-b border-black/20 pb-1 hover:border-black transition-colors"
            >
              {t('terms.contactUs', 'با ما تماس بگیرید')}
            </a>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
