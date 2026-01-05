import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Camera } from "lucide-react";
import { Header } from "./Header";
import svgPaths from "../imports/svg-m4kfj8jpfi";

interface FilePrecheckProps {
  file: File;
  onApprove: () => void;
  onRetake: () => void;
  onContinueAnyway: () => void;
}

interface CheckResult {
  type: "success" | "warning" | "error";
  message: string;
  canContinue: boolean;
}

// Success Icon - Checkmark Circle
function SuccessIcon() {
  return (
    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
      <g clipPath="url(#clip0_success)" id="Icon">
        <path 
          d={svgPaths.p3337cc00} 
          id="Vector" 
          stroke="white" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth="2.08159" 
        />
        <path 
          d={svgPaths.p24c9c740} 
          id="Vector_2" 
          stroke="white" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth="2.08159" 
        />
      </g>
      <defs>
        <clipPath id="clip0_success">
          <rect fill="white" height="19.9832" width="19.9832" />
        </clipPath>
      </defs>
    </svg>
  );
}

// Warning/Error Icon - Alert Circle
function AlertIcon() {
  return (
    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
      <g clipPath="url(#clip0_alert)" id="Icon">
        <path 
          d={svgPaths.p3337cc00} 
          id="Vector" 
          stroke="white" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth="2.08159" 
        />
        <path 
          d="M9.99161 6.66107V9.99161" 
          id="Vector_2" 
          stroke="white" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth="2.08159" 
        />
        <path 
          d="M9.99161 13.3221H9.99994" 
          id="Vector_3" 
          stroke="white" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth="2.08159" 
        />
      </g>
      <defs>
        <clipPath id="clip0_alert">
          <rect fill="white" height="19.9832" width="19.9832" />
        </clipPath>
      </defs>
    </svg>
  );
}

export function FilePrecheck({ file, onApprove, onRetake, onContinueAnyway }: FilePrecheckProps) {
  const [checks, setChecks] = useState<CheckResult[]>([]);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const runChecks = async () => {
      setIsChecking(true);
      const results: CheckResult[] = [];

      // Simulate checking delays for realism
      await new Promise(resolve => setTimeout(resolve, 500));

      // Check 1: File type
      if (file.type === "image/jpeg" || file.type === "image/png") {
        results.push({
          type: "success",
          message: "فرمت فایل صحیح است (JPG/PNG)",
          canContinue: true
        });
      } else {
        results.push({
          type: "error",
          message: "فرمت فایل پشتیبانی نمی‌شود. لطفاً JPG یا PNG استفاده کنید",
          canContinue: false
        });
      }
      setChecks([...results]);

      await new Promise(resolve => setTimeout(resolve, 400));

      // Check 2: File size
      const sizeMB = file.size / (1024 * 1024);
      if (sizeMB < 10) {
        results.push({
          type: "success",
          message: `حجم فایل مناسب است (${sizeMB.toFixed(2)} MB)`,
          canContinue: true
        });
      } else if (sizeMB < 20) {
        results.push({
          type: "warning",
          message: "حجم فایل بزرگ است، ممکن است پردازش کندتر باشد",
          canContinue: true
        });
      } else {
        results.push({
          type: "error",
          message: "حجم فایل بیش از حد مجاز (حداکثر 20MB)",
          canContinue: false
        });
      }
      setChecks([...results]);

      await new Promise(resolve => setTimeout(resolve, 600));

      // Check 3: Image quality (simulated)
      const qualityCheck = Math.random();
      if (qualityCheck > 0.3) {
        results.push({
          type: "success",
          message: "کیفیت تصویر مناسب است",
          canContinue: true
        });
      } else {
        results.push({
          type: "warning",
          message: "تصویر ممکن است کمی تار باشد، اما ادامه می‌دهیم",
          canContinue: true
        });
      }
      setChecks([...results]);

      await new Promise(resolve => setTimeout(resolve, 500));

      // Check 4: Room detection (simulated)
      const roomDetection = Math.random();
      if (roomDetection > 0.2) {
        results.push({
          type: "success",
          message: "محیط داخلی شناسایی شد",
          canContinue: true
        });
      } else {
        results.push({
          type: "warning",
          message: "اطمینان از نوع تصویر نداریم، اما می‌توانید ادامه دهید",
          canContinue: true
        });
      }

      setChecks(results);
      setIsChecking(false);

      // Auto-approve ONLY if ALL checks are successful (no warnings or errors)
      const allSuccess = results.every(r => r.type === "success");
      if (allSuccess) {
        setTimeout(() => {
          onApprove();
        }, 800); // Small delay to show completion state
      }
    };

    runChecks();
  }, [file, onApprove]);

  const hasError = checks.some(c => c.type === "error");
  const hasWarning = checks.some(c => c.type === "warning");
  const allSuccess = checks.length > 0 && checks.every(c => c.type === "success");
  const completedChecks = checks.length;
  const totalChecks = 4;

  return (
    <div className="bg-white relative min-h-screen">
      <Header onBack={onRetake} showBackButton={true} />
      
      {/* Main Container */}
      <div className="px-6 pt-[104px] pb-8">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="mb-14"
        >
          <h1 className="text-center text-[#1a1a1a] mb-2" style={{ fontWeight: 700 }}>بررسی تصویر</h1>
        </motion.div>

        {/* Checks List */}
        <div className="space-y-3 mb-8">
          <AnimatePresence mode="popLayout">
            {checks.map((check, index) => {
              const bgColor = check.type === "success"
                ? "#f7fcde"
                : check.type === "warning"
                ? "rgba(216,223,233,0.71)"
                : "#FEF2F2";
              
              const textColor = check.type === "success"
                ? "#212121"
                : check.type === "warning"
                ? "#212121"
                : "#7F1D1D";
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ 
                    duration: 0.3, 
                    delay: index * 0.1,
                    ease: [0.16, 1, 0.3, 1]
                  }}
                  className="flex items-start gap-4 px-5 pt-5 pb-5 rounded-[24px]"
                  style={{ backgroundColor: bgColor }}
                >
                  {/* Icon Container - Right Side (First in RTL) */}
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ 
                      delay: index * 0.1 + 0.15, 
                      type: "spring", 
                      stiffness: 200 
                    }}
                    className="flex-shrink-0 bg-[#212121] rounded-[16px] size-[39.985px] flex items-center justify-center"
                  >
                    <div className="size-[19.983px]">
                      {check.type === "success" ? <SuccessIcon /> : <AlertIcon />}
                    </div>
                  </motion.div>

                  {/* Text - Left Side (Second in RTL) */}
                  <div className="flex-1 min-w-0">
                    <p 
                      className="leading-relaxed"
                      style={{ color: textColor }}
                    >
                      {check.message}
                    </p>
                  </div>
                </motion.div>
              );
            })}
            
            {isChecking && checks.length < 4 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex items-center gap-4 px-5 py-5 rounded-[24px] bg-[#F3F4F6]"
              >
                <div className="flex-shrink-0 size-6 border-3 border-[#E5E7EB] border-t-[#1A1A1A] rounded-full animate-spin" />
                <div className="flex-1">
                  <p className="text-[#6B7280]">در حال بررسی...</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action Buttons */}
        {!isChecking && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.3 }}
            className="space-y-3 mt-auto pt-8"
          >
            {hasError ? (
              <>
                {/* Error: Must upload better image */}
                <motion.button
                  onClick={onRetake}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full h-[55.993px] flex items-center justify-center gap-2 rounded-full bg-[#212121] text-white transition-all duration-300"
                >
                  <Camera className="size-[19.983px]" />
                  <span>عکس بهتری انتخاب کنید</span>
                </motion.button>
                <motion.button
                  onClick={onContinueAnyway}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full h-[55.993px] flex items-center justify-center rounded-full bg-[#f3f4f6] text-[#1a1a1a] transition-all duration-300"
                >
                  به هر حال ادامه دهید
                </motion.button>
              </>
            ) : hasWarning ? (
              <>
                {/* Warning: Suggest better image */}
                <motion.button
                  onClick={onRetake}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full h-[55.993px] flex items-center justify-center gap-2 rounded-full bg-[#212121] text-white transition-all duration-300"
                >
                  <Camera className="size-[19.983px]" />
                  <span>عکس بهتری انتخاب کنید</span>
                </motion.button>
                <motion.button
                  onClick={onContinueAnyway}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full h-[55.993px] flex items-center justify-center rounded-full bg-[#f3f4f6] text-[#1a1a1a] transition-all duration-300"
                >
                  با همین عکس ادامه بده
                </motion.button>
              </>
            ) : (
              <>
                {/* All Success: Auto-approved or manual continue */}
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-full h-[55.993px] flex items-center justify-center rounded-full bg-[#dff370] text-[#212121] transition-all duration-300"
                >
                  <span>✓ تصویر تایید شد - در حال انتقال...</span>
                </motion.div>
              </>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}