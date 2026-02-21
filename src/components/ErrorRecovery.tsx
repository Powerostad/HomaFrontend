import { SimpleButton as Button } from "./SimpleButton";
import { motion } from "motion/react";
import { WifiOff, RefreshCcw, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ErrorRecoveryProps {
  errorType: "network" | "timeout" | "server" | "unknown";
  onRetry: () => void;
  onCancel: () => void;
}

export function ErrorRecovery({ errorType, onRetry, onCancel }: ErrorRecoveryProps) {
  const { t } = useTranslation();

  const getErrorContent = () => {
    switch (errorType) {
      case "network":
        return {
          icon: WifiOff,
          title: t('errorRecovery.networkTitle'),
          message: t('errorRecovery.networkMessage'),
          color: "blue"
        };
      case "timeout":
        return {
          icon: AlertCircle,
          title: t('errorRecovery.timeoutTitle'),
          message: t('errorRecovery.timeoutMessage'),
          color: "yellow"
        };
      case "server":
        return {
          icon: AlertCircle,
          title: t('errorRecovery.serverTitle'),
          message: t('errorRecovery.serverMessage'),
          color: "red"
        };
      default:
        return {
          icon: AlertCircle,
          title: t('errorRecovery.unknownTitle'),
          message: t('errorRecovery.unknownMessage'),
          color: "gray"
        };
    }
  };

  const content = getErrorContent();
  const Icon = content.icon;

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-sm overflow-hidden"
      >
        <div className="p-6">
          {/* Error Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ 
              duration: 0.5,
              delay: 0.2,
              type: "spring",
              stiffness: 200
            }}
            className="w-full aspect-square max-w-xs mx-auto rounded-full bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center mb-6"
          >
            <div className={`w-32 h-32 rounded-full flex items-center justify-center ${
              content.color === "blue" ? "bg-blue-100" :
              content.color === "yellow" ? "bg-yellow-100" :
              content.color === "red" ? "bg-red-100" :
              "bg-gray-100"
            }`}>
              <Icon className={`w-16 h-16 ${
                content.color === "blue" ? "text-blue-600" :
                content.color === "yellow" ? "text-yellow-600" :
                content.color === "red" ? "text-red-600" :
                "text-gray-600"
              }`} />
            </div>
          </motion.div>

          {/* Error Message */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-center mb-8"
          >
            <h2 className="text-gray-900 mb-3">{content.title}</h2>
            <p className="text-gray-600 leading-relaxed">
              {content.message}
            </p>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="space-y-3"
          >
            <Button
              onClick={onRetry}
              className="w-full h-14 bg-gray-900 hover:bg-gray-800 text-white rounded-full transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCcw className="w-5 h-5" />
              {t('common.retry')}
            </Button>

            <Button
              onClick={onCancel}
              variant="outline"
              className="w-full h-14 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-full"
            >
              {t('common.cancel')}
            </Button>
          </motion.div>

          {/* Help Text */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mt-6 text-center"
          >
            <p className="text-gray-500">
              {t('errorRecovery.needHelp')}{" "}
              <button className="text-gray-900 hover:underline">
                {t('errorRecovery.contactSupport')}
              </button>
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}