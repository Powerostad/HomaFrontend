/**
 * Mock URL utility for testing product-aware flow
 * Use this to simulate Instagram link entry
 */

export function setMockProductUrl(productId: string, utmSource: string = "instagram") {
  const url = new URL(window.location.href);
  url.searchParams.set('productId', productId);
  url.searchParams.set('utm_source', utmSource);
  url.searchParams.set('utm_medium', 'social');
  url.searchParams.set('utm_campaign', 'product_test');
  
  window.history.replaceState({}, '', url);
  window.location.reload();
}

// Auto-load default product if no params exist
if (typeof window !== 'undefined') {
  const url = new URL(window.location.href);
  if (!url.searchParams.has('productId')) {
    console.log('🎯 No productId found, will load default product...');
  }
}

// For testing in console:
// setMockProductUrl('prod_chair_01', 'instagram')
// setMockProductUrl('prod_lamp_02', 'instagram')
// setMockProductUrl('invalid_product', 'instagram')

(window as any).setMockProductUrl = setMockProductUrl;

console.log(`
✨ HomeVision Product Flow loaded!

📱 محصولات موجود:
  • prod_chair_01 - صندلی راحتی مدرن
  • prod_lamp_02 - چراغ ایستاده مینیمال

🧪 برای تست محصول دیگر در Console:
  setMockProductUrl('prod_chair_01', 'instagram')
  setMockProductUrl('prod_lamp_02', 'instagram')

🎯 محصول پیش‌فرض: ${new URL(window.location.href).searchParams.get('productId') || 'prod_chair_01 (loading...)'}
`);