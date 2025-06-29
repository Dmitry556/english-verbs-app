import React, { useState, useEffect, useRef } from 'react';
import { wordsData } from './data';

interface Progress {
  day: number;
  learnedWords: Set<number>;
  completedDays: Set<number>;
}

const App: React.FC = () => {
  const [showWelcome, setShowWelcome] = useState(true);
  const [currentDay, setCurrentDay] = useState(1);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [progress, setProgress] = useState<Progress>({
    day: 1,
    learnedWords: new Set(),
    completedDays: new Set()
  });
  const [isCardVisible, setIsCardVisible] = useState(true);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Load progress from localStorage
  useEffect(() => {
    const savedProgress = localStorage.getItem('wordsProgress');
    if (savedProgress) {
      const parsed = JSON.parse(savedProgress);
      setProgress({
        ...parsed,
        learnedWords: new Set(parsed.learnedWords || parsed.learnedVerbs || []),
        completedDays: new Set(parsed.completedDays)
      });
      setCurrentDay(parsed.day);
      setShowWelcome(false); // Hide welcome if user has progress
    }
  }, []);

  // Save progress to localStorage
  useEffect(() => {
    const progressToSave = {
      ...progress,
      learnedWords: Array.from(progress.learnedWords),
      completedDays: Array.from(progress.completedDays)
    };
    localStorage.setItem('wordsProgress', JSON.stringify(progressToSave));
  }, [progress]);

  const currentWords = wordsData[currentDay - 1] || [];
  const currentWord = currentWords[currentWordIndex];

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.8;
      speechSynthesis.speak(utterance);
    }
  };

  const handleLearnedWord = () => {
    const wordId = (currentDay - 1) * 5 + currentWordIndex;
    const newLearnedWords = new Set(progress.learnedWords);
    newLearnedWords.add(wordId);

    setProgress(prev => ({
      ...prev,
      learnedWords: newLearnedWords
    }));

    // Check if this completes the day
    const dayWords = Array.from({length: 5}, (_, i) => (currentDay - 1) * 5 + i);
    const completedWordsInDay = dayWords.filter(id => newLearnedWords.has(id)).length;
    
    if (completedWordsInDay === 5) {
      // Day completed - mark as complete and auto-advance to next day
      setProgress(prev => ({
        ...prev,
        completedDays: new Set([...prev.completedDays, currentDay])
      }));
      
      // Auto-advance to next day after a short delay
      setTimeout(() => {
        if (currentDay < 10) {
          setCurrentDay(prev => prev + 1);
          setCurrentWordIndex(0);
          setProgress(prev => ({
            ...prev,
            day: currentDay + 1
          }));
        }
      }, 1500);
    } else if (currentWordIndex < currentWords.length - 1) {
      nextCard();
    }
  };

  const nextCard = () => {
    setIsCardVisible(false);
    setTimeout(() => {
      if (currentWordIndex < currentWords.length - 1) {
        setCurrentWordIndex(prev => prev + 1);
      }
      setIsCardVisible(true);
    }, 300);
  };


  // Touch handlers for swipe navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;
    
    const currentTouch = e.targetTouches[0].clientX;
    const diff = touchStart - currentTouch;
    
    if (cardRef.current) {
      cardRef.current.style.transform = `translateX(${-diff}px)`;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;
    
    const currentTouch = e.changedTouches[0].clientX;
    const diff = touchStart - currentTouch;
    
    if (cardRef.current) {
      cardRef.current.style.transform = 'translateX(0)';
    }
    
    if (Math.abs(diff) > 50) {
      if (diff > 0 && currentWordIndex < currentWords.length - 1) {
        nextCard();
      } else if (diff < 0 && currentWordIndex > 0) {
        setIsCardVisible(false);
        setTimeout(() => {
          setCurrentWordIndex(prev => prev - 1);
          setIsCardVisible(true);
        }, 300);
      }
    }
    
    setTouchStart(null);
  };

  const getDayProgress = () => {
    const dayWords = Array.from({length: 5}, (_, i) => (currentDay - 1) * 5 + i);
    return dayWords.filter(id => progress.learnedWords.has(id)).length;
  };

  const isCurrentWordLearned = () => {
    const wordId = (currentDay - 1) * 5 + currentWordIndex;
    return progress.learnedWords.has(wordId);
  };

  // Welcome Screen
  if (showWelcome) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700 p-4">
        <div className="max-w-md mx-auto text-center">
          <div className="text-6xl mb-6">🎓</div>
          <h1 className="text-3xl font-bold text-white mb-4">
            Изучение английских слов
          </h1>
          <p className="text-white/80 text-lg mb-8 leading-relaxed">
            50 слов за 10 дней<br />
            С эмодзи и примерами
          </p>
          <button
            onClick={() => setShowWelcome(false)}
            className="w-full bg-white text-blue-600 font-bold text-xl py-4 px-8 rounded-2xl hover:bg-blue-50 transition-colors shadow-lg"
          >
            Начать обучение
          </button>
        </div>
      </div>
    );
  }

  if (!currentWord) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700">
        <div className="text-white text-xl">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">
            Изучение английских слов
          </h1>
          <div className="text-white/80 text-lg">
            День {currentDay} из 10
          </div>
        </div>

        {/* Day Progress */}
        <div className="text-center mb-6">
          <div className="text-white font-medium text-lg">
            {getDayProgress()}/5 слов изучено
          </div>
          <div className="text-white/70 text-sm mt-1">
            {getDayProgress() === 5 ? 'День завершён! 🎉' : 'Изучите все слова чтобы перейти дальше'}
          </div>
        </div>

        {/* Progress Dots */}
        <div className="flex justify-center gap-2 mb-6">
          {Array.from({length: 10}, (_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full progress-circle ${
                progress.completedDays.has(i + 1)
                  ? 'bg-green-400'
                  : i + 1 === currentDay
                  ? 'bg-yellow-400'
                  : 'bg-white/30'
              }`}
            />
          ))}
        </div>

        {/* Verb Card */}
        <div
          ref={cardRef}
          className={`card-swipe ${isCardVisible ? 'opacity-100' : 'opacity-0'}`}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="bg-white rounded-2xl shadow-2xl p-6 mb-6">
            {/* Verb Progress */}
            <div className="flex justify-center gap-2 mb-4">
              {currentWords.map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    i === currentWordIndex
                      ? 'bg-blue-500'
                      : progress.learnedWords.has((currentDay - 1) * 5 + i)
                      ? 'bg-green-500'
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>

            {/* Emoji Visual Learning */}
            <div className="w-full h-48 rounded-xl mb-4 flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100 border-2 border-blue-200 shadow-lg">
              <div className="text-9xl animate-bounce">
                {(() => {
                  const emojiMap: { [key: string]: string } = {
                    'cat': '🐱', 'dog': '🐶', 'happy': '😊', 'water': '💧', 'book': '📖',
                    'red': '🔴', 'blue': '🔵', 'car': '🚗', 'house': '🏠', 'music': '🎵',
                    'pizza': '🍕', 'coffee': '☕', 'cake': '🎂', 'ice cream': '🍦', 'chocolate': '🍫',
                    'sunny': '☀️', 'rain': '🌧️', 'snow': '❄️', 'flower': '🌸', 'tree': '🌳',
                    'dance': '💃', 'run': '🏃', 'jump': '🦘', 'swim': '🏊', 'fly': '🐦',
                    'football': '⚽', 'basketball': '🏀', 'game': '🎮', 'win': '🏆', 'celebrate': '🎉',
                    'phone': '📱', 'computer': '💻', 'internet': '🌐', 'video': '📹', 'photo': '📷',
                    'love': '❤️', 'smile': '😊', 'laugh': '😂', 'cry': '😢', 'surprise': '😲',
                    'family': '👨‍👩‍👧‍👦', 'friend': '👫', 'baby': '👶', 'mother': '👩', 'father': '👨',
                    'success': '🎯', 'dream': '💭', 'money': '💰', 'gift': '🎁', 'magic': '✨'
                  };
                  return emojiMap[currentWord.en.toLowerCase()] || '🎬';
                })()}
              </div>
            </div>

            {/* English Word */}
            <div className="text-center mb-4">
              <div className="flex items-center justify-center gap-3 mb-2">
                <h2 className="text-3xl font-bold text-gray-800">
                  {currentWord.en}
                </h2>
                <button
                  onClick={() => speakText(currentWord.en)}
                  className="speak-button"
                  aria-label="Произнести слово"
                >
                  🔊
                </button>
              </div>
              <div className="text-xl text-gray-600 mb-2">
                {currentWord.ru}
              </div>
            </div>

            {/* Example Sentence */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-5 mb-6 border-2 border-purple-100">
              <div className="text-center mb-2">
                <div className="text-sm font-semibold text-purple-600 uppercase tracking-wide">
                  Пример использования
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1 text-center">
                  <div className="text-lg font-medium text-gray-800 leading-relaxed italic">
                    "{currentWord.ex}"
                  </div>
                </div>
                <button
                  onClick={() => speakText(currentWord.ex)}
                  className="speak-button flex-shrink-0 bg-purple-500 hover:bg-purple-600 text-white rounded-full p-3 transition-colors"
                  aria-label="Произнести пример"
                >
                  🔊
                </button>
              </div>
            </div>

            {/* Action Button */}
            <div className="text-center">
              {!isCurrentWordLearned() ? (
                <button
                  onClick={handleLearnedWord}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                >
                  ✓ Запомнил
                </button>
              ) : (
                <div className="w-full bg-green-100 text-green-800 font-bold py-3 px-6 rounded-lg">
                  ✓ Изучено
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Arrows */}
        <div className="flex justify-between">
          <button
            onClick={() => {
              if (currentWordIndex > 0) {
                setIsCardVisible(false);
                setTimeout(() => {
                  setCurrentWordIndex(prev => prev - 1);
                  setIsCardVisible(true);
                }, 300);
              }
            }}
            disabled={currentWordIndex === 0}
            className="px-6 py-3 bg-white/20 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Назад
          </button>
          <button
            onClick={nextCard}
            disabled={currentWordIndex === currentWords.length - 1}
            className="px-6 py-3 bg-white/20 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Далее →
          </button>
        </div>

        {/* Completion Message */}
        {progress.completedDays.size === 10 && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Поздравляем!
              </h2>
              <p className="text-gray-600">
                Вы изучили все 50 английских слов за 10 дней!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;