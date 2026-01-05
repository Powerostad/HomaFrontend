import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { SimpleButton as Button } from "./SimpleButton";
import { analytics, type KPIMetrics } from "../utils/analytics";

export function AdminDashboard() {
  const [kpis, setKpis] = useState<KPIMetrics | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // برای باز کردن داشبورد با کلید میانبر: Shift + Ctrl + K
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.shiftKey && e.ctrlKey && e.key === "K") {
        setIsVisible((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

  useEffect(() => {
    if (isVisible) {
      updateMetrics();
      // به‌روزرسانی هر 5 ثانیه
      const interval = setInterval(updateMetrics, 5000);
      return () => clearInterval(interval);
    }
  }, [isVisible]);

  const updateMetrics = () => {
    const metrics = analytics.calculateKPIs();
    setKpis(metrics);
  };

  if (!isVisible) return null;

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
              <h2 className="text-2xl">📊 داشبورد تحلیل</h2>
              <p className="text-gray-500 mt-1">
                آمار و تحلیل عملکرد پلتفرم HOMA
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

        <div className="p-6 space-y-6">
          {kpis && (
            <>
              {/* Upload Metrics */}
              <div>
                <h3 className="mb-4 text-gray-700">📤 آمار آپلود</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <MetricCard
                    label="شروع آپلود"
                    value={kpis.uploadStarted}
                    color="blue"
                  />
                  <MetricCard
                    label="آپلود موفق"
                    value={kpis.uploadCompleted}
                    color="green"
                  />
                  <MetricCard
                    label="آپلود ناموفق"
                    value={kpis.uploadFailed}
                    color="red"
                  />
                  <MetricCard
                    label="نرخ موفقیت"
                    value={`${(kpis.uploadRate * 100).toFixed(1)}%`}
                    color="purple"
                  />
                </div>
              </div>

              {/* Time Metrics */}
              <div>
                <h3 className="mb-4 text-gray-700">⏱️ آمار زمان</h3>
                <div className="grid grid-cols-2 gap-4">
                  <MetricCard
                    label="میانگین زمان آپلود"
                    value={`${(kpis.averageTTFU / 1000).toFixed(2)}s`}
                    color="blue"
                  />
                  <MetricCard
                    label="میانگین پردازش"
                    value={`${(kpis.averageProcessingTime / 1000).toFixed(2)}s`}
                    color="blue"
                  />
                </div>
              </div>

              {/* Conversion Metrics */}
              <div>
                <h3 className="mb-4 text-gray-700">💰 آمار تبدیل</h3>
                <div className="grid grid-cols-3 gap-4">
                  <MetricCard
                    label="مشاهده نتایج"
                    value={kpis.visualizationViews}
                    color="blue"
                  />
                  <MetricCard
                    label="کلیک خرید"
                    value={kpis.purchaseClicks}
                    color="green"
                  />
                  <MetricCard
                    label="نرخ تبدیل"
                    value={`${(kpis.conversionRate * 100).toFixed(1)}%`}
                    color="purple"
                    highlight={kpis.conversionRate > 0.1}
                  />
                </div>
              </div>

              {/* Quality Metrics */}
              <div>
                <h3 className="mb-4 text-gray-700">✅ آمار کیفیت</h3>
                <div className="grid grid-cols-2 gap-4">
                  <MetricCard
                    label="نرخ قبولی precheck"
                    value={`${(kpis.precheckPassRate * 100).toFixed(1)}%`}
                    color="green"
                  />
                  <MetricCard
                    label="نرخ موفقیت placement"
                    value={`${(kpis.placementSuccessRate * 100).toFixed(1)}%`}
                    color="green"
                  />
                </div>
              </div>

              {/* Engagement Metrics */}
              <div>
                <h3 className="mb-4 text-gray-700">🎯 آمار تعامل</h3>
                <div className="grid grid-cols-3 gap-4">
                  <MetricCard
                    label="فیدبک ثبت شده"
                    value={kpis.feedbackSubmitted}
                    color="blue"
                  />
                  <MetricCard
                    label="اشتراک‌گذاری"
                    value={kpis.shareClicks}
                    color="purple"
                  />
                  <MetricCard
                    label="تلاش مجدد"
                    value={kpis.retryAttempts}
                    color="orange"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <Button onClick={updateMetrics} variant="outline" size="sm">
                  🔄 به‌روزرسانی
                </Button>
                <Button
                  onClick={() => {
                    analytics.logKPIReport();
                    alert("گزارش در console نمایش داده شد");
                  }}
                  variant="outline"
                  size="sm"
                >
                  📋 نمایش در Console
                </Button>
                <Button
                  onClick={() => {
                    analytics.clearEvents();
                    updateMetrics();
                    alert("رویدادها پاک شدند");
                  }}
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                >
                  🗑️ پاک کردن داده‌ها
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4 text-center text-sm text-gray-500">
          برای بستن، Shift + Ctrl + K را فشار دهید یا روی پس‌زمینه کلیک کنید
        </div>
      </div>
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: string | number;
  color: "blue" | "green" | "red" | "purple" | "orange";
  highlight?: boolean;
}

function MetricCard({ label, value, color, highlight }: MetricCardProps) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    green: "bg-green-50 text-green-700 border-green-200",
    red: "bg-red-50 text-red-700 border-red-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
    orange: "bg-orange-50 text-orange-700 border-orange-200",
  };

  return (
    <Card
      className={`p-4 ${colorClasses[color]} border ${
        highlight ? "ring-2 ring-purple-500" : ""
      }`}
    >
      <div className="text-sm text-gray-600 mb-1">{label}</div>
      <div className="text-2xl">{value}</div>
    </Card>
  );
}