"use client";

import { useStaticTranslation } from "@/lib/use-static-translation";

export function Footer() {
  const { t } = useStaticTranslation();

  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <h3 className="font-bold text-lg mb-4">{t("footer.brandName")}</h3>
            <p className="text-gray-600 mb-4">
              {t("footer.brandDescription")}
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">{t("footer.shopSection")}</h4>
            <ul className="space-y-2 text-gray-600">
              <li><a href="/products" className="hover:text-primary transition-colors">{t("footer.allProducts")}</a></li>
              <li><a href="/products?category=pottery" className="hover:text-primary transition-colors">{t("footer.pottery")}</a></li>
              <li><a href="/products?category=textiles" className="hover:text-primary transition-colors">{t("footer.textiles")}</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">{t("footer.supportSection")}</h4>
            <ul className="space-y-2 text-gray-600">
              <li><a href="#" className="hover:text-primary transition-colors">{t("footer.helpCenter")}</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">{t("footer.contactUs")}</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">{t("footer.shippingInfo")}</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-200 mt-12 pt-8 text-center text-gray-600">
          <p>{t("footer.copyright")}</p>
        </div>
      </div>
    </footer>
  );
}