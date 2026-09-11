import { createInstance } from "i18next";
import fa from "../i18n/locales/fa.json";
import ar from "../i18n/locales/ar.json";
import en from "../i18n/locales/en.json";
import tr from "../i18n/locales/tr.json";
import { seoFa } from "./content";

/** Each render gets its own language state; importing this module never touches the browser. */
export function createPublicI18n() {
  const instance = createInstance();
  void instance.init({
    lng: "fa",
    fallbackLng: "fa",
    supportedLngs: ["fa", "ar", "en", "tr"],
    initImmediate: false,
    resources: {
      fa: { translation: { ...fa, seo: seoFa } },
      ar: {
        translation: {
          ...ar,
          seo: {
            header: {
              explore: "المتاجر",
              gallery: "المنتجات",
              account: "حسابي",
              basket: "سلة التسوق",
              language: "اللغة",
              label: "التنقل الرئيسي",
            },
          },
        },
      },
      en: {
        translation: {
          ...en,
          seo: {
            header: {
              explore: "Stores",
              gallery: "Products",
              account: "Account",
              basket: "Basket",
              language: "Language",
              label: "Main navigation",
            },
          },
        },
      },
      tr: {
        translation: {
          ...tr,
          seo: {
            header: {
              explore: "Mağazalar",
              gallery: "Ürünler",
              account: "Hesap",
              basket: "Sepet",
              language: "Dil",
              label: "Ana gezinme",
            },
          },
        },
      },
    },
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });
  return instance;
}
