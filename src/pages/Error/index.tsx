import { useNavigate as useRouterNavigate } from "react-router-dom";
import { ErrorRecovery } from "../../components/ErrorRecovery";
import { useSession, useUpload } from "../../context/AppProviders";

// Valid error types matching ErrorRecovery component
type ErrorType = "network" | "timeout" | "server" | "unknown";

const VALID_ERROR_TYPES: ErrorType[] = ["network", "timeout", "server", "unknown"];

function isValidErrorType(type: string): type is ErrorType {
  return VALID_ERROR_TYPES.includes(type as ErrorType);
}

export function ErrorPage() {
  const navigate = useRouterNavigate();
  const { errorType, trackKPI } = useSession();
  const { setSelectedFile } = useUpload();

  // Ensure errorType is a valid ErrorRecovery error type
  const typedErrorType: ErrorType = isValidErrorType(errorType) ? errorType : "unknown";

  const handleRetry = () => {
    trackKPI("Error Recovery", { action: "retry", errorType: typedErrorType });
    navigate("/processing");
  };

  const handleCancel = () => {
    trackKPI("Error Recovery", { action: "cancel", errorType: typedErrorType });
    setSelectedFile(null);
    navigate("/upload");
  };

  return (
    <ErrorRecovery
      errorType={typedErrorType}
      onRetry={handleRetry}
      onCancel={handleCancel}
    />
  );
}