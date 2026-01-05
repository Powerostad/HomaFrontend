import { useNavigate as useRouterNavigate } from "react-router-dom";
import { FilePrecheck } from "../../components/FilePrecheck";
import { useApp } from "../../context/AppContext";

export function PrecheckPage() {
  const navigate = useRouterNavigate();
  const { selectedFile, setSelectedFile, trackKPI, uploadStartTime } = useApp();

  if (!selectedFile) {
    setTimeout(() => navigate("/upload"), 0);
    return null;
  }

  const handleApprove = () => {
    trackKPI("precheck_pass", {
      fileName: selectedFile.name,
      precheckDuration: Date.now() - uploadStartTime,
    });
    navigate("/processing");
  };

  const handleRetake = () => {
    trackKPI("retry_upload", {
      reason: "user_initiated",
      source: "precheck_retake",
    });
    setSelectedFile(null);
    navigate("/upload");
  };

  const handleContinueAnyway = () => {
    trackKPI("Precheck Override", {
      fileName: selectedFile.name,
      reason: "user_continue_anyway",
    });
    navigate("/processing");
  };

  return (
    <FilePrecheck
      file={selectedFile}
      onApprove={handleApprove}
      onRetake={handleRetake}
      onContinueAnyway={handleContinueAnyway}
    />
  );
}