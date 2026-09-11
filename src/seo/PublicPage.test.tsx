import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { I18nextProvider } from "react-i18next";
import { PublicPage } from "./PublicPage";
import { createPublicI18n } from "./i18n";
import type { PublicPageData } from "./types";

const base: PublicPageData = {
  kind: "home",
  path: "/",
  page: 1,
  total: 0,
  products: [],
  shops: [],
  breadcrumbs: [],
  status: 200,
  apiBase: "https://example.test/api",
  seo: {
    title: "",
    description: "",
    canonical: "",
    image: "",
    robots: "",
    type: "website",
    jsonLd: [],
  },
};
const render = (data: PublicPageData) =>
  renderToStaticMarkup(
    <I18nextProvider i18n={createPublicI18n()}>
      <PublicPage data={data} />
    </I18nextProvider>,
  );

describe("public HTML content", () => {
  it("renders a single homepage heading and two crawlable task paths without browser globals", () => {
    const html = render(base);
    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).toContain('href="/studio/upload"');
    expect(html).toContain('href="/ai-interior-design"');
    expect(html).toContain('href="/virtual-product-preview"');
    expect(html).not.toContain("seo.home.");
  });
  it("renders acquisition guidance as visible text rather than translation keys", () => {
    const html = render({
      ...base,
      kind: "article",
      path: "/ai-interior-design",
    });
    expect(html).toContain("طراحی دکوراسیون خانه با هوش مصنوعی");
    expect(html).toContain("ابعاد، رنگ‌ها و جزئیات");
    expect(html).not.toContain("seo.articles.");
  });
  it("renders catalog pagination as ordinary URLs", () => {
    const html = render({
      ...base,
      kind: "gallery",
      path: "/gallery",
      total: 41,
      page: 2,
    });
    expect(html).toContain('rel="prev" href="/gallery"');
    expect(html).toContain('rel="next" href="/gallery?page=3"');
  });
  it("preserves filters in pagination and emits actual product links", () => {
    const html = render({
      ...base,
      kind: "gallery",
      path: "/gallery",
      search: "?search=rug&category=rug&page=2",
      total: 41,
      page: 2,
      products: [
        {
          id: 1,
          unique_link: "item",
          shop_slug: "shop",
          shop_name: "فروشگاه",
          name: "محصول",
          price: 1000,
        },
      ],
    });
    expect(html).toContain("/gallery?search=rug&amp;category=rug&amp;page=3");
    expect(html).toContain('href="/store/shop/product/item"');
  });
  it("does not turn absent price into free product or accept unsafe purchase URL", () => {
    const html = render({
      ...base,
      kind: "product",
      product: {
        id: 1,
        unique_link: "item",
        shop_slug: "shop",
        shop_name: "فروشگاه",
        name: "محصول",
        price: 0,
        link: "javascript:alert(1)",
      },
    });
    expect(html).toContain("قیمت اعلام نشده");
    expect(html).not.toContain("javascript:");
    expect(html).toContain("/try-on/item/upload");
  });
  it("creates isolated Persian-first translation instances", async () => {
    const one = createPublicI18n();
    const two = createPublicI18n();
    await one.changeLanguage("en");
    expect(two.language).toBe("fa");
    const html = renderToStaticMarkup(
      <I18nextProvider i18n={one}>
        <PublicPage data={base} />
      </I18nextProvider>,
    );
    expect(html).toContain('class="seo-public" dir="rtl" lang="fa"');
    expect(html).toContain('class="seo-header" lang="en" dir="ltr"');
    expect(html).toContain("Products");
  });
  it("shows verified Instagram support and an explicit unavailable fallback", () => {
    const data = { ...base, kind: "article" as const, path: "/contact" };
    const missing = render(data);
    expect(missing).toContain("راه ارتباط مستقیم با پشتیبانی");
    const configured = render({
      ...data,
      supportUrl: "https://www.instagram.com/myhoma.ir/",
    });
    expect(configured).toContain('href="https://www.instagram.com/myhoma.ir/"');
    expect(configured).toContain('<bdi dir="ltr">myhoma.ir</bdi>');
    expect(configured).toContain("اینستاگرام هُما");
  });
  it("retains the existing E-Namad seal and marks dimension units", () => {
    const html = render({
      ...base,
      kind: "product",
      product: {
        id: 1,
        unique_link: "item",
        shop_slug: "shop",
        shop_name: "فروشگاه",
        name: "محصول",
        price: 1000,
        variants: [
          {
            id: 1,
            label_fa: "کوچک",
            price: 1000,
            is_default: true,
            width_cm: "120",
          },
        ],
      },
    });
    expect(html).toContain("trustseal.enamad.ir/?id=731279");
    expect(html).toContain("عرض: ۱۲۰ سانتی‌متر");
  });
});
