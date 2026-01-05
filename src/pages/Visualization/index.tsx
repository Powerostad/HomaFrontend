import { useState } from "react";
import { useNavigate as useRouterNavigate } from "react-router-dom";
import { ProductVisualization } from "../../components/ProductVisualization";
import { ProductDetailsModal } from "../../components/ProductDetailsModal";
import { FeedbackSurvey } from "../../components/FeedbackSurvey";
import { useApp } from "../../context/AppContext";
import { trackEvent } from "../../utils/aiImageProcessor";

export function VisualizationPage() {
  const navigate = useRouterNavigate();
  const {
    product,
    selectedFile,
    visualizedImageUrl,
    placementSuccess,
    productVariant,
    setProductVariant,
    trackKPI,
    sessionId,
    setPendingAction,
    pendingAction,
    hasFeedbackForCurrentImage,
    setHasFeedbackForCurrentImage,
    userFeedback,
    setUserFeedback
  } = useApp();
  
  const [showDetails, setShowDetails] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  if (!product || !selectedFile) {
    setTimeout(() => navigate("/"), 0);
    return null;
  }

  // Action Handlers
  const handleSave = () => {
    trackKPI("Action: Save", {
      productId: product.id,
      placementSuccess,
      feedback: userFeedback,
    });

    trackEvent({
      eventType: "save_visualization",
      productId: product.id,
      sessionId,
      metadata: { action: "save", feedback: userFeedback },
    });

    alert("تصویر ذخیره شد! 💾");
    setShowFeedback(false);
  };

  const handleTryAnother = () => {
    trackKPI("Action: Try Another", {
      source: "visualization",
      productId: product.id,
      feedback: userFeedback,
    });
    // Reset necessary state in Context if needed, but usually setting new file in upload page is enough.
    // Ideally we clear selectedFile in context when going back.
    navigate("/upload");
  };

  const handleBackToStore = () => {
    trackKPI("Action: Back to Store", {
      productId: product.id,
      placementSuccess,
      feedback: userFeedback,
    });
    
    if (window.opener) {
      window.close();
    } else {
      window.location.href = "instagram://user?username=homa";
      setTimeout(() => {
        window.location.href = "https://instagram.com/homa";
      }, 500);
    }
  };

  const handleActionClick = (action: "save" | "tryAnother" | "backToStore") => {
    trackKPI(`Action Initiated: ${action}`, {
      productId: product.id,
      placementSuccess,
      hasFeedbackForCurrentImage,
    });

    if (hasFeedbackForCurrentImage) {
      if (action === "save") handleSave();
      if (action === "tryAnother") handleTryAnother();
      if (action === "backToStore") handleBackToStore();
    } else {
      setPendingAction(action);
      setShowFeedback(true);
    }
  };

  const handleFeedbackSubmit = (feedback: 'satisfied' | 'neutral' | 'dissatisfied' | null) => {
    trackKPI("Feedback Survey Submitted", { feedback, productId: product.id });
    
    trackEvent({
      eventType: "feedback_survey",
      productId: product.id,
      sessionId,
      metadata: { feedback },
    });

    setUserFeedback(feedback);
    setHasFeedbackForCurrentImage(true);
    setShowFeedback(false);

    // Execute pending action
    if (pendingAction === "save") handleSave();
    if (pendingAction === "tryAnother") handleTryAnother();
    if (pendingAction === "backToStore") handleBackToStore();
    
    setPendingAction(null);
  };

  const handleVariantChange = (type: "color" | "size", value: string) => {
    trackKPI("Variant Change", { type, value, productId: product.id });
    setProductVariant({ ...productVariant, [type]: value });
  };

  const handlePurchase = () => {
    trackKPI("Action: Purchase", {
      productId: product.id,
      variant: productVariant,
      placementSuccess,
    });
    alert(`خرید ${product.name} - به زودی! 🛒`);
  };

  const handleShare = () => {
    trackKPI("Action: Share", { productId: product.id });
    alert("اشتراک‌گذاری... 📤");
  };

  return (
    <>
      <ProductVisualization
        product={product}
        userImage={visualizedImageUrl || URL.createObjectURL(selectedFile)}
        fileName={selectedFile.name}
        placementSuccess={placementSuccess}
        onSave={() => handleActionClick("save")}
        onShare={handleShare}
        onChangeVariant={handleVariantChange}
        onTryAnother={() => handleActionClick("tryAnother")}
        onViewProductDetails={() => setShowDetails(true)}
        onPurchase={handlePurchase}
        onBackToStore={() => handleActionClick("backToStore")}
      />

      {/* Feedback Modal */}
      {showFeedback && (
        <FeedbackSurvey
          productId={product.id}
          onFeedbackSubmit={handleFeedbackSubmit}
        />
      )}

      {/* Details Modal */}
      <ProductDetailsModal
        open={showDetails}
        onClose={() => setShowDetails(false)}
        product={product}
        onUploadSticky={() => {
          setShowDetails(false);
          navigate("/upload");
        }}
      />
    </>
  );
}