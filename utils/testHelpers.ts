/**
 * Test Helpers
 * توابع کمکی برای تست و debug
 */

import { analytics } from "./analytics";

/**
 * شبیه‌سازی یک فلو کامل از ورود تا خرید
 */
export async function simulateCompleteFlow(productId: string = "prod_rug_21902") {
  console.log("🎬 شروع شبیه‌سازی فلو کامل...");

  // 1. Entry
  analytics.track("Entry", {
    productId,
    utm_source: "instagram",
    utm_medium: "social",
  });

  // 2. Upload Start
  await delay(500);
  analytics.track("upload_start", { productId });

  // 3. Precheck Pass
  await delay(1000);
  analytics.track("precheck_pass", { productId });

  // 4. Upload Success
  await delay(2000);
  analytics.track("upload_success", {
    productId,
    ttfu: 3500,
  });

  // 5. View Result
  await delay(2000);
  analytics.track("view_result", {
    productId,
    processingTime: 2500,
    confidence: 0.92,
  });

  // 6. Click Purchase (50% chance)
  await delay(3000);
  if (Math.random() > 0.5) {
    analytics.track("click_purchase", { productId });
    console.log("✅ فلو با خرید تمام شد");
  } else {
    analytics.track("feedback", {
      productId,
      action: "save",
    });
    console.log("💾 فلو با ذخیره تمام شد");
  }

  console.log("🏁 شبیه‌سازی تمام شد");
}

/**
 * شبیه‌سازی چند کاربر همزمان
 */
export async function simulateMultipleUsers(count: number = 5) {
  console.log(`👥 شبیه‌سازی ${count} کاربر همزمان...`);

  const promises = [];
  for (let i = 0; i < count; i++) {
    promises.push(
      (async () => {
        await delay(Math.random() * 1000);
        await simulateCompleteFlow();
      })()
    );
  }

  await Promise.all(promises);
  console.log(`✅ ${count} کاربر شبیه‌سازی شدند`);
}

/**
 * شبیه‌سازی سناریوهای مختلف
 */
export async function simulateScenarios() {
  console.log("🎭 شروع شبیه‌سازی سناریوها...");

  // سناریو 1: موفق
  await simulateSuccessScenario();

  // سناریو 2: ناموفق (خطا)
  await simulateFailureScenario();

  // سناریو 3: retry
  await simulateRetryScenario();

  console.log("✅ همه سناریوها شبیه‌سازی شدند");
  analytics.logKPIReport();
}

/**
 * سناریو موفق
 */
async function simulateSuccessScenario() {
  const productId = "prod_rug_21902";

  analytics.track("Entry", { productId });
  await delay(500);

  analytics.track("upload_start", { productId });
  await delay(1000);

  analytics.track("precheck_pass", { productId });
  await delay(1500);

  analytics.track("upload_success", {
    productId,
    ttfu: 3000,
  });
  await delay(2000);

  analytics.track("view_result", {
    productId,
    processingTime: 2200,
    confidence: 0.95,
  });
  await delay(2000);

  analytics.track("click_purchase", { productId });

  console.log("✅ سناریو موفق کامل شد");
}

/**
 * سناریو ناموفق
 */
async function simulateFailureScenario() {
  const productId = "prod_rug_21902";

  analytics.track("Entry", { productId });
  await delay(500);

  analytics.track("upload_start", { productId });
  await delay(1000);

  analytics.track("upload_error", {
    productId,
    error: "network_timeout",
  });

  console.log("❌ سناریو ناموفق کامل شد");
}

/**
 * سناریو retry
 */
async function simulateRetryScenario() {
  const productId = "prod_rug_21902";

  analytics.track("Entry", { productId });
  await delay(500);

  analytics.track("upload_start", { productId });
  await delay(1000);

  // اولین تلاش ناموفق
  analytics.track("upload_error", {
    productId,
    error: "network_timeout",
  });
  await delay(1000);

  // retry
  analytics.track("retry_upload", {
    productId,
    reason: "error_recovery",
  });
  await delay(1000);

  // دومین تلاش موفق
  analytics.track("upload_success", {
    productId,
    ttfu: 5500,
  });
  await delay(2000);

  analytics.track("view_result", {
    productId,
    processingTime: 2400,
    confidence: 0.88,
  });

  console.log("🔄 سناریو retry کامل شد");
}

/**
 * تولید داده‌های تصادفی برای تست
 */
export function generateRandomMetrics() {
  console.log("🎲 تولید داده‌های تصادفی...");

  const productIds = [
    "prod_rug_21902",
    "prod_sofa_12345",
    "prod_chair_67890",
  ];

  // تولید 20 رویداد تصادفی
  for (let i = 0; i < 20; i++) {
    const productId = productIds[Math.floor(Math.random() * productIds.length)];
    const eventTypes = [
      "Entry",
      "upload_start",
      "upload_success",
      "view_result",
      "click_purchase",
    ];
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];

    analytics.track(eventType, {
      productId,
      random: Math.random(),
    });
  }

  console.log("✅ 20 رویداد تصادفی ایجاد شد");
  analytics.logKPIReport();
}

/**
 * نمایش آمار فعلی
 */
export function showCurrentStats() {
  console.log("\n📊 آمار فعلی:");
  analytics.logKPIReport();

  const events = analytics.getEvents();
  console.log(`\n📝 تعداد کل رویدادها: ${events.length}`);

  // گروه‌بندی بر اساس نوع رویداد
  const eventCounts: Record<string, number> = {};
  events.forEach((e) => {
    eventCounts[e.event] = (eventCounts[e.event] || 0) + 1;
  });

  console.log("\n📋 رویدادها بر اساس نوع:");
  Object.entries(eventCounts).forEach(([event, count]) => {
    console.log(`   ${event}: ${count}`);
  });
}

/**
 * پاک کردن همه داده‌ها
 */
export function clearAllData() {
  analytics.clearEvents();
  console.log("🗑️ همه داده‌ها پاک شدند");
}

/**
 * Helper: delay
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * دسترسی سریع برای استفاده در Console
 */
if (typeof window !== "undefined") {
  (window as any).homaTest = {
    simulateCompleteFlow,
    simulateMultipleUsers,
    simulateScenarios,
    generateRandomMetrics,
    showCurrentStats,
    clearAllData,
  };

  console.log(
    "%c🎯 HOMA Test Helpers آماده است!",
    "font-size: 16px; font-weight: bold; color: #E31E24"
  );
  console.log("برای استفاده:");
  console.log("  homaTest.simulateCompleteFlow()");
  console.log("  homaTest.simulateMultipleUsers(10)");
  console.log("  homaTest.simulateScenarios()");
  console.log("  homaTest.generateRandomMetrics()");
  console.log("  homaTest.showCurrentStats()");
  console.log("  homaTest.clearAllData()");
}
