import { useState, useEffect, useRef, useCallback } from "react";
import { predictEmojisForWord, predictEmojisForSentence, getPopularEmojis } from "@/utils/emojiMatcher";
import { Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const EmojiPredictor = () => {
  const [inputText, setInputText] = useState("");
  const [currentWordEmojis, setCurrentWordEmojis] = useState<string[]>([]);
  const [sentenceEmojis, setSentenceEmojis] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showSentencePrediction, setShowSentencePrediction] = useState(false);
  const [selectedEmojis, setSelectedEmojis] = useState<string[]>([]);
  
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Get current word being typed
  const getCurrentWord = useCallback((text: string, cursorPosition: number): string => {
    const beforeCursor = text.slice(0, cursorPosition);
    const words = beforeCursor.split(/\s+/);
    return words[words.length - 1] || "";
  }, []);

  // Handle real-time word prediction
  useEffect(() => {
    if (!inputText.trim()) {
      setCurrentWordEmojis([]);
      setShowSentencePrediction(false);
      return;
    }

    const cursorPosition = textareaRef.current?.selectionStart || inputText.length;
    const currentWord = getCurrentWord(inputText, cursorPosition);

    if (currentWord.length >= 2) {
      const predictions = predictEmojisForWord(currentWord, 6);
      setCurrentWordEmojis(predictions);
      setIsTyping(true);
    } else {
      setCurrentWordEmojis([]);
    }

    // Reset sentence prediction when typing
    setShowSentencePrediction(false);

    // Set timeout for sentence prediction (5 seconds of inactivity)
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      if (inputText.trim().length > 0) {
        const sentencePredictions = predictEmojisForSentence(inputText, 12);
        setSentenceEmojis(sentencePredictions);
        setShowSentencePrediction(true);
        setCurrentWordEmojis([]);
      }
    }, 5000);

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [inputText, getCurrentWord]);

  const handleEmojiClick = (emoji: string) => {
    setSelectedEmojis(prev => [...prev, emoji]);
    // Add emoji to text
    setInputText(prev => prev + emoji);
  };

  const clearAll = () => {
    setInputText("");
    setCurrentWordEmojis([]);
    setSentenceEmojis([]);
    setSelectedEmojis([]);
    setShowSentencePrediction(false);
  };

  const popularEmojis = getPopularEmojis();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="w-8 h-8 text-purple-500 animate-pulse" />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
              Emoji Predictor
            </h1>
            <Zap className="w-8 h-8 text-pink-500 animate-pulse" />
          </div>
          <p className="text-muted-foreground text-lg">
            Type and watch emojis appear in real-time! ✨
          </p>
        </div>

        {/* Main Input Area */}
        <div className="bg-card rounded-2xl shadow-xl border-2 border-purple-200 dark:border-purple-800 p-6 space-y-4 transition-all hover:shadow-2xl">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <span className="text-2xl">💭</span>
              Start typing...
            </label>
            {inputText && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="text-muted-foreground hover:text-destructive"
              >
                Clear
              </Button>
            )}
          </div>
          
          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type something like 'happy birthday' or 'coffee time'..."
            className="w-full min-h-[120px] p-4 rounded-xl border-2 border-purple-100 dark:border-purple-900 bg-background/50 focus:border-purple-400 dark:focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all resize-none text-lg"
          />

          {/* Character count */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{inputText.length} characters</span>
            <span className="flex items-center gap-1">
              {isTyping && (
                <>
                  <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Predicting...
                </>
              )}
              {showSentencePrediction && (
                <>
                  <span className="inline-block w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  Analysis complete
                </>
              )}
            </span>
          </div>
        </div>

        {/* Real-time Word Predictions */}
        {currentWordEmojis.length > 0 && (
          <div className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-2xl p-6 space-y-3 animate-scale-in border-2 border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h3 className="font-semibold text-lg text-foreground">
                Instant Predictions
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {currentWordEmojis.map((emoji, index) => (
                <button
                  key={index}
                  onClick={() => handleEmojiClick(emoji)}
                  className="text-4xl hover:scale-125 transition-transform duration-200 hover:drop-shadow-lg active:scale-110 p-2 rounded-lg hover:bg-white/50 dark:hover:bg-black/20"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Sentence Predictions */}
        {showSentencePrediction && sentenceEmojis.length > 0 && (
          <div className="bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-2xl p-6 space-y-3 animate-scale-in border-2 border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="font-semibold text-lg text-foreground">
                Complete Analysis
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {sentenceEmojis.map((emoji, index) => (
                <button
                  key={index}
                  onClick={() => handleEmojiClick(emoji)}
                  className="text-4xl hover:scale-125 transition-transform duration-200 hover:drop-shadow-lg active:scale-110 p-2 rounded-lg hover:bg-white/50 dark:hover:bg-black/20"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Selected Emojis */}
        {selectedEmojis.length > 0 && (
          <div className="bg-card rounded-2xl p-6 space-y-3 border-2 border-green-200 dark:border-green-800">
            <h3 className="font-semibold text-lg text-foreground flex items-center gap-2">
              <span className="text-2xl">✅</span>
              Selected Emojis
            </h3>
            <div className="flex flex-wrap gap-2">
              {selectedEmojis.map((emoji, index) => (
                <span
                  key={index}
                  className="text-3xl animate-scale-in p-2"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  {emoji}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Popular Emojis */}
        {!inputText && (
          <div className="bg-card rounded-2xl p-6 space-y-3 border-2 border-gray-200 dark:border-gray-800">
            <h3 className="font-semibold text-lg text-foreground flex items-center gap-2">
              <span className="text-2xl">🌟</span>
              Popular Emojis
            </h3>
            <div className="flex flex-wrap gap-2">
              {popularEmojis.map((emoji, index) => (
                <button
                  key={index}
                  onClick={() => handleEmojiClick(emoji)}
                  className="text-4xl hover:scale-125 transition-transform duration-200 hover:drop-shadow-lg active:scale-110 p-2 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Info Cards */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-900/20 dark:to-purple-900/10 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
            <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-600" />
              Real-time Mode
            </h4>
            <p className="text-sm text-muted-foreground">
              Emojis appear as you type each word (2+ characters)
            </p>
          </div>
          <div className="bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/20 dark:to-blue-900/10 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              Full Analysis
            </h4>
            <p className="text-sm text-muted-foreground">
              Complete sentence analysis after 5 seconds of inactivity
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmojiPredictor;
