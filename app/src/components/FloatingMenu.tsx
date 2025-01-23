import { Editor } from '@tiptap/react';
import { Italic as ItalicIcon, Underline as UnderlineIcon } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue } from 'framer-motion';
import textSmallIcon from '/icons/text_small.svg';
import textMediumIcon from '/icons/text_medium.svg';
import textLargeIcon from '/icons/text_large.svg';
import textBoldIcon from '/icons/text_bold.svg';
import textRegularIcon from '/icons/text_regular.svg';

interface SelectedTextStyle {
  fontWeight: number;
  fontSize: number;
}

interface FloatingMenuProps {
  editor: Editor | null;
  selectedStyle: SelectedTextStyle;
}

// 1. Create a map of weight => audio. Make sure these file paths exist in your project:
const stepSoundMap: Record<number, HTMLAudioElement> = {
  100: new Audio('/sounds/200.wav'),
  200: new Audio('/sounds/300.wav'),
  300: new Audio('/sounds/400.wav'),
  400: new Audio('/sounds/500.wav'),
  500: new Audio('/sounds/600.wav'),
  600: new Audio('/sounds/700.wav'),
  700: new Audio('/sounds/800.wav'),
  800: new Audio('/sounds/900.wav'),
  900: new Audio('/sounds/900.wav'),
};

const fontSizeSoundMap: Record<number, HTMLAudioElement> = {
  16: new Audio('/sounds/200.wav'),  // 가장 작은 소리
  17: new Audio('/sounds/300.wav'),
  18: new Audio('/sounds/400.wav'),
  19: new Audio('/sounds/500.wav'),
  20: new Audio('/sounds/600.wav'),  // 중간 크기 소리
  21: new Audio('/sounds/700.wav'),
  22: new Audio('/sounds/800.wav'),
  23: new Audio('/sounds/800.wav'),
  24: new Audio('/sounds/900.wav'),  // 가장 큰 소리
};

export const FloatingMenu = ({ editor, selectedStyle }: FloatingMenuProps) => {
  // 2. Create a ref to keep track of the last played step
  const lastStepRef = useRef<number>(100);

  const fontSizeSteps = [16, 20, 24]; // 본문, 작은 제목, 큰 제목

  const [fontWeight, setFontWeight] = useState(selectedStyle.fontWeight);
  const weightMotion = useMotionValue(selectedStyle.fontWeight);

  // 드래그 관련 상태값
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [isPointerDown, setIsPointerDown] = useState(false);
  const [startX, setStartX] = useState(0);
  // NEW: Track whether we should apply the "bounce" effect
  const [shouldBounce, setShouldBounce] = useState(false);

  // 클라이언트X 이동 거리 기준
  const DRAG_THRESHOLD = 5; // 짧은 탭과 드래그를 구분하기 위한 임계값

  // 1) Add a new state variable to store the initial weight:
  const [initialWeight, setInitialWeight] = useState(100);

  const [fontSize, setFontSize] = useState(selectedStyle.fontSize);
  const fontSizeMotion = useMotionValue(selectedStyle.fontSize);
  const [initialFontSize, setInitialFontSize] = useState(16);

  // Font size related state
  const [isAdjustingFontSize, setIsAdjustingFontSize] = useState(false);
  const [isFontSizePointerDown, setIsFontSizePointerDown] = useState(false);
  const [fontSizeStartX, setFontSizeStartX] = useState(0);
  const lastFontSizeRef = useRef<number>(16);

  const fontWeightSteps = [400, 700]; // 프리셋 굵기 값들

  // Update state when selectedStyle changes
  useEffect(() => {
    setFontWeight(selectedStyle.fontWeight);
    weightMotion.set(selectedStyle.fontWeight);
    setFontSize(selectedStyle.fontSize);
    fontSizeMotion.set(selectedStyle.fontSize);
  }, [selectedStyle, weightMotion, fontSizeMotion]);

  useEffect(() => {
    if (!editor) return;

    // If we shouldn't bounce, set the weight directly and return
    if (!shouldBounce) {
      weightMotion.set(fontWeight);
      editor.chain().focus().setFontWeight(Math.round(fontWeight)).run();
      return;
    }

    // Use ease animation instead of spring
    weightMotion.set(fontWeight);
    editor.chain().focus().setFontWeight(Math.round(fontWeight)).run();
  }, [fontWeight, editor, weightMotion, shouldBounce]);

  // 3. Use an effect to detect changes in fontWeight
  useEffect(() => {
    if (lastStepRef.current !== fontWeight) {
      // Play the audio for the new step if available
      stepSoundMap[fontWeight]?.play();
      console.log('fontWeight', fontWeight);
      lastStepRef.current = fontWeight;
    }
  }, [fontWeight]);

  useEffect(() => {
    if (!editor) return;

    if (!shouldBounce) {
      fontSizeMotion.set(fontSize);
      editor.chain().focus().setFontSize(Math.round(fontSize)).run();
      return;
    }

    // Use ease animation instead of spring
    fontSizeMotion.set(fontSize);
    editor.chain().focus().setFontSize(Math.round(fontSize)).run();
  }, [fontSize, editor, fontSizeMotion, shouldBounce]);

  useEffect(() => {
    if (lastFontSizeRef.current !== fontSize) {
      fontSizeSoundMap[fontSize]?.play();
      lastFontSizeRef.current = fontSize;
    }
  }, [fontSize]);

  // --- Bold 토글 함수 ---
  const toggleBold = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!editor) return;
    
    e.preventDefault();
    e.stopPropagation();

    // 현재 선택 영역 저장
    const { from, to } = editor.state.selection;

    // When toggling, we want to bounce
    setShouldBounce(true);

    const newWeight = editor.isActive('textStyle', { fontWeight: 700 })
      ? 400
      : 700;

    setFontWeight(newWeight);

    // setTimeout을 사용하여 이벤트 루프의 다음 틱에서 실행
    setTimeout(() => {
      editor
        .chain()
        .focus()
        .setFontWeight(newWeight)
        .setTextSelection({ from, to })
        .run();
    }, 0);
  };

  // --- Pointer Down ---
  const handleBoldPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    setIsPointerDown(true);
    setIsAdjusting(false);
    setStartX(e.clientX * 5);
    setInitialWeight(fontWeight);
  };

  // --- Pointer Move ---
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!isPointerDown) return;

      const currentX = e.clientX * 5;
      const delta = currentX - startX;

      if (Math.abs(delta) > DRAG_THRESHOLD) {
        setIsAdjusting(true);
        // If we're dragging, disable bounce
        setShouldBounce(false);

        // Use the initialWeight as our baseline, and clamp within [100, 900]
        setFontWeight(() => { // 이전 값을 사용하여 다음 값을 계산
          const nextWeight = Math.round((initialWeight + delta) / 100) * 100;
          return Math.max(100, Math.min(900, nextWeight));
        });
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (!isPointerDown) return;

      // If we never exceeded the drag threshold, treat as a tap => toggle
      if (!isAdjusting) {
        toggleBold(e as unknown as React.PointerEvent<HTMLButtonElement>);
      }
      setIsPointerDown(false);
      setIsAdjusting(false);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isPointerDown, isAdjusting, startX, initialWeight, toggleBold]);

  const toggleFontSize = () => {
    setShouldBounce(true);
    
    // Cycle through: 본문(16) -> 작은 제목(20) -> 큰 제목(24)
    const newSize = editor?.isActive('textStyle', { fontSize: 24 })
      ? 16  // 큰 제목 -> 본문
      : editor?.isActive('textStyle', { fontSize: 20 })
        ? 24  // 작은 제목 -> 큰 제목
        : 20; // 본문 -> 작은 제목
    
    setFontSize(newSize);
  };

  const handleFontSizePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsFontSizePointerDown(true);
    setIsAdjustingFontSize(false);
    setFontSizeStartX(e.clientX * 2);
    setInitialFontSize(fontSize);
  };

  useEffect(() => {
    const handleFontSizePointerMove = (e: PointerEvent) => {
      if (!isFontSizePointerDown) return;

      const currentX = e.clientX * 2;
      const delta = currentX - fontSizeStartX;

      if (Math.abs(delta) > DRAG_THRESHOLD) {
        setIsAdjustingFontSize(true);
        setShouldBounce(false);

        setFontSize(() => {
          // Allow fine-grained control during drag
          const targetSize = initialFontSize + delta / 20; // 더 섬세한 조절을 위해 나누는 수 증가
          // Clamp between 16 and 24
          return Math.max(16, Math.min(24, Math.round(targetSize)));
        });
      }
    };

    const handleFontSizePointerUp = () => {
      if (!isFontSizePointerDown) return;

      if (!isAdjustingFontSize) {
        toggleFontSize();
      }
      setIsFontSizePointerDown(false);
      setIsAdjustingFontSize(false);
    };

    window.addEventListener('pointermove', handleFontSizePointerMove);
    window.addEventListener('pointerup', handleFontSizePointerUp);

    return () => {
      window.removeEventListener('pointermove', handleFontSizePointerMove);
      window.removeEventListener('pointerup', handleFontSizePointerUp);
    };
  }, [isFontSizePointerDown, isAdjustingFontSize, fontSizeStartX, initialFontSize, fontSizeSteps]);

  if (!editor) {
    return null;
  }

  return (
    <div className="flex items-center justify-center p-2 gap-2 relative">
      {isAdjusting ? (
        <div className="flex items-center w-full justify-center space-x-2 pt-3 pb-2">
          {Array.from({ length: 9 }, (_, i) => (i + 1) * 100).map((stepValue) => {
            const isCurrent = Math.round(fontWeight / 100) * 100 === stepValue;
            const isPreset = fontWeightSteps.includes(stepValue);

            return (
              <div key={stepValue} className="flex flex-col items-center">
                <motion.span
                  className="text-xl mb-1"
                  style={{ fontWeight: stepValue }}
                  initial={{ scale: 1, y: -10 }}
                  animate={{
                    scale: isCurrent ? 1.5 : 1,
                    color: isCurrent ? '#3b82f6' : isPreset ? '#94a3b8' : '#e2e8f0'
                  }}
                  transition={{ type: 'easeInOut', duration: 0.1 }}
                >
                  B
                </motion.span>

                <div className="flex items-center">
                  <motion.div
                    className={`cursor-pointer w-0.5 h-1 pb-3 rounded-full text-xs flex items-center justify-center transition-colors ${
                      isCurrent ? 'bg-blue-500' : isPreset ? 'bg-slate-400' : 'bg-gray-200'
                    }`}
                    onPointerDown={() => {
                      setFontWeight(stepValue);
                      setShouldBounce(false);
                    }}
                    initial={{ scale: 1 }}
                    animate={{
                      scale: isCurrent ? 1.5 : isPreset ? 1.2 : 1
                    }}
                    transition={{ type: 'easeInOut', duration: 0.1 }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : isAdjustingFontSize ? (
        <div className="flex items-center w-full justify-center space-x-2 pt-3 pb-2">
          {Array.from({ length: 9 }, (_, i) => 16 + i).map((stepValue) => {
            const isCurrent = Math.round(fontSize) === stepValue;
            const isPreset = fontSizeSteps.includes(stepValue);

            return (
              <div key={stepValue} className="flex flex-col items-center">
                <motion.span
                  className="text-sm whitespace-nowrap mb-1"
                  style={{ fontSize: `${stepValue}px` }}
                  initial={{ scale: 1, y: -10 }}
                  animate={{
                    scale: isCurrent ? 1.1 : 1,
                    color: isCurrent ? '#3b82f6' : isPreset ? '#94a3b8' : '#e2e8f0'
                  }}
                  transition={{ type: 'easeInOut', duration: 0.1 }}
                >
                  A
                </motion.span>

                <div className="flex items-center">
                  <motion.div
                    className={`cursor-pointer w-0.5 h-1 pb-3 rounded-full text-xs flex items-center justify-center transition-colors ${
                      isCurrent ? 'bg-blue-500' : isPreset ? 'bg-slate-400' : 'bg-gray-200'
                    }`}
                    onPointerDown={() => {
                      setFontSize(stepValue);
                      setShouldBounce(false);
                    }}
                    initial={{ scale: 1 }}
                    animate={{
                      scale: isCurrent ? 1.5 : isPreset ? 1.2 : 1
                    }}
                    transition={{ type: 'easeInOut', duration: 0.1 }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // The normal menu buttons
        <>
          <button
            onPointerDown={handleBoldPointerDown}
            style={{ touchAction: 'none' }}
            className={`p-1 rounded hover:bg-gray-100 ${
              fontWeight >= 700 ? 'bg-gray-100' : ''
            }`}
          >
            <img 
              src={fontWeight >= 700 ? textBoldIcon : textRegularIcon}
              alt="Text weight" 
              width={24} 
              height={24}
            />
          </button>

          <button
            onPointerDown={handleFontSizePointerDown}
            style={{ touchAction: 'none' }}
            className={`p-1 rounded hover:bg-gray-100`}
          >
            <img 
              src={
                fontSize >= 24
                  ? textLargeIcon
                  : fontSize >= 20
                    ? textMediumIcon
                    : textSmallIcon
              } 
              alt="Text size" 
              width={24} 
              height={24}
            />
          </button>

          <button
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            disabled={!editor?.can().chain().focus().toggleItalic().run()}
            className={`p-2 rounded hover:bg-gray-100 ${
              editor?.isActive('italic') ? 'bg-gray-200' : ''
            }`}
          >
            <ItalicIcon size={16} />
          </button>

          <button
            onClick={() => editor?.chain().focus().toggleUnderline().run()}
            className={`p-2 rounded hover:bg-gray-100 ${
              editor?.isActive('underline') ? 'bg-gray-200' : ''
            }`}
          >
            <UnderlineIcon size={16} />
          </button>
        </>
      )}
    </div>
  );
}; 