/**
 * Analytics & KPI Tracking Service
 * ردیابی و تحلیل رفتار کاربران و KPIs
 */

export interface AnalyticsEvent {
  event: string;
  timestamp: number;
  sessionId: string;
  productId?: string;
  metadata?: Record<string, any>;
}

export interface KPIMetrics {
  // Upload Metrics
  uploadStarted: number;
  uploadCompleted: number;
  uploadFailed: number;
  uploadRate: number; // uploadCompleted / uploadStarted

  // Time Metrics
  averageTTFU: number; // Time to First Upload
  averageProcessingTime: number;

  // Conversion Metrics
  visualizationViews: number;
  purchaseClicks: number;
  conversionRate: number; // purchaseClicks / visualizationViews

  // Quality Metrics
  precheckPassRate: number;
  placementSuccessRate: number;

  // Engagement Metrics
  feedbackSubmitted: number;
  shareClicks: number;
  retryAttempts: number;
}

class AnalyticsService {
  private events: AnalyticsEvent[] = [];
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeTracking();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeTracking() {
    // در production، اینجا باید به analytics platform متصل شود
    // مثلاً: Google Analytics, Mixpanel, Amplitude, یا Supabase Analytics
    console.log('[Analytics] سرویس تحلیل آماده است', {
      sessionId: this.sessionId,
    });
  }

  /**
   * ثبت یک رویداد
   */
  track(event: string, metadata?: Record<string, any>) {
    const analyticsEvent: AnalyticsEvent = {
      event,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      productId: metadata?.productId,
      metadata,
    };

    this.events.push(analyticsEvent);

    console.log('[Analytics] رویداد ثبت شد:', {
      event,
      sessionId: this.sessionId,
      metadata,
    });

    // در production، ارسال به backend
    // this.sendToBackend(analyticsEvent);
  }

  /**
   * محاسبه KPI metrics
   */
  calculateKPIs(): KPIMetrics {
    const uploadStarted = this.events.filter((e) => e.event === 'upload_start').length;
    const uploadCompleted = this.events.filter((e) => e.event === 'upload_success').length;
    const uploadFailed = this.events.filter((e) => e.event === 'upload_error').length;

    const visualizationViews = this.events.filter((e) => e.event === 'view_result').length;
    const purchaseClicks = this.events.filter((e) => e.event === 'click_purchase').length;

    const precheckPass = this.events.filter((e) => e.event === 'precheck_pass').length;
    const precheckTotal = this.events.filter((e) => e.event.startsWith('precheck')).length;

    const feedbackEvents = this.events.filter((e) => e.event === 'feedback').length;
    const shareClicks = this.events.filter(
      (e) => e.event === 'feedback' && e.metadata?.action === 'share'
    ).length;
    const retryAttempts = this.events.filter((e) => e.event === 'retry_upload').length;

    // محاسبه میانگین TTFU
    const ttfuEvents = this.events.filter((e) => e.metadata?.ttfu);
    const averageTTFU =
      ttfuEvents.length > 0
        ? ttfuEvents.reduce((sum, e) => sum + (e.metadata?.ttfu || 0), 0) / ttfuEvents.length
        : 0;

    // محاسبه میانگین زمان پردازش
    const processingEvents = this.events.filter((e) => e.metadata?.processingTime);
    const averageProcessingTime =
      processingEvents.length > 0
        ? processingEvents.reduce((sum, e) => sum + (e.metadata?.processingTime || 0), 0) /
          processingEvents.length
        : 0;

    return {
      uploadStarted,
      uploadCompleted,
      uploadFailed,
      uploadRate: uploadStarted > 0 ? uploadCompleted / uploadStarted : 0,

      averageTTFU,
      averageProcessingTime,

      visualizationViews,
      purchaseClicks,
      conversionRate: visualizationViews > 0 ? purchaseClicks / visualizationViews : 0,

      precheckPassRate: precheckTotal > 0 ? precheckPass / precheckTotal : 0,
      placementSuccessRate: 0.85, // در حالت واقعی از backend می‌آید

      feedbackSubmitted: feedbackEvents,
      shareClicks,
      retryAttempts,
    };
  }

  /**
   * دریافت همه رویدادها
   */
  getEvents(): AnalyticsEvent[] {
    return [...this.events];
  }

  /**
   * دریافت رویدادهای یک محصول خاص
   */
  getEventsByProduct(productId: string): AnalyticsEvent[] {
    return this.events.filter((e) => e.productId === productId);
  }

  /**
   * پاک کردن رویدادها
   */
  clearEvents() {
    this.events = [];
    console.log('[Analytics] رویدادها پاک شدند');
  }

  /**
   * دریافت session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * ارسال به backend (placeholder)
   */
  private async sendToBackend(event: AnalyticsEvent) {
    // در production، این تابع باید رویداد را به backend ارسال کند
    // مثلاً با استفاده از fetch یا Supabase
    
    // مثال:
    // await fetch('/api/analytics', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(event),
    // });
  }

  /**
   * نمایش گزارش KPIs در console
   */
  logKPIReport() {
    const kpis = this.calculateKPIs();
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 گزارش KPI Metrics');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📤 Upload Metrics:');
    console.log(`   - شروع آپلود: ${kpis.uploadStarted}`);
    console.log(`   - آپلود موفق: ${kpis.uploadCompleted}`);
    console.log(`   - آپلود ناموفق: ${kpis.uploadFailed}`);
    console.log(`   - نرخ موفقیت: ${(kpis.uploadRate * 100).toFixed(1)}%`);
    console.log('');
    console.log('⏱️ Time Metrics:');
    console.log(`   - میانگین TTFU: ${(kpis.averageTTFU / 1000).toFixed(2)}s`);
    console.log(`   - میانگین پردازش: ${(kpis.averageProcessingTime / 1000).toFixed(2)}s`);
    console.log('');
    console.log('💰 Conversion Metrics:');
    console.log(`   - مشاهده نتایج: ${kpis.visualizationViews}`);
    console.log(`   - کلیک خرید: ${kpis.purchaseClicks}`);
    console.log(`   - نرخ تبدیل: ${(kpis.conversionRate * 100).toFixed(1)}%`);
    console.log('');
    console.log('✅ Quality Metrics:');
    console.log(`   - نرخ قبولی precheck: ${(kpis.precheckPassRate * 100).toFixed(1)}%`);
    console.log(`   - نرخ موفقیت placement: ${(kpis.placementSuccessRate * 100).toFixed(1)}%`);
    console.log('');
    console.log('🎯 Engagement Metrics:');
    console.log(`   - فیدبک ثبت شده: ${kpis.feedbackSubmitted}`);
    console.log(`   - اشتراک‌گذاری: ${kpis.shareClicks}`);
    console.log(`   - تلاش مجدد: ${kpis.retryAttempts}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }
}

// Singleton instance
export const analytics = new AnalyticsService();

// Helper functions
export function trackEvent(event: string, metadata?: Record<string, any>) {
  analytics.track(event, metadata);
}

export function getKPIMetrics(): KPIMetrics {
  return analytics.calculateKPIs();
}

export function getSessionId(): string {
  return analytics.getSessionId();
}

export function logKPIReport() {
  analytics.logKPIReport();
}
