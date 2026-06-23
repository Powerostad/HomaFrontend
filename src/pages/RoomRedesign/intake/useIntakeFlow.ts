/**
 * State for the pre-analysis intake flow (screens 1 → 2).
 *
 * Pure data + step state, isolated and easy to test. Navigation, the bad-photo
 * warning visibility, and the loading/analysis stage live in the consumer
 * (HomaIntakeFlow / RoomRedesignPage), keeping side effects out of this hook.
 *
 *   step: 'photo'   → Screen 1 (capture/upload)
 *   step: 'context' → Screen 2 (review + optional context)
 *
 * The loading + analysis stages are owned by the destination (RoomRedesignPage)
 * because the chat hook + SSE stream live there.
 */
import { useCallback, useState } from 'react';
import { prepareIntakeImage } from './intakePhoto';
import { INTAKE_COPY } from './intakeCopy';
import type { Goal, HomaIntakePayload, IntakeImage, RoomType } from './intakeTypes';

export type IntakeStep = 'photo' | 'context';

export interface UseIntakeFlow {
  step: IntakeStep;
  image: IntakeImage | null;
  /** Picked image is below the recommended minimum — warn at submit, don't block. */
  imageTooSmall: boolean;
  /** True while converting/decoding a just-picked file. */
  preparing: boolean;
  /** Persian error from the last failed pick (undecodable / empty file). */
  error: string | null;

  roomType?: RoomType;
  goals: Set<Goal>;
  note: string;

  pickImage: (file: File, source: IntakeImage['source']) => Promise<void>;
  removeImage: () => void;
  back: () => void; // context → photo

  setRoomType: (rt: RoomType) => void; // tapping the selected one clears it
  toggleGoal: (g: Goal) => void;
  setNote: (v: string) => void;

  /** Build the payload to hand to the analysis flow. Null if no photo yet. */
  buildPayload: () => HomaIntakePayload | null;
}

export function useIntakeFlow(): UseIntakeFlow {
  const [step, setStep] = useState<IntakeStep>('photo');
  const [image, setImage] = useState<IntakeImage | null>(null);
  const [imageTooSmall, setImageTooSmall] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [roomType, setRoomTypeState] = useState<RoomType | undefined>(undefined);
  const [goals, setGoals] = useState<Set<Goal>>(new Set());
  const [note, setNote] = useState('');

  const pickImage = useCallback(async (file: File, source: IntakeImage['source']) => {
    setError(null);
    setPreparing(true);
    try {
      const prepared = await prepareIntakeImage(file);
      setImage({ ...prepared.image, source });
      setImageTooSmall(prepared.tooSmall);
      setStep('context'); // advance to review once a photo exists
    } catch {
      setError(INTAKE_COPY.errors.loadImage);
    } finally {
      setPreparing(false);
    }
  }, []);

  const removeImage = useCallback(() => {
    setImage(null);
    setImageTooSmall(false);
    setError(null);
    setStep('photo');
  }, []);

  const back = useCallback(() => setStep('photo'), []);

  const setRoomType = useCallback((rt: RoomType) => {
    setRoomTypeState((prev) => (prev === rt ? undefined : rt));
  }, []);

  const toggleGoal = useCallback((g: Goal) => {
    setGoals((prev) => {
      const next = new Set(prev);
      if (next.has(g)) next.delete(g);
      else next.add(g);
      return next;
    });
  }, []);

  const buildPayload = useCallback((): HomaIntakePayload | null => {
    if (!image) return null;
    const trimmed = note.trim();
    return {
      image,
      roomType,
      goals: Array.from(goals),
      userNote: trimmed || undefined,
      createdAt: new Date().toISOString(),
    };
  }, [image, roomType, goals, note]);

  return {
    step,
    image,
    imageTooSmall,
    preparing,
    error,
    roomType,
    goals,
    note,
    pickImage,
    removeImage,
    back,
    setRoomType,
    toggleGoal,
    setNote,
    buildPayload,
  };
}
