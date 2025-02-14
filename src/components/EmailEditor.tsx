import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Wand2, Send, Sparkles } from 'lucide-react';
import ToneSelector from './ToneSelector';
import ResizableOutput from './ResizableOutput';
import { enhanceEmail } from '../services/aiService';
import { countWords, cleanAIResponse } from '../utils/textUtils';

interface Persona {
  style: string;
  formality: string;
  traits: string[];
  context: string;
}

interface EmailEditorProps {
  persona: Persona;
}

export default function EmailEditor({ persona }: EmailEditorProps) {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [outputSubject, setOutputSubject] = useState('');
  const [selectedTone, setSelectedTone] = useState('professional');
  const [selectedLength, setSelectedLength] = useState('balanced');
  const [selectedInputType, setSelectedInputType] = useState('email');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [targetWordCount, setTargetWordCount] = useState<number | null>(null);

  const calculateTargetWords = (text: string, lengthType: string): number => {
    const currentWords = countWords(text);
    console.log('Current word count:', currentWords); // Debug log
    
    const targetWords = {
      concise: Math.max(20, Math.round(currentWords * 0.5)),
      balanced: currentWords, // For 'Same Length', we use the exact current word count
      detailed: Math.max(20, Math.round(currentWords * 1.5))
    }[lengthType];
    
    console.log('Target word count:', targetWords); // Debug log
    return targetWords;
  };

  const handleEnhance = async (customWordCount?: number) => {
    if (!inputText.trim() || isLoading) return;

    setIsLoading(true);
    setError('');

    try {
      const wordCount = customWordCount ?? calculateTargetWords(inputText, selectedLength);
      console.log('Sending word count to AI:', wordCount); // Debug log
      setTargetWordCount(wordCount);

      const response = await enhanceEmail({
        content: inputText,
        tone: `${selectedTone} with ${persona.style} style, ${persona.formality} formality, in a ${persona.context} context, emphasizing ${persona.traits.join(', ')}`,
        targetWords: wordCount,
        inputType: selectedInputType,
      });

      if (response.error) {
        setError(response.error);
        return;
      }

      const content = cleanAIResponse(response.enhancedContent);
      
      const subjectMatch = content.match(/^Subject:\s*(.+)$/m);
      if (subjectMatch) {
        setOutputSubject(subjectMatch[1].trim());
        setOutputText(content.replace(/^Subject:\s*.+\n+/, '').trim());
      } else {
        setOutputText(content.trim());
      }

      // Debug log the output word count
      console.log('Output word count:', countWords(content));
    } catch (err) {
      setError('Failed to enhance content. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-200 dark:divide-gray-800 bg-white dark:bg-gray-900">
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="h-full p-8 flex flex-col"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg">
              <Wand2 className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </div>
            <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200">Input</h2>
          </div>
        </div>

        <div className="flex-1 flex flex-col space-y-6">
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Your Content
              </label>
              <span className="text-sm text-gray-500">
                {inputText ? `${countWords(inputText)} words` : ''}
              </span>
            </div>
            <div className="input-area">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 p-4 border border-gray-200 dark:border-gray-800 rounded-lg focus:ring-2 focus:ring-gray-400/20 focus:border-gray-400 dark:focus:border-gray-700 transition-all resize-none text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-900 scrollbar-thin relative z-10"
                placeholder={`Paste or write your ${selectedInputType} content here...`}
              />
            </div>
          </div>

          <ToneSelector
            selectedTone={selectedTone}
            onToneSelect={setSelectedTone}
            selectedLength={selectedLength}
            onLengthSelect={setSelectedLength}
          />

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleEnhance()}
            disabled={isLoading || !inputText.trim()}
            className="w-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 py-3 px-4 rounded-xl hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2 group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-900 dark:disabled:hover:bg-gray-100 shadow-sm"
          >
            <Sparkles className={`w-4 h-4 ${isLoading ? 'animate-spin' : 'group-hover:rotate-12 transition-transform'}`} />
            <span className="text-sm font-medium">
              {isLoading ? 'Processing...' : 'Enhance Text'}
            </span>
          </motion.button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="h-full p-8 flex flex-col"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg">
              <Send className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </div>
            <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200">Enhanced Version</h2>
          </div>
        </div>
        
        <div className="flex-1 flex flex-col">
          {error ? (
            <div className="flex-1 p-4 border border-red-200 dark:border-red-800 rounded-lg bg-red-50/50 dark:bg-red-900/10">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          ) : outputText ? (
            <ResizableOutput
              text={outputText}
              subject={outputSubject}
              onResize={handleEnhance}
              isLoading={isLoading}
              targetWordCount={targetWordCount}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center border border-gray-200 dark:border-gray-800 rounded-lg bg-gray-50 dark:bg-gray-900">
              <p className="text-gray-400 dark:text-gray-500 text-sm">Enhanced version will appear here</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}