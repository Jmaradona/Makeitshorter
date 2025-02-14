export function countWords(text: string): number {
  // Remove extra whitespace and split into words
  const words = text
    .trim()
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .split(' ')
    .filter(word => word.length > 0);

  // Count according to our specific rules
  return words.reduce((count, word) => {
    // Skip empty words
    if (!word.trim()) return count;
    
    // Handle compound words (if not hyphenated)
    if (word.includes(' ') && !word.includes('-')) {
      return count + word.split(' ').length;
    }
    
    // All other cases count as one word:
    // - Contractions (don't)
    // - Numbers (2024)
    // - Hyphenated words (state-of-the-art)
    // - Acronyms (AI)
    return count + 1;
  }, 0);
}

export function calculateWordsFromHeight(height: number): number {
  // Average characters per line (based on standard container width)
  const charsPerLine = 85;
  // Average characters per word
  const charsPerWord = 5;
  // Line height in pixels (including spacing)
  const lineHeight = 24;
  // Container padding (top + bottom)
  const padding = 32;
  
  // Calculate available height for text
  const availableHeight = height - padding;
  // Calculate number of lines that can fit
  const numberOfLines = Math.floor(availableHeight / lineHeight);
  // Calculate words per line
  const wordsPerLine = Math.floor(charsPerLine / charsPerWord);
  // Calculate total words that can fit
  const totalWords = numberOfLines * wordsPerLine;
  
  // Return rounded number (to nearest 5)
  return Math.max(20, Math.round(totalWords / 5) * 5);
}

export function cleanAIResponse(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .replace(/_{2,}/g, '')
    .replace(/#{1,6}\s/g, '')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .trim();
}