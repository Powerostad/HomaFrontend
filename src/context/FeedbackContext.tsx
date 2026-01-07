import { createContext, useContext, useState, ReactNode } from "react";

/**
 * Feedback types
 */
export type FeedbackRating = "satisfied" | "neutral" | "dissatisfied" | null;
export type PendingAction = "save" | "tryAnother" | "backToStore" | null;

/**
 * FeedbackContext - manages user feedback and pending actions
 */
interface FeedbackContextType {
  userFeedback: FeedbackRating;
  setUserFeedback: (feedback: FeedbackRating) => void;
  pendingAction: PendingAction;
  setPendingAction: (action: PendingAction) => void;
  hasFeedbackForCurrentImage: boolean;
  setHasFeedbackForCurrentImage: (has: boolean) => void;
  clearFeedback: () => void;
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined);

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [userFeedback, setUserFeedback] = useState<FeedbackRating>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [hasFeedbackForCurrentImage, setHasFeedbackForCurrentImage] = useState<boolean>(false);

  const clearFeedback = () => {
    setUserFeedback(null);
    setPendingAction(null);
    setHasFeedbackForCurrentImage(false);
  };

  return (
    <FeedbackContext.Provider
      value={{
        userFeedback,
        setUserFeedback,
        pendingAction,
        setPendingAction,
        hasFeedbackForCurrentImage,
        setHasFeedbackForCurrentImage,
        clearFeedback,
      }}
    >
      {children}
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const context = useContext(FeedbackContext);
  if (context === undefined) {
    throw new Error("useFeedback must be used within a FeedbackProvider");
  }
  return context;
}
