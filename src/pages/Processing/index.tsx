import { useNavigate as useRouterNavigate } from "react-router-dom";
import { StagedUpload } from "../../components/StagedUpload";
import { useApp } from "../../context/AppContext";
import { processImageWithAI, saveVisualization, trackEvent } from "../../utils/aiImageProcessor";
import { parseEntryParams } from "../../utils/productLoader";

export function ProcessingPage() {
  const navigate = useRouterNavigate();
  const { 
    selectedFile, 
    product, 
    sessionId, 
    uploadStartTime, 
    trackKPI,
    setVisualizedImageUrl,
    setPlacementSuccess,
    setHasFeedbackForCurrentImage,
    setErrorType
  } = useApp();

  if (!selectedFile || !product) {
    setTimeout(() => navigate("/"), 0);
    return null;
  }

  const handleComplete = async () => {
    const ttfu = Date.now() - uploadStartTime;
    trackKPI("Upload Success", {
      fileName: selectedFile.name,
      ttfu,
    });

    trackEvent({
      eventType: "upload_success",
      productId: product.id,
      sessionId,
      metadata: {
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        ttfu,
      },
    });

    setHasFeedbackForCurrentImage(false);
    
    // Start AI Processing
    try {
      const result = await processImageWithAI({
        imageFile: selectedFile,
        productId: product.id,
        sessionId,
      });

      if (result.success) {
        setVisualizedImageUrl(result.visualizedImageUrl);
        setPlacementSuccess(true);

        const entryContext = parseEntryParams(window.location.href);
        await saveVisualization({
          productId: product.id,
          originalImageUrl: result.originalImageUrl,
          visualizedImageUrl: result.visualizedImageUrl,
          sessionId,
          utm: entryContext?.utm,
        });

        trackEvent({
          eventType: "view_result",
          productId: product.id,
          sessionId,
          metadata: {
            processingTime: result.processingTime,
            confidence: result.confidence,
          },
        });
      } else {
        setPlacementSuccess(false);
        trackEvent({
          eventType: "upload_error",
          productId: product.id,
          sessionId,
          metadata: { error: result.error },
        });
      }
      
      // Navigate to confirmation animation
      navigate("/confirmation");

    } catch (error) {
      console.error("Error processing image:", error);
      setPlacementSuccess(false);
      navigate("/confirmation");
    }
  };

  const handleError = (error: string) => {
    trackKPI("Upload Error", { error });
    setErrorType("network");
    navigate("/error");
  };

  return (
    <StagedUpload
      file={selectedFile}
      onComplete={handleComplete}
      onError={handleError}
    />
  );
}