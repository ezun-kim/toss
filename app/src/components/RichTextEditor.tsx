import { useEditor, EditorContent } from '@tiptap/react';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import Italic from '@tiptap/extension-italic';
import TextStyle from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';
import { useCallback, useEffect, useState, useRef } from 'react';
import { Extension, ChainedCommands } from '@tiptap/core';
import { RawCommands } from '@tiptap/core';
import { FloatingMenu } from './FloatingMenu';
import { motion } from 'framer-motion';
import { SelectionOverlay } from './SelectionOverlay';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

interface FloatingMenuPosition {
  x: number;
  y: number;
  show: boolean;
}

interface SelectedTextStyle {
  fontWeight: number;
  fontSize: number;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    fontWeight: {
      setFontWeight: (weight: number) => ReturnType;
      unsetFontWeight: () => ReturnType;
    };
    fontSize: {
      setFontSize: (size: number) => ReturnType;
      unsetFontSize: () => ReturnType;
    };
  }
}

const FontWeight = Extension.create({
  name: 'fontWeight',

  addOptions() {
    return {
      types: ['textStyle'],
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontWeight: {
            default: null,
            parseHTML: element => element.style.fontWeight || null,
            renderHTML: attributes => {
              if (!attributes.fontWeight) {
                return {};
              }
              return {
                style: `font-weight: ${attributes.fontWeight}`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setFontWeight: (weight: number) => ({ chain }: { chain: () => ChainedCommands }) => {
        return chain()
          .setMark('textStyle', { fontWeight: weight })
          .run();
      },
      unsetFontWeight: () => ({ chain }: { chain: () => ChainedCommands }) => {
        return chain()
          .setMark('textStyle', { fontWeight: null })
          .removeEmptyTextStyle()
          .run();
      },
    } as Partial<RawCommands>;
  },
});

const FontSize = Extension.create({
  name: 'fontSize',

  addOptions() {
    return {
      types: ['textStyle'],
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: element => element.style.fontSize?.replace('px', '') || null,
            renderHTML: attributes => {
              if (!attributes.fontSize) {
                return {};
              }
              return {
                style: `font-size: ${attributes.fontSize}px`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setFontSize: (size: number) => ({ chain }: { chain: () => ChainedCommands }) => {
        return chain()
          .setMark('textStyle', { fontSize: size })
          .run();
      },
      unsetFontSize: () => ({ chain }: { chain: () => ChainedCommands }) => {
        return chain()
          .setMark('textStyle', { fontSize: null })
          .removeEmptyTextStyle()
          .run();
      },
    } as Partial<RawCommands>;
  },
});

export const RichTextEditor = ({
  value,
  onChange,
  placeholder,
}: RichTextEditorProps) => {
  const [selectedStyle, setSelectedStyle] = useState<SelectedTextStyle>({
    fontWeight: 400,
    fontSize: 16,
  });

  const [menuPosition, setMenuPosition] = useState<FloatingMenuPosition>({
    x: 0,
    y: 0,
    show: false,
  });

  const [selectedText, setSelectedText] = useState('');
  const [overlayPosition, setOverlayPosition] = useState({ x: 0, y: 0, show: false });

  const editorRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const editor = useEditor({
    extensions: [
      Document,
      Paragraph,
      Text,
      Italic,
      TextStyle,
      FontFamily.configure({
        types: ['heading', 'paragraph'],
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
      Highlight.configure({
        multicolor: true,
      }),
      Placeholder.configure({
        placeholder: placeholder || '내용을 입력하세요...',
      }),
      FontWeight,
      FontSize,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  const updateMenuPosition = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.rangeCount) {
      setMenuPosition(prev => ({ ...prev, show: false }));
      return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    // Update selected text style
    if (editor) {
      const marks = editor.getAttributes('textStyle');
      setSelectedStyle({
        fontWeight: marks.fontWeight || 400,
        fontSize: marks.fontSize || 16,
      });
    }
    
    setMenuPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
      show: true,
    });
  }, [editor]);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const target = e.target as HTMLElement;
    const isInsideMenu = target.closest('.floating-menu');
    
    // Don't prevent default for menu interactions
    if (isInsideMenu) {
      return;
    }
    
    e.preventDefault();
    const touch = e.touches[0];
    
    // Check if touch is inside current selection
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const rects = range.getClientRects();
      let touchInSelection = false;
      
      // Check if touch point is within any of the selection rectangles
      for (let i = 0; i < rects.length; i++) {
        const rect = rects[i];
        if (
          touch.clientX >= rect.left &&
          touch.clientX <= rect.right &&
          touch.clientY >= rect.top &&
          touch.clientY <= rect.bottom
        ) {
          touchInSelection = true;
          break;
        }
      }
      
      // If touch is outside selection and not in menu, clear it
      if (!touchInSelection && !isInsideMenu) {
        selection.removeAllRanges();
        setMenuPosition(prev => ({ ...prev, show: false }));
      }
    }
    
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    const target = e.target as HTMLElement;
    const isInsideMenu = target.closest('.floating-menu');
    
    if (isInsideMenu) {
      return;
    }
    
    e.preventDefault();
    if (!touchStartRef.current) return;

    const touch = e.touches[0];
    const endX = touch.clientX;
    const endY = touch.clientY;
    const startX = touchStartRef.current.x;
    const startY = touchStartRef.current.y;

    const distance = Math.sqrt(
      Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2)
    );

    if (distance > 10) {
      const range = document.caretRangeFromPoint(endX, endY);
      if (range) {
        const selection = window.getSelection();
        if (selection) {
          const startRange = document.caretRangeFromPoint(startX, startY);
          if (startRange) {
            selection.removeAllRanges();
            const newRange = document.createRange();
            
            if (endY < startY || (endY === startY && endX < startX)) {
              newRange.setStart(range.startContainer, range.startOffset);
              newRange.setEnd(startRange.startContainer, startRange.startOffset);
            } else {
              newRange.setStart(startRange.startContainer, startRange.startOffset);
              newRange.setEnd(range.startContainer, range.startOffset);
            }
            
            selection.addRange(newRange);
            const selectedText = selection.toString();
            
            // Get the touch position relative to the viewport
            const touchRect = {
              left: touch.clientX,
              top: touch.clientY,
              width: 1,
              height: 1,
            };
            
            // Calculate the center position
            const centerX = touchRect.left;
            const centerY = touchRect.top;
            
            setSelectedText(selectedText);
            setOverlayPosition({
              x: centerX,
              y: centerY,
              show: selectedText.length > 0
            });
            updateMenuPosition();
          }
        }
      }
    }
  }, [updateMenuPosition]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!touchStartRef.current) return;

    // 움직임이 거의 없는 싱글 탭(또는 짧은 터치)을 감지
    const touch = e.changedTouches[0];
    const endX = touch.clientX;
    const endY = touch.clientY;
    const startX = touchStartRef.current.x;
    const startY = touchStartRef.current.y;
    const distance = Math.sqrt(
      Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2)
    );

    // 10px 미만으로 움직였을 경우 터치 지점에 caret 설정
    if (distance < 10) {
      const range = document.caretRangeFromPoint(endX, endY);
      if (range) {
        const selection = window.getSelection();
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(range);
          updateMenuPosition();
        }
      }
    }

    touchStartRef.current = null;
    setOverlayPosition(prev => ({ ...prev, show: false }));
  }, [updateMenuPosition]);

  useEffect(() => {
    const editorElement = editorRef.current;
    if (editorElement) {
      editorElement.addEventListener('touchstart', handleTouchStart);
      editorElement.addEventListener('touchmove', handleTouchMove);
      editorElement.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      if (editorElement) {
        editorElement.removeEventListener('touchstart', handleTouchStart);
        editorElement.removeEventListener('touchmove', handleTouchMove);
        editorElement.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  useEffect(() => {
    if (editor) {
      editor.on('selectionUpdate', updateMenuPosition);
      return () => {
        editor.off('selectionUpdate', updateMenuPosition);
      };
    }
  }, [editor, updateMenuPosition]);

  useEffect(() => {
    if (editor) {
      editor.commands.setFontFamily('Pretendard Variable');
    }
  }, [editor]);   

  useEffect(() => {
    document.addEventListener('selectionchange', updateMenuPosition);
    return () => {
      document.removeEventListener('selectionchange', updateMenuPosition);
    };
  }, [updateMenuPosition]);

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [editor, value]);

  return (
    <div className="w-full overflow-hidden bg-white" ref={editorRef}>
      <EditorContent
        editor={editor}
        className="prose max-w-none min-h-[200px] focus:outline-none text-[#4E5968] [line-height:1.5]"
      />
      {menuPosition.show && (
        <motion.div
          layout
          className="floating-menu fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg"
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          transition={{
            type: "easeInOut",
            stiffness: 300,
            damping: 30,
          }}
        >
          <FloatingMenu editor={editor} selectedStyle={selectedStyle} />
        </motion.div>
      )}
      <SelectionOverlay
        text={selectedText}
        position={{ x: overlayPosition.x, y: overlayPosition.y }}
        show={overlayPosition.show}
      />
    </div>
  );
}; 