import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';

interface SelectionOverlayProps {
  text: string;
  position: {
    x: number;
    y: number;
  };
  show: boolean;
}

const truncateText = (text: string, maxLength: number = 20) => {
  if (text.length <= maxLength) {
    return text.split('\n').map((line, i) => (
      <span key={i}>
        {line}
        {i < text.split('\n').length - 1 && <br />}
      </span>
    ));
  }
  
  const endLength = Math.floor(maxLength / 2) - 1;
  const truncated = `...${text.slice(-endLength)}`;
  
  return truncated.split('\n').map((line, i) => (
    <span key={i}>
      {line}
      {i < truncated.split('\n').length - 1 && <br />}
    </span>
  ));
};

export const SelectionOverlay = ({ text, position, show }: SelectionOverlayProps) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState(position);
  const [prevTextLength, setPrevTextLength] = useState(0);

  useEffect(() => {
    if (!show) return;
    
    const overlay = overlayRef.current;
    if (!overlay) return;

    const rect = overlay.getBoundingClientRect();
    const padding = 8;

    let x = position.x;
    let y = position.y - 60;

    if (x - rect.width < padding) {
      x = rect.width + padding;
    }
    // if (x + rect.width / 2 > window.innerWidth - padding) {
    //   x = window.innerWidth - rect.width / 2 - padding;
    // }
    if (y < padding) {
      y = padding;
    }
    if (y + rect.height > window.innerHeight - padding) {
      y = window.innerHeight - rect.height - padding;
    }

    // console.log(x, y);

    setAdjustedPosition({ x, y });
  }, [position, text, show]);

  useEffect(() => {
    if (text) {
      if (text.length > prevTextLength) {
        new Audio('/sounds/300.wav').play();
      } else if (text.length < prevTextLength) {
        new Audio('/sounds/900.wav').play();
      }
      setPrevTextLength(text.length);
    }
  }, [text]);

  return (
    <AnimatePresence>
      {text && show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed z-50 pointer-events-none"
          style={{
            left: adjustedPosition.x,
            top: adjustedPosition.y,
            transform: 'translateX(-100%)',
          }}
        >
          <motion.div
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 20 }}
            transition={{
              duration: 0.2,
              ease: "easeOut"
            }}
            className="px-3 py-2 bg-white/30 backdrop-blur-md text-black rounded-lg shadow-lg text-xl whitespace-nowrap overflow-hidden"
            style={{ maxWidth: '80vw' }}
            ref={overlayRef}
          >
            {truncateText(text)}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};