import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, MoveVertical, Loader2 } from 'lucide-react';
import { Resizable } from 're-resizable';
import { countWords, calculateWordsFromHeight } from '../utils/textUtils';

interface ResizableOutputProps {
  text: string;
  subject?: string;
  onResize: (words: number) => void;
  isLoading: boolean;
  targetWordCount: number | null;
}

export default function ResizableOutput({ 
  text, 
  subject, 
  onResize,
  isLoading,
  targetWordCount 
}: ResizableOutputProps) {
  const [isResizing, setIsResizing] = useState(false);
  const [currentHeight, setCurrentHeight] = useState(200);
  const [copiedSubject, setCopiedSubject] = useState(false);
  const [copiedContent, setCopiedContent] = useState(false);
  const [size, setSize] = useState({ width: '100%', height: 200 });
  const contentRef = useRef<HTMLDivElement>(null);
  const resizeTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (contentRef.current && text) {
      const height = Math.max(200, contentRef.current.scrollHeight + 32);
      setSize(prev => ({ ...prev, height }));
      setCurrentHeight(height);
    }
  }, [text]);

  const handleResizeStart = () => {
    setIsResizing(true);
  };

  const handleResize = (_: any, __: any, ref: HTMLElement) => {
    const newHeight = ref.clientHeight;
    setCurrentHeight(newHeight);
    setSize(prev => ({ ...prev, height: newHeight }));
  };

  const handleResizeStop = () => {
    setIsResizing(false);
    
    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current);
    }
    
    resizeTimeoutRef.current = setTimeout(() => {
      const targetWords = calculateWordsFromHeight(currentHeight);
      onResize(targetWords);
    }, 300);
  };

  const handleCopy = async (content: string, type: 'subject' | 'content') => {
    try {
      await navigator.clipboard.writeText(content);
      if (type === 'subject') {
        setCopiedSubject(true);
        setTimeout(() => setCopiedSubject(false), 2000);
      } else {
        setCopiedContent(true);
        setTimeout(() => setCopiedContent(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getWordDisplay = () => {
    if (isResizing) {
      return `Target: ${calculateWordsFromHeight(currentHeight)} words`;
    }
    return `${countWords(text)} words`;
  };

  return (
    <div className="flex-1 flex flex-col space-y-4">
      {subject && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col space-y-1.5"
        >
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Subject</label>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleCopy(subject, 'subject')}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              title="Copy subject"
            >
              {copiedSubject ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              )}
            </motion.button>
          </div>
          <input
            type="text"
            value={subject}
            readOnly
            className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
          />
        </motion.div>
      )}

      <div className="flex-1 relative">
        <Resizable
          size={size}
          onResizeStart={handleResizeStart}
          onResize={handleResize}
          onResizeStop={handleResizeStop}
          enable={{ bottom: true }}
          minHeight={100}
          maxHeight={800}
          grid={[1, 1]}
          handleStyles={{
            bottom: {
              bottom: '-12px',
              height: '24px',
              cursor: 'row-resize'
            }
          }}
          handleComponent={{
            bottom: (
              <motion.div 
                className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center cursor-ns-resize group"
                animate={{ 
                  scale: isResizing ? 1.1 : 1,
                  y: isResizing ? 2 : 0
                }}
              >
                <motion.div 
                  className="w-24 h-1.5 bg-gray-900/10 dark:bg-white/10 rounded-full group-hover:bg-gray-900/20 dark:group-hover:bg-white/20 transition-all"
                  whileHover={{ height: '6px' }}
                  animate={{
                    height: isResizing ? '6px' : '3px',
                    width: isResizing ? '120px' : '96px'
                  }}
                />
                
                <motion.div 
                  initial={false}
                  animate={{ 
                    y: isResizing ? 12 : 8,
                    scale: isResizing ? 1.05 : 1,
                    rotate: isResizing ? [-0.5, 0.5][Math.floor(Date.now() / 150) % 2] : 0
                  }}
                  className="absolute px-3 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-medium rounded-md shadow-sm flex items-center gap-1.5 whitespace-nowrap"
                >
                  {isLoading ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <MoveVertical className="w-3 h-3" />
                  )}
                  {getWordDisplay()}
                </motion.div>
              </motion.div>
            )
          }}
        >
          <div className="absolute right-2 top-2 z-10">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleCopy(text, 'content')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors shadow-sm bg-white dark:bg-gray-800"
              title="Copy content"
            >
              {copiedContent ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              )}
            </motion.button>
          </div>
          <motion.div 
            ref={contentRef}
            animate={{ 
              scale: isResizing ? 0.995 : 1,
              opacity: isLoading ? 0.5 : 1 
            }}
            className="h-full p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 scrollbar-thin overflow-auto transition-all duration-200"
          >
            <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">{text}</p>
          </motion.div>
        </Resizable>
      </div>

      {!isResizing && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 5 }}
          className="flex items-center justify-center bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full"
        >
          <MoveVertical className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
            Drag to adjust length
          </span>
        </motion.div>
      )}
    </div>
  );
}