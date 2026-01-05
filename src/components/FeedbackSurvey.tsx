'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';

type FeedbackState = 'good' | 'neutral' | 'bad';

interface StateConfig {
  text: string;
  bgColor: string;
  textColor: string;
  accentColor: string;
  eyeClass: string;
  mouthClass: string;
  handleSmilePath: string;
}

const stateConfigs: Record<FeedbackState, StateConfig> = {
  good: {
    text: 'خوب',
    bgColor: '#9dc183',
    textColor: '#1a4d4d',
    accentColor: '#1a4d4d',
    eyeClass: '',
    mouthClass: '',
    // Frown path from Figma (good state - rotated 180)
    handleSmilePath: 'M21.1911 16.0593C21.3953 15.2972 22.1787 14.8449 22.9407 15.049C23.7028 15.2532 24.1551 16.0366 23.951 16.7986C23.4888 18.5234 22.5131 20.1728 21.0092 21.3144C19.5446 22.426 17.7517 23.0188 15.9131 22.9995C14.0745 22.9803 12.2944 22.3502 10.8534 21.2081C9.39551 20.0526 8.47486 18.5337 8.04155 16.7696C7.8534 16.0035 8.32195 15.2299 9.0881 15.0417C9.85425 14.8536 10.6278 15.3221 10.816 16.0883C11.1086 17.2797 11.7009 18.2341 12.6281 18.969C13.5722 19.7173 14.7384 20.1302 15.943 20.1428C17.1476 20.1554 18.3223 19.7669 19.2818 19.0385C20.2021 18.34 20.8655 17.2742 21.1911 16.0593Z',
  },
  neutral: {
    text: 'معمولی',
    bgColor: '#f5dcc8',
    textColor: '#e67e22',
    accentColor: '#e67e22',
    eyeClass: 'neutral',
    mouthClass: 'neutral',
    // Frown path from Figma (neutral state - rotated 180)
    handleSmilePath: 'M21.1911 16.0593C21.3953 15.2972 22.1787 14.8449 22.9407 15.049C23.7028 15.2532 24.1551 16.0366 23.951 16.7986C23.4888 18.5234 22.5131 20.1728 21.0092 21.3144C19.5446 22.426 17.7517 23.0188 15.9131 22.9995C14.0745 22.9803 12.2944 22.3502 10.8534 21.2081C9.39551 20.0526 8.47486 18.5337 8.04155 16.7696C7.8534 16.0035 8.32195 15.2299 9.0881 15.0417C9.85425 14.8536 10.6278 15.3221 10.816 16.0883C11.1086 17.2797 11.7009 18.2341 12.6281 18.969C13.5722 19.7173 14.7384 20.1302 15.943 20.1428C17.1476 20.1554 18.3223 19.7669 19.2818 19.0385C20.2021 18.34 20.8655 17.2742 21.1911 16.0593Z',
  },
  bad: {
    text: 'بد',
    bgColor: '#ff9999',
    textColor: '#8b2e2e',
    accentColor: '#8b2e2e',
    eyeClass: '',
    mouthClass: 'bad',
    // Frown path from Figma (bad state - rotated 180)
    handleSmilePath: 'M21.1911 16.0593C21.3953 15.2972 22.1787 14.8449 22.9407 15.049C23.7028 15.2532 24.1551 16.0366 23.951 16.7986C23.4888 18.5234 22.5131 20.1728 21.0092 21.3144C19.5446 22.426 17.7517 23.0188 15.9131 22.9995C14.0745 22.9803 12.2944 22.3502 10.8534 21.2081C9.39551 20.0526 8.47486 18.5337 8.04155 16.7696C7.8534 16.0035 8.32195 15.2299 9.0881 15.0417C9.85425 14.8536 10.6278 15.3221 10.816 16.0883C11.1086 17.2797 11.7009 18.2341 12.6281 18.969C13.5722 19.7173 14.7384 20.1302 15.943 20.1428C17.1476 20.1554 18.3223 19.7669 19.2818 19.0385C20.2021 18.34 20.8655 17.2742 21.1911 16.0593Z',
  },
};

interface FeedbackSurveyProps {
  productId?: string;
  onFeedbackSubmit: (feedback: 'satisfied' | 'neutral' | 'dissatisfied' | null) => void;
}

export function FeedbackSurvey({ productId, onFeedbackSubmit }: FeedbackSurveyProps) {
  const [sliderValue, setSliderValue] = useState(100);
  const [currentState, setCurrentState] = useState<FeedbackState>('good');
  const sliderRef = useRef<HTMLInputElement>(null);
  const isSnapping = useRef(false);

  const config = stateConfigs[currentState];

  // Inject dynamic CSS for slider thumb
  useEffect(() => {
    const styleId = 'feedback-slider-styles';
    let styleEl = document.getElementById(styleId) as HTMLStyleElement;
    
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }

    const svgUrl = `data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 32 32' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='${encodeURIComponent(config.handleSmilePath)}' fill='${encodeURIComponent(config.bgColor)}' stroke='none'/%3E%3C/svg%3E`;

    styleEl.textContent = `
      .feedback-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background-color: ${config.accentColor};
        background-image: url("${svgUrl}");
        background-size: 32px 32px;
        background-position: center;
        background-repeat: no-repeat;
        cursor: grab;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        transition: all 0.2s ease;
      }

      .feedback-slider::-webkit-slider-thumb:active {
        cursor: grabbing;
        transform: scale(1.1);
      }

      .feedback-slider::-moz-range-thumb {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background-color: ${config.accentColor};
        background-image: url("${svgUrl}");
        background-size: 32px 32px;
        background-position: center;
        background-repeat: no-repeat;
        cursor: grab;
        border: none;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        transition: all 0.2s ease;
      }

      .feedback-slider::-moz-range-thumb:active {
        cursor: grabbing;
        transform: scale(1.1);
      }
    `;

    return () => {
      // Cleanup on unmount
      const el = document.getElementById(styleId);
      if (el) {
        el.remove();
      }
    };
  }, [config.accentColor, config.bgColor, config.handleSmilePath]);

  // Update state based on slider value
  const updateStateFromValue = (value: number) => {
    let newState: FeedbackState;
    if (value > 66) {
      newState = 'good';
    } else if (value > 33) {
      newState = 'neutral';
    } else {
      newState = 'bad';
    }
    setCurrentState(newState);
  };

  // Snap to nearest value (0, 50, 100)
  const snapToNearest = (value: number) => {
    if (isSnapping.current) return;
    isSnapping.current = true;

    const target = value <= 16 ? 0 : value <= 83 ? 50 : 100;
    const start = value;
    const diff = target - start;
    const duration = 150;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = progress * (2 - progress); // ease-out quad
      const newValue = Math.round(start + diff * eased);

      setSliderValue(newValue);
      updateStateFromValue(newValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        isSnapping.current = false;
      }
    };

    requestAnimationFrame(animate);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setSliderValue(value);
    updateStateFromValue(value);
  };

  const handleSliderRelease = () => {
    snapToNearest(sliderValue);
  };

  const handleSubmit = () => {
    // Convert to feedback type expected by parent
    let feedbackType: 'satisfied' | 'neutral' | 'dissatisfied' | null = null;
    if (sliderValue === 100 || currentState === 'good') {
      feedbackType = 'satisfied';
    } else if (sliderValue === 50 || currentState === 'neutral') {
      feedbackType = 'neutral';
    } else if (sliderValue === 0 || currentState === 'bad') {
      feedbackType = 'dissatisfied';
    }
    
    onFeedbackSubmit(feedbackType);
  };

  const handleSkip = () => {
    onFeedbackSubmit(null);
  };

  return (
    <motion.div
      animate={{ backgroundColor: config.bgColor }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
      className="min-h-screen flex items-center justify-center overflow-hidden"
      style={{ fontFamily: 'var(--font-family-vazirmatn)' }}
    >
      <div className="w-full max-w-[380px] h-[812px] px-10 py-10 flex flex-col items-center justify-between">
        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center w-full">
          {/* Question */}
          <motion.h1
            animate={{ color: config.textColor }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            className="text-center mb-[60px]"
            style={{
              fontSize: '24px',
              fontWeight: 'var(--font-weight-semibold)',
            }}
          >
            تجربه‌ات چطور بود؟
          </motion.h1>

          {/* Face */}
          <div className="mb-10">
            {/* Eyes */}
            <div className="flex gap-10 mb-5 justify-center">
              <motion.div
                animate={{
                  width: config.eyeClass === 'neutral' ? '80px' : '80px',
                  height: config.eyeClass === 'neutral' ? '30px' : '80px',
                  borderRadius: config.eyeClass === 'neutral' ? '40px' : '50%',
                  backgroundColor: config.accentColor,
                }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
                className="left-eye"
              />
              <motion.div
                animate={{
                  width: config.eyeClass === 'neutral' ? '80px' : '80px',
                  height: config.eyeClass === 'neutral' ? '30px' : '80px',
                  borderRadius: config.eyeClass === 'neutral' ? '40px' : '50%',
                  backgroundColor: config.accentColor,
                }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
                className="right-eye"
              />
            </div>

            {/* Mouth */}
            {config.mouthClass === 'neutral' ? (
              <motion.div
                initial={false}
                animate={{
                  borderTopColor: config.accentColor,
                  borderTopWidth: '8px',
                }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
                className="w-[60px] h-[30px] mx-auto mt-[10px]"
                style={{
                  borderTopStyle: 'solid',
                  borderLeftStyle: 'none',
                  borderRightStyle: 'none',
                  borderBottomStyle: 'none',
                  borderRadius: '60px 60px 0 0',
                }}
              />
            ) : config.mouthClass === 'bad' ? (
              <motion.div
                initial={false}
                animate={{
                  borderTopColor: config.accentColor,
                  borderLeftColor: config.accentColor,
                  borderRightColor: config.accentColor,
                  borderTopWidth: '8px',
                  borderLeftWidth: '8px',
                  borderRightWidth: '8px',
                }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
                className="w-[80px] h-[40px] mx-auto"
                style={{
                  borderTopStyle: 'solid',
                  borderLeftStyle: 'solid',
                  borderRightStyle: 'solid',
                  borderBottomStyle: 'none',
                  borderRadius: '80px 80px 0 0',
                }}
              />
            ) : (
              <motion.div
                initial={false}
                animate={{
                  borderBottomColor: config.accentColor,
                  borderLeftColor: config.accentColor,
                  borderRightColor: config.accentColor,
                  borderBottomWidth: '8px',
                  borderLeftWidth: '8px',
                  borderRightWidth: '8px',
                }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
                className="w-[80px] h-[40px] mx-auto"
                style={{
                  borderBottomStyle: 'solid',
                  borderLeftStyle: 'solid',
                  borderRightStyle: 'solid',
                  borderTopStyle: 'none',
                  borderRadius: '0 0 80px 80px',
                }}
              />
            )}
          </div>

          {/* Status Text */}
          <motion.div
            animate={{ color: config.textColor }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            className="mt-5"
            style={{
              fontSize: '80px',
              fontWeight: 'var(--font-weight-bold)',
              opacity: 0.3,
            }}
          >
            {config.text}
          </motion.div>
        </div>

        {/* Slider Container */}
        <div className="w-full py-5">
          <div className="relative w-full h-2 bg-white/30 rounded-[10px] my-5">
            {/* Progress Fill */}
            <motion.div
              animate={{ width: `${sliderValue}%` }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="absolute left-0 top-0 h-full rounded-[10px]"
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.12)',
              }}
            />

            {/* Slider Input */}
            <input
              ref={sliderRef}
              type="range"
              min="0"
              max="100"
              value={sliderValue}
              onChange={handleSliderChange}
              onMouseUp={handleSliderRelease}
              onTouchEnd={handleSliderRelease}
              onKeyUp={handleSliderRelease}
              className="feedback-slider absolute top-0 left-0 w-full h-full appearance-none bg-transparent cursor-pointer z-10"
              style={{
                WebkitAppearance: 'none',
              }}
              aria-label="اسلایدر رضایت"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={sliderValue}
            />
          </div>

          {/* Ticks */}
          <div className="flex justify-between mt-2">
            <motion.span
              animate={{
                color: config.textColor,
                opacity: currentState === 'bad' ? 1 : 0.35,
              }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              style={{
                fontWeight: 'var(--font-weight-bold)',
                fontSize: '32px',
              }}
            >
              بد
            </motion.span>
            <motion.span
              animate={{
                color: config.textColor,
                opacity: currentState === 'neutral' ? 1 : 0.35,
              }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              style={{
                fontWeight: 'var(--font-weight-bold)',
                fontSize: '32px',
              }}
            >
              معمولی
            </motion.span>
            <motion.span
              animate={{
                color: config.textColor,
                opacity: currentState === 'good' ? 1 : 0.35,
              }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              style={{
                fontWeight: 'var(--font-weight-bold)',
                fontSize: '32px',
              }}
            >
              خوب
            </motion.span>
          </div>
        </div>

        {/* Buttons */}
        <div className="w-full flex justify-between gap-5 mt-10">
          <button
            onClick={handleSkip}
            className="flex-1 py-[18px] px-[30px] border-none rounded-[30px] cursor-pointer transition-all duration-300"
            style={{
              background: 'transparent',
              color: 'rgba(0, 0, 0, 0.4)',
              fontSize: '18px',
              fontWeight: 'var(--font-weight-bold)',
              fontFamily: 'var(--font-family-vazirmatn)',
            }}
          >
            انصراف
          </button>
          <motion.button
            onClick={handleSubmit}
            whileHover={{
              y: -2,
              boxShadow: '0 8px 20px rgba(0, 0, 0, 0.2)',
            }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="flex-1 py-[18px] px-[30px] border-none rounded-[30px] cursor-pointer"
            style={{
              background: config.accentColor,
              color: '#fff',
              fontSize: '18px',
              fontWeight: 'var(--font-weight-bold)',
              fontFamily: 'var(--font-family-vazirmatn)',
            }}
          >
            ثبت ←
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}