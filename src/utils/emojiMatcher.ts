import { emojiDatabase, emojiKeywordIndex, EmojiData } from "@/data/emojiDatabase";

// Simple cosine similarity for semantic matching
function cosineSimilarity(str1: string, str2: string): number {
  const words1 = str1.toLowerCase().split(/\s+/);
  const words2 = str2.toLowerCase().split(/\s+/);
  
  const allWords = new Set([...words1, ...words2]);
  const vector1: number[] = [];
  const vector2: number[] = [];
  
  allWords.forEach(word => {
    vector1.push(words1.filter(w => w === word).length);
    vector2.push(words2.filter(w => w === word).length);
  });
  
  const dotProduct = vector1.reduce((sum, val, i) => sum + val * vector2[i], 0);
  const magnitude1 = Math.sqrt(vector1.reduce((sum, val) => sum + val * val, 0));
  const magnitude2 = Math.sqrt(vector2.reduce((sum, val) => sum + val * val, 0));
  
  if (magnitude1 === 0 || magnitude2 === 0) return 0;
  return dotProduct / (magnitude1 * magnitude2);
}

// Levenshtein distance for fuzzy matching
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

interface EmojiMatch {
  emoji: string;
  score: number;
  matchType: 'exact' | 'prefix' | 'semantic' | 'fuzzy';
}

export function predictEmojisForWord(word: string, maxResults: number = 5): string[] {
  if (!word || word.length < 2) return [];
  
  const normalizedWord = word.toLowerCase().trim();
  const matches: EmojiMatch[] = [];
  const seenEmojis = new Set<string>();
  
  // 1. Exact matches
  if (emojiKeywordIndex.has(normalizedWord)) {
    const emojis = emojiKeywordIndex.get(normalizedWord)!;
    emojis.forEach(emoji => {
      if (!seenEmojis.has(emoji)) {
        matches.push({ emoji, score: 100, matchType: 'exact' });
        seenEmojis.add(emoji);
      }
    });
  }
  
  // 2. Prefix matches (for partial words)
  emojiKeywordIndex.forEach((emojis, keyword) => {
    if (keyword.startsWith(normalizedWord) && keyword !== normalizedWord) {
      const score = 90 - (keyword.length - normalizedWord.length) * 2;
      emojis.forEach(emoji => {
        if (!seenEmojis.has(emoji)) {
          matches.push({ emoji, score, matchType: 'prefix' });
          seenEmojis.add(emoji);
        }
      });
    }
  });
  
  // 3. Fuzzy matches (typos, close words)
  if (matches.length < maxResults) {
    emojiKeywordIndex.forEach((emojis, keyword) => {
      if (Math.abs(keyword.length - normalizedWord.length) <= 2) {
        const distance = levenshteinDistance(normalizedWord, keyword);
        if (distance <= 2) {
          const score = 80 - (distance * 10);
          emojis.forEach(emoji => {
            if (!seenEmojis.has(emoji)) {
              matches.push({ emoji, score, matchType: 'fuzzy' });
              seenEmojis.add(emoji);
            }
          });
        }
      }
    });
  }
  
  // 4. Semantic matches (contains word in keyword)
  if (matches.length < maxResults && normalizedWord.length >= 3) {
    emojiKeywordIndex.forEach((emojis, keyword) => {
      if (keyword.includes(normalizedWord) && keyword !== normalizedWord) {
        const score = 70;
        emojis.forEach(emoji => {
          if (!seenEmojis.has(emoji)) {
            matches.push({ emoji, score, matchType: 'semantic' });
            seenEmojis.add(emoji);
          }
        });
      }
    });
  }
  
  // Sort by score and return top results
  matches.sort((a, b) => b.score - a.score);
  return matches.slice(0, maxResults).map(m => m.emoji);
}

export function predictEmojisForSentence(sentence: string, maxResults: number = 10): string[] {
  if (!sentence || sentence.trim().length === 0) return [];
  
  const normalizedSentence = sentence.toLowerCase().trim();
  const words = normalizedSentence.split(/\s+/);
  const matches: EmojiMatch[] = [];
  const seenEmojis = new Set<string>();
  
  // Analyze each word
  words.forEach(word => {
    const wordEmojis = predictEmojisForWord(word, 3);
    wordEmojis.forEach(emoji => {
      if (!seenEmojis.has(emoji)) {
        matches.push({ emoji, score: 90, matchType: 'exact' });
        seenEmojis.add(emoji);
      }
    });
  });
  
  // Semantic analysis - check for multi-word phrases
  emojiDatabase.forEach((data) => {
    let score = 0;
    let matchedKeywords = 0;
    
    data.keywords.forEach((keyword) => {
      const keywordLower = keyword.toLowerCase();
      
      // Check if keyword is in sentence
      if (normalizedSentence.includes(keywordLower)) {
        matchedKeywords++;
        score += 80;
      } else {
        // Check for semantic similarity
        const similarity = cosineSimilarity(normalizedSentence, keywordLower);
        if (similarity > 0.3) {
          matchedKeywords++;
          score += similarity * 60;
        }
      }
    });
    
    if (matchedKeywords > 0 && !seenEmojis.has(data.emoji)) {
      matches.push({
        emoji: data.emoji,
        score: score / matchedKeywords,
        matchType: 'semantic'
      });
      seenEmojis.add(data.emoji);
    }
  });
  
  // Sort by score and return top results
  matches.sort((a, b) => b.score - a.score);
  return matches.slice(0, maxResults).map(m => m.emoji);
}

// Get category-based suggestions
export function getEmojisByCategory(category: string, limit: number = 10): string[] {
  return emojiDatabase
    .filter(data => data.category === category)
    .slice(0, limit)
    .map(data => data.emoji);
}

// Get popular emojis for quick access
export function getPopularEmojis(): string[] {
  return [
    "😀", "😂", "🥰", "😍", "🤩", "😎", "🥳", "😭", "😤", "🥺",
    "👍", "👏", "🙏", "💪", "✨", "🎉", "🔥", "❤️", "💯", "✅"
  ];
}
