import React, { useState, useRef } from "react";
import { Upload, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SimpleButton } from "./SimpleButton";
import { motion, AnimatePresence } from "motion/react";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSizeMB?: number;
}

export function FileUpload({
  onFileSelect,
  accept = "image/png, image/jpeg, image/jpg, image/webp",
  maxSizeMB = 10
}: FileUploadProps) {
  const { t } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const validateFile = (file: File): boolean => {
    // Check type
    const validTypes = accept.split(",").map(type => type.trim());
    const fileType = file.type;
    // Simple check - in production might need more robust checking
    const isValidType = validTypes.some(type => {
      if (type.endsWith("/*")) {
        return fileType.startsWith(type.replace("/*", ""));
      }
      return fileType === type;
    });

    if (!isValidType) {
      setError(t('tryOn.errors.invalidFormat', 'فرمت فایل پشتیبانی نمی‌شود. لطفا تصویر (JPG, PNG, WebP) آپلود کنید.'));
      return false;
    }

    // Check size
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(t('tryOn.errors.fileTooLarge', 'حجم فایل باید کمتر از {{size}} مگابایت باشد.', { size: maxSizeMB }));
      return false;
    }

    setError(null);
    return true;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        onFileSelect(file);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        onFileSelect(file);
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <div
        className={`
          relative overflow-hidden rounded-[var(--radius-card)] border-2 border-dashed transition-all duration-300 cursor-pointer
          ${isDragging
            ? "border-[var(--primary)] bg-[var(--primary)]/5 scale-[1.02]"
            : "border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)]/30"
          }
          ${error ? "border-[var(--destructive)]/50 bg-[var(--destructive)]/5" : ""}
        `}
        role="button"
        tabIndex={0}
        onClick={triggerFileInput}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            triggerFileInput();
          }
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center py-[var(--spacing-2xl)] px-[var(--spacing-md)] text-center">
          <div className={`
            mb-[var(--spacing-md)] p-[var(--spacing-sm)] rounded-full transition-colors duration-300
            ${isDragging ? "bg-[var(--primary)]/10 text-[var(--primary)]" : "bg-[var(--muted)] text-[var(--muted-foreground)]"}
            ${error ? "bg-[var(--destructive)]/10 text-[var(--destructive)]" : ""}
          `}>
            {error ? (
              <X className="w-8 h-8" />
            ) : (
              <Upload className="w-8 h-8" />
            )}
          </div>

          <h3 className="mb-2 text-[var(--foreground)]">
            {isDragging ? t('fileUpload.dropFile', 'فایل را رها کنید') : t('fileUpload.uploadImage', 'بارگذاری تصویر')}
          </h3>

          <p className="text-[var(--muted-foreground)] mb-[var(--spacing-lg)] max-w-xs mx-auto text-[length:14px] leading-relaxed">
            {t('fileUpload.dragDropDescription', 'تصویر محصول خود را بکشید و رها کنید یا برای انتخاب کلیک کنید')}
          </p>

          <SimpleButton
            onClick={(e) => {
              e.stopPropagation();
              triggerFileInput();
            }}
            className="min-w-[160px]"
            variant={error ? "destructive" : "default"}
          >
            {t('fileUpload.selectFile', 'انتخاب فایل')}
          </SimpleButton>

          <p className="mt-[var(--spacing-md)] text-[length:var(--text-caption-size)] text-[var(--muted-foreground)]/60 font-mono">
            {t('fileUpload.formatInfo', 'JPG, PNG, WebP — Max {{size}}MB', { size: maxSizeMB })}
          </p>
        </div>

        {/* Error Message Toast inside component */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-4 left-4 right-4 bg-[var(--destructive)] text-[var(--destructive-foreground)] p-3 rounded-[var(--radius-sm)] text-[length:14px] text-center font-medium"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
