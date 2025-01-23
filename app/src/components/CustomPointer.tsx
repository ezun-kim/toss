import { useRef, useEffect, useState } from 'react';

interface CustomPointerProps {
  isPressed: boolean;
}

export const CustomPointer = ({ isPressed }: CustomPointerProps) => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div
      ref={cursorRef}
      className="fixed pointer-events-none z-50"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -50%)',
        width: isPressed ? '15px' : '20px',
        height: isPressed ? '15px' : '20px',
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        border: '2px solid rgba(0, 0, 0, 0.5)',
        borderRadius: '50%',
        transition: 'width 150ms, height 150ms',
      }}
    />
  );
}; 