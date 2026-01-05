import { useNavigate as useRouterNavigate } from "react-router-dom";
import { ErrorRecovery } from "../../components/ErrorRecovery";
import { useApp } from "../../context/AppContext";

export function ErrorPage() {
  const navigate = useRouterNavigate();
  const { errorType, trackKPI, setSelectedFile } = useApp();

  const handleRetry = () => {
    trackKPI("Error Recovery", { action: "retry", errorType });
    navigate("/processing");
  };

  const handleCancel = () => {
    trackKPI("Error Recovery", { action: "cancel", errorType });
    setSelectedFile(null);
    navigate("/upload");
  };

  return (
    <ErrorRecovery
      errorType={errorType as any}
      onRetry={handleRetry}
      onCancel={handleCancel}
    />
  );
}