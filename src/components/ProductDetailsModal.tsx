import {
  SimpleDialog as Dialog,
  SimpleDialogContent as DialogContent,
  SimpleDialogHeader as DialogHeader,
  SimpleDialogTitle as DialogTitle,
  SimpleDialogDescription as DialogDescription,
} from "./SimpleDialog";
import { SimpleButton as Button } from "./SimpleButton";
import { CheckCircle, Upload } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Product } from "../types/product";
import { formatPriceFromRial } from "../utils/formatters";

interface ProductDetailsModalProps {
  open: boolean;
  onClose: () => void;
  product: Product;
  onUploadSticky: () => void;
}

export function ProductDetailsModal({ 
  open, 
  onClose, 
  product,
  onUploadSticky 
}: ProductDetailsModalProps) {
  const { t } = useTranslation();
  const displayPrice = product.price
    ? formatPriceFromRial(product.price)
    : product.priceRange
    ? `${formatPriceFromRial(product.priceRange.min, false)} - ${formatPriceFromRial(product.priceRange.max)}`
    : null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto bg-white rounded-3xl border-gray-200">
        <DialogHeader>
          <DialogTitle className="text-gray-900">{t('productDetails.title')}</DialogTitle>
          <DialogDescription className="text-gray-600">{t('productDetails.viewInfo')}</DialogDescription>
        </DialogHeader>

        {/* Product Images Gallery */}
        <div className="space-y-3">
          <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100">
            <img 
              src={product.thumbnail}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          
          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.slice(0, 4).map((img, idx) => (
                <div key={idx} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <img 
                    src={img}
                    alt={`${product.name} ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-4">
          <div>
            <div className="flex items-start justify-between gap-2 mb-2">
              <h2 className="text-gray-900">{product.name}</h2>
              {product.seller.verified && (
                <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />
              )}
            </div>
            
            <p className="text-gray-600">
              {t('productDetails.seller', { name: product.seller.name })}
            </p>

            {product.brand && (
              <p className="text-gray-600">
                {t('productDetails.brand', { name: product.brand })}
              </p>
            )}
          </div>

          {displayPrice && (
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
              <p className="text-gray-600 mb-1">{t('product.price')}</p>
              <p className="text-gray-900">{displayPrice}</p>
            </div>
          )}

          {/* Description */}
          {product.description && (
            <div>
              <h3 className="text-gray-900 mb-2">{t('product.description')}</h3>
              <p className="text-gray-600 leading-relaxed">
                {product.description}
              </p>
            </div>
          )}

          {/* Features */}
          {product.features && product.features.length > 0 && (
            <div>
              <h3 className="text-gray-900 mb-2">{t('product.specifications')}</h3>
              <ul className="space-y-2">
                {product.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-gray-600">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Variants */}
          {product.variants && (
            <div className="space-y-3">
              {product.variants.colors && (
                <div>
                  <h4 className="text-gray-900 mb-2">{t('productDetails.availableColors')}</h4>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.colors.map((color) => (
                      <div
                        key={color.name}
                        className={`px-3 py-1.5 rounded-full border ${
                          color.available
                            ? "border-gray-300 bg-white text-gray-900"
                            : "border-gray-200 bg-gray-100 text-gray-400"
                        }`}
                      >
                        {color.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {product.variants.sizes && (
                <div>
                  <h4 className="text-gray-900 mb-2">{t('productDetails.availableSizes')}</h4>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.sizes.map((size) => (
                      <div
                        key={size.name}
                        className={`px-3 py-1.5 rounded-full border ${
                          size.available
                            ? "border-gray-300 bg-white text-gray-900"
                            : "border-gray-200 bg-gray-100 text-gray-400"
                        }`}
                      >
                        {size.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sticky CTA */}
        <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-gray-200 pt-4 -mx-6 px-6 -mb-6 pb-6">
          <Button
            onClick={onUploadSticky}
            className="w-full h-14 bg-gray-900 hover:bg-gray-800 text-white rounded-full transition-colors flex items-center justify-center gap-2"
          >
            <Upload className="w-5 h-5" />
            {t('productDetails.uploadToTest')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}