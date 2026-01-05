/**
 * Brand Colors Showcase
 * نمایش رنگ‌های برند HOMA
 * برای مشاهده: Shift + Ctrl + B
 */

import { useEffect, useState } from "react";
import { Card } from "./ui/card";
import { SimpleButton as Button } from "./SimpleButton";

export function BrandColors() {
  const [isVisible, setIsVisible] = useState(false);

  // برای باز کردن با کلید میانبر: Shift + Ctrl + B
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.shiftKey && e.ctrlKey && e.key === "B") {
        setIsVisible((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

  if (!isVisible) return null;

  const colors = [
    {
      name: "Accent (قرمز برند)",
      value: "#E31E24",
      varName: "--accent",
      tailwind: "bg-accent",
      textColor: "text-white",
      description: "رنگ اصلی برند HOMA - برای دکمه‌ها، لینک‌ها و تاکیدها",
    },
    {
      name: "Accent Light (بژ/کرم)",
      value: "#F5E6D3",
      varName: "--accent-light",
      tailwind: "bg-accent-light",
      textColor: "text-gray-900",
      description: "رنگ ثانویه - برای پس‌زمینه‌ها و المان‌های ملایم",
    },
  ];

  const usageExamples = [
    {
      title: "دکمه اصلی",
      code: '<Button className="bg-accent text-accent-foreground">خرید</Button>',
      preview: (
        <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
          خرید
        </Button>
      ),
    },
    {
      title: "Badge",
      code: '<span className="bg-accent text-accent-foreground px-3 py-1 rounded-full">جدید</span>',
      preview: (
        <span className="bg-accent text-accent-foreground px-3 py-1 rounded-full text-sm">
          جدید
        </span>
      ),
    },
    {
      title: "پس‌زمینه ملایم",
      code: '<div className="bg-accent-light p-4">محتوا</div>',
      preview: (
        <div className="bg-accent-light text-accent-light-foreground p-4 rounded-lg">
          محتوای با پس‌زمینه بژ
        </div>
      ),
    },
    {
      title: "Border Accent",
      code: '<div className="border-2 border-accent">محتوا</div>',
      preview: (
        <div className="border-2 border-accent p-4 rounded-lg">
          کادر با رنگ برند
        </div>
      ),
    },
  ];

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={() => setIsVisible(false)}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl">🎨 رنگ‌های برند HOMA</h2>
              <p className="text-gray-500 mt-1">
                راهنمای استفاده از رنگ‌های برند
              </p>
            </div>
            <Button
              onClick={() => setIsVisible(false)}
              variant="ghost"
              size="sm"
            >
              ✕
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Color Swatches */}
          <div>
            <h3 className="mb-4 text-gray-700">🎨 پالت رنگ</h3>
            <div className="grid gap-4">
              {colors.map((color) => (
                <Card key={color.varName} className="p-6">
                  <div className="flex gap-6 items-start">
                    {/* Color Swatch */}
                    <div
                      className={`w-24 h-24 rounded-xl ${color.tailwind} flex items-center justify-center shadow-lg`}
                      style={{ backgroundColor: color.value }}
                    >
                      <span className={color.textColor}>Aa</span>
                    </div>

                    {/* Color Info */}
                    <div className="flex-1">
                      <h4 className="mb-2">{color.name}</h4>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div>
                          <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                            {color.value}
                          </span>
                        </div>
                        <div>
                          CSS Variable:{" "}
                          <code className="bg-gray-100 px-2 py-1 rounded">
                            var({color.varName})
                          </code>
                        </div>
                        <div>
                          Tailwind:{" "}
                          <code className="bg-gray-100 px-2 py-1 rounded">
                            {color.tailwind}
                          </code>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 mt-3">
                        {color.description}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Usage Examples */}
          <div>
            <h3 className="mb-4 text-gray-700">💡 نمونه‌های استفاده</h3>
            <div className="grid gap-4">
              {usageExamples.map((example, idx) => (
                <Card key={idx} className="p-6">
                  <div className="flex gap-6 items-center">
                    {/* Preview */}
                    <div className="flex-1 flex items-center justify-center p-4 bg-gray-50 rounded-lg min-h-[80px]">
                      {example.preview}
                    </div>

                    {/* Code */}
                    <div className="flex-1">
                      <h4 className="text-sm mb-2">{example.title}</h4>
                      <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg text-xs overflow-x-auto">
                        {example.code}
                      </pre>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Guidelines */}
          <div>
            <h3 className="mb-4 text-gray-700">📐 دستورالعمل‌ها</h3>
            <Card className="p-6">
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="mb-2">✅ موارد پیشنهادی</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-600 mr-4">
                    <li>استفاده از accent برای دکمه‌های اصلی و CTA</li>
                    <li>استفاده از accent-light برای پس‌زمینه‌های ملایم</li>
                    <li>ترکیب رنگ‌ها با خنثی‌ها (سفید، خاکستری) برای تعادل</li>
                    <li>استفاده از رنگ برند برای برندینگ و تشخیص</li>
                  </ul>
                </div>
                <div>
                  <h4 className="mb-2">❌ موارد پرهیز</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-600 mr-4">
                    <li>استفاده بیش از حد از accent (خستگی بصری)</li>
                    <li>ترکیب accent با رنگ‌های مشابه (قرمز/نارنجی)</li>
                    <li>استفاده از رنگ‌های سفارشی به جای متغیرهای تعریف شده</li>
                    <li>نادیده گرفتن کنتراست رنگ برای accessibility</li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>

          {/* Copy to Clipboard */}
          <div>
            <h3 className="mb-4 text-gray-700">📋 کپی سریع</h3>
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText("#E31E24");
                  alert("رنگ accent کپی شد!");
                }}
              >
                📋 کپی #E31E24
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText("#F5E6D3");
                  alert("رنگ accent-light کپی شد!");
                }}
              >
                📋 کپی #F5E6D3
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4 text-center text-sm text-gray-500">
          برای بستن، Shift + Ctrl + B را فشار دهید یا روی پس‌زمینه کلیک کنید
        </div>
      </div>
    </div>
  );
}