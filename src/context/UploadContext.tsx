import React, { createContext, useContext, useState, ReactNode } from "react";

/**
 * UploadContext - manages file upload and visualization state
 */
interface UploadContextType {
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;
  visualizedImageUrl: string;
  setVisualizedImageUrl: (url: string) => void;
  uploadStartTime: number;
  setUploadStartTime: (time: number) => void;
  clearUpload: () => void;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

export function UploadProvider({ children }: { children: ReactNode }) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [visualizedImageUrl, setVisualizedImageUrl] = useState<string>("");
  const [uploadStartTime, setUploadStartTime] = useState<number>(0);

  const clearUpload = () => {
    setSelectedFile(null);
    setVisualizedImageUrl("");
    setUploadStartTime(0);
  };

  return (
    <UploadContext.Provider
      value={{
        selectedFile,
        setSelectedFile,
        visualizedImageUrl,
        setVisualizedImageUrl,
        uploadStartTime,
        setUploadStartTime,
        clearUpload,
      }}
    >
      {children}
    </UploadContext.Provider>
  );
}

export function useUpload() {
  const context = useContext(UploadContext);
  if (context === undefined) {
    throw new Error("useUpload must be used within an UploadProvider");
  }
  return context;
}
