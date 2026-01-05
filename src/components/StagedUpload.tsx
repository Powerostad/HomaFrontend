import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Sparkles } from "lucide-react";
import { Header } from "./Header";
import svgPaths from "../imports/svg-m4kfj8jpfi";

interface StagedUploadProps {
  file: File;
  onComplete: () => void;
  onError: (error: string) => void;
}

type Stage = {
  id: number;
  label: string;
  progress: number;
  status: "pending" | "active" | "complete" | "error";
};

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

// Processing Icon - Spinner
function ProcessingIcon() {
  return (
    <svg className="block size-full animate-spin" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
      <g id="Icon">
        <path 
          d={svgPaths.p3337cc00} 
          id="Vector" 
          stroke="white" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth="2.08159" 
          strokeDasharray="50 50"
        />
      </g>
    </svg>
  );
}

export function StagedUpload({ file, onComplete, onError }: StagedUploadProps) {
  const [stages, setStages] = useState<Stage[]>([
    { id: 1, label: "بارگذاری فایل", progress: 0, status: "active" },
    { id: 2, label: "پردازش تصویر", progress: 0, status: "pending" },
    { id: 3, label: "آماده‌سازی نتایج", progress: 0, status: "pending" }
  ]);

  useEffect(() => {
    const simulateUpload = async () => {
      try {
        // Stage 1: File Upload (33%)
        setStages(prev => prev.map(s => 
          s.id === 1 ? { ...s, status: "active" as const } : s
        ));

        for (let i = 0; i <= 100; i += 5) {
          await new Promise(resolve => setTimeout(resolve, 50));
          setStages(prev => prev.map(s => 
            s.id === 1 ? { ...s, progress: i } : s
          ));
        }

        setStages(prev => prev.map(s => 
          s.id === 1 ? { ...s, status: "complete" as const } : s
        ));

        await new Promise(resolve => setTimeout(resolve, 300));

        // Stage 2: Image Processing (66%)
        setStages(prev => prev.map(s => 
          s.id === 2 ? { ...s, status: "active" as const } : s
        ));

        for (let i = 0; i <= 100; i += 4) {
          await new Promise(resolve => setTimeout(resolve, 60));
          setStages(prev => prev.map(s => 
            s.id === 2 ? { ...s, progress: i } : s
          ));
        }

        setStages(prev => prev.map(s => 
          s.id === 2 ? { ...s, status: "complete" as const } : s
        ));

        await new Promise(resolve => setTimeout(resolve, 300));

        // Stage 3: Preparing Results (100%)
        setStages(prev => prev.map(s => 
          s.id === 3 ? { ...s, status: "active" as const } : s
        ));

        for (let i = 0; i <= 100; i += 6) {
          await new Promise(resolve => setTimeout(resolve, 40));
          setStages(prev => prev.map(s => 
            s.id === 3 ? { ...s, progress: i } : s
          ));
        }

        setStages(prev => prev.map(s => 
          s.id === 3 ? { ...s, status: "complete" as const } : s
        ));

        // Auto-complete after all stages done
        setTimeout(() => {
          onComplete();
        }, 1000); // Delay to show final completion state
      } catch (error) {
        onError("خطا در بارگذاری فایل");
        setStages(prev => prev.map(s => 
          s.status === "active" ? { ...s, status: "error" as const } : s
        ));
      }
    };

    simulateUpload();
  }, [file, onError, onComplete]);

  const getStageColors = (stage: Stage) => {
    if (stage.status === "complete") {
      return {
        bg: "#f7fcde",
        text: "#292b2d"
      };
    }
    if (stage.status === "active") {
      return {
        bg: "rgba(216,223,233,0.71)",
        text: "#212121"
      };
    }
    return {
      bg: "#F9FAFB",
      text: "#9CA3AF"
    };
  };

  const overallProgress = stages.reduce((acc, stage) => {
    if (stage.status === "complete") return acc + 33.33;
    if (stage.status === "active") return acc + (stage.progress / 3);
    return acc;
  }, 0);

  const activeStage = stages.find(s => s.status === "active");
  const allComplete = stages.every(s => s.status === "complete");

  return (
    <div className="bg-white relative min-h-screen">
      <Header showBackButton={false} />
      
      {/* Main Container */}
      <div className="px-6 pt-[104px] pb-8">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="mb-14"
        >
          <h2 className="text-center text-[#1a1a1a] mb-2">در حال پردازش</h2>
          <p className="text-center text-[#6B7280]">
            {activeStage ? activeStage.label : "تکمیل شد"}
          </p>
        </motion.div>

        {/* Overall Progress Bar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="mb-10"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-[#6B7280]">پیشرفت کلی</p>
            <p className="text-[#1A1A1A] tabular-nums" style={{ fontWeight: 600 }}>
              {Math.round(overallProgress)}٪
            </p>
          </div>
          <div className="w-full h-3 bg-[#E5E7EB] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[#212121] rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${overallProgress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </motion.div>

        {/* Stages List */}
        <div className="space-y-3 mb-8">
          {stages.map((stage, index) => {
            const colors = getStageColors(stage);
            
            return (
              <motion.div
                key={stage.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ 
                  duration: 0.3, 
                  delay: index * 0.1,
                  ease: [0.16, 1, 0.3, 1]
                }}
                className="flex items-start gap-4 px-5 pt-5 pb-5 rounded-[24px]"
                style={{ backgroundColor: colors.bg }}
              >
                {/* Icon Container - Right Side (First in RTL) */}
                <motion.div 
                  animate={stage.status === "active" ? {
                    scale: [1, 1.05, 1],
                  } : {}}
                  transition={{ 
                    duration: 2, 
                    repeat: stage.status === "active" ? Infinity : 0,
                    ease: "easeInOut"
                  }}
                  className="flex-shrink-0 bg-[#212121] rounded-[16px] size-[39.985px] flex items-center justify-center"
                >
                  <div className="size-[19.983px]">
                    {stage.status === "complete" ? (
                      <SuccessIcon />
                    ) : stage.status === "active" ? (
                      <ProcessingIcon />
                    ) : (
                      <div className="size-full rounded-full border-2 border-gray-400" />
                    )}
                  </div>
                </motion.div>

                {/* Text Content - Left Side (Second in RTL) */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <h4 style={{ color: colors.text }}>
                      {stage.label}
                    </h4>
                    
                    {stage.status === "active" && (
                      <motion.span 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="tabular-nums"
                        style={{ 
                          color: colors.text,
                          fontSize: "0.875rem",
                          fontWeight: 600
                        }}
                      >
                        {Math.round(stage.progress)}٪
                      </motion.span>
                    )}
                    
                    {stage.status === "complete" && (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        style={{ 
                          color: colors.text,
                          fontSize: "0.875rem",
                          fontWeight: 500
                        }}
                      >
                        ✓ تکمیل شد
                      </motion.span>
                    )}
                  </div>
                  
                  {/* Progress Bar for Active Stage */}
                  {stage.status === "active" && (
                    <div 
                      className="w-full h-2 rounded-full overflow-hidden"
                      style={{ backgroundColor: "rgba(0,0,0,0.1)" }}
                    >
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: "#212121" }}
                        initial={{ width: 0 }}
                        animate={{ width: `${stage.progress}%` }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                      />
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Complete Button */}
        {allComplete && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.3 }}
          >
            <motion.button
              onClick={onComplete}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full h-[55.993px] flex items-center justify-center gap-2 rounded-full bg-[#212121] text-white transition-all duration-300"
            >
              <Sparkles className="size-[19.983px]" />
              <span>مشاهده نتیجه</span>
            </motion.button>
          </motion.div>
        )}
      </div>
    </div>
  );
}