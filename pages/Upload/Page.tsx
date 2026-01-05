import { useNavigate } from "react-router-dom";
import { FileUpload } from "../../components/FileUpload";
import { Header } from "../../components/Header";
import { useApp } from "../../context/AppContext";
import { motion } from "motion/react";

export function UploadPage() {
  const navigate = useNavigate();
  const { setSelectedFile, setUploadStartTime } = useApp();

  const handleFileUpload = (file: File) => {
    // Store file info and navigate to precheck
    setSelectedFile(file);
    setUploadStartTime(Date.now());
    navigate("/precheck");
  };

  const handleBack = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      <Header 
        showBackButton={true} 
        onBack={handleBack}
        showHomeButton={true}
        onHome={() => navigate("/")}
      />
      
      <main className="flex-grow flex flex-col items-center justify-center px-[var(--spacing-md)] py-20 relative overflow-hidden">
        {/* Ambient Background */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--primary)]/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[var(--accent)]/5 rounded-full blur-[100px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-2xl relative z-10"
        >
          <div className="text-center mb-[var(--spacing-xl)]">
            <h1 className="mb-[var(--spacing-sm)] text-[var(--foreground)]">آپلود تصویر محصول</h1>
            <p className="text-[var(--muted-foreground)] mb-[var(--spacing-sm)]">
              برای شروع، یک تصویر با کیفیت از محصول خود بارگذاری کنید
            </p>
          </div>

          <FileUpload 
            onFileSelect={handleFileUpload} 
            maxSizeMB={15}
          />

          <div className="mt-[var(--spacing-xl)] grid grid-cols-1 md:grid-cols-3 gap-[var(--spacing-md)] text-center">
            <div className="p-[var(--spacing-sm)] rounded-[var(--radius-card)] bg-[var(--secondary)] backdrop-blur-sm">
              <div className="text-[24px] mb-[var(--spacing-xs)]">📸</div>
              <h3 className="mb-[5px] text-[var(--foreground)]">وضوح بالا</h3>
              <p className="text-[length:var(--text-caption-size)] text-[var(--muted-foreground)]">برای بهترین نتیجه از تصاویر با کیفیت استفاده کنید</p>
            </div>
            <div className="p-[var(--spacing-sm)] rounded-[var(--radius-card)] bg-[var(--secondary)] backdrop-blur-sm">
              <div className="text-[24px] mb-[var(--spacing-xs)]">💡</div>
              <h3 className="mb-[5px] text-[var(--foreground)]">نور مناسب</h3>
              <p className="text-[length:var(--text-caption-size)] text-[var(--muted-foreground)]">نور طبیعی و یکنواخت جزئیات را بهتر نشان می‌دهد</p>
            </div>
            <div className="p-[var(--spacing-sm)] rounded-[var(--radius-card)] bg-[var(--secondary)] backdrop-blur-sm">
              <div className="text-[24px] mb-[var(--spacing-xs)]">📐</div>
              <h3 className="mb-[5px] text-[var(--foreground)]">زاویه دید</h3>
              <p className="text-[length:var(--text-caption-size)] text-[var(--muted-foreground)]">محصول را در مرکز کادر و با زاویه مناسب قرار دهید</p>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
