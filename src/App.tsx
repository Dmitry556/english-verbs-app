import React, { useState, useEffect } from 'react';
import { wordsData } from './data';

interface Progress {
  day: number;
  learnedWords: Set<number>;
  completedDays: Set<number>;
  repeatedDays: Set<number>;
}

const App: React.FC = () => {
  const [showWelcome, setShowWelcome] = useState(true);
  const [showDayComplete, setShowDayComplete] = useState(false);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [currentDay, setCurrentDay] = useState(1);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [progress, setProgress] = useState<Progress>({
    day: 1,
    learnedWords: new Set(),
    completedDays: new Set(),
    repeatedDays: new Set()
  });
  const [isCardVisible, setIsCardVisible] = useState(true);
  const [animationKey, setAnimationKey] = useState(0);

  // Load progress from localStorage
  useEffect(() => {
    const savedProgress = localStorage.getItem('wordsProgress');
    if (savedProgress) {
      const parsed = JSON.parse(savedProgress);
      setProgress({
        ...parsed,
        learnedWords: new Set(parsed.learnedWords || parsed.learnedVerbs || []),
        completedDays: new Set(parsed.completedDays),
        repeatedDays: new Set(parsed.repeatedDays || [])
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
      completedDays: Array.from(progress.completedDays),
      repeatedDays: Array.from(progress.repeatedDays)
    };
    localStorage.setItem('wordsProgress', JSON.stringify(progressToSave));
  }, [progress]);

  const currentWords = wordsData[currentDay - 1] || [];
  const currentWord = currentWords[currentWordIndex];

  // Trigger animation whenever word changes
  useEffect(() => {
    setAnimationKey(prev => prev + 1);
  }, [currentDay, currentWordIndex]);

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.8;
      speechSynthesis.speak(utterance);
    }
  };

  const handleLearnedWord = () => {
    // In review mode, just move to next card without tracking progress
    if (isReviewMode) {
      if (currentWordIndex < currentWords.length - 1) {
        nextCard();
      } else {
        // Review complete - mark day as repeated
        setProgress(prev => ({
          ...prev,
          repeatedDays: new Set([...prev.repeatedDays, currentDay])
        }));
        
        // Show completion message for review
        setTimeout(() => {
          setShowDayComplete(true);
        }, 500);
      }
      return;
    }

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
      // Day completed - mark as complete and show congratulations
      setProgress(prev => ({
        ...prev,
        completedDays: new Set([...prev.completedDays, currentDay])
      }));
      
      // Show congratulations screen after a short delay
      setTimeout(() => {
        setShowDayComplete(true);
      }, 500);
    } else if (currentWordIndex < currentWords.length - 1) {
      // Move to next card if available
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

  const startReviewMode = (day: number) => {
    setCurrentDay(day);
    setCurrentWordIndex(0);
    setIsReviewMode(true);
    setShowDayComplete(false);
  };

  const exitReviewMode = () => {
    setIsReviewMode(false);
    setCurrentWordIndex(0);
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

  // Day Complete Congratulations Screen
  if (showDayComplete) {
    const nextDay = currentDay + 1;
    const isLastDay = currentDay === 10;
    const isReviewComplete = isReviewMode;
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-600 to-blue-600 p-4">
        <div className="max-w-md mx-auto text-center">
          <div className="text-8xl mb-6">{isReviewComplete ? '🔄' : '🎉'}</div>
          <h1 className="text-4xl font-bold text-white mb-4">
            {isReviewComplete ? 'Повторение завершено!' : 'Отлично!'}
          </h1>
          <p className="text-white/90 text-xl mb-2 font-semibold">
            День {currentDay} {isReviewComplete ? 'повторён!' : 'завершён!'}
          </p>
          <p className="text-white/80 text-lg mb-8 leading-relaxed">
            {isReviewComplete 
              ? "Вы успешно повторили все слова этого дня!"
              : isLastDay 
                ? "Поздравляем! Вы изучили все 50 слов!" 
                : `Вы изучили 5 новых слов.\nПереходим к дню ${nextDay}?`
            }
          </p>
          
          {isReviewComplete ? (
            <button
              onClick={() => {
                exitReviewMode();
                setShowDayComplete(false);
              }}
              className="w-full bg-white text-green-600 font-bold text-xl py-5 px-8 rounded-2xl hover:bg-green-50 transition-colors shadow-lg mb-4"
            >
              Вернуться к обучению
            </button>
          ) : !isLastDay ? (
            <button
              onClick={() => {
                setCurrentDay(nextDay);
                setCurrentWordIndex(0);
                setProgress(prev => ({ ...prev, day: nextDay }));
                setShowDayComplete(false);
              }}
              className="w-full bg-white text-green-600 font-bold text-xl py-5 px-8 rounded-2xl hover:bg-green-50 transition-colors shadow-lg mb-4"
            >
              Перейти к дню {nextDay} →
            </button>
          ) : (
            <button
              onClick={() => {
                setCurrentDay(1);
                setCurrentWordIndex(0);
                setProgress({ day: 1, learnedWords: new Set(), completedDays: new Set(), repeatedDays: new Set() });
                setShowDayComplete(false);
                setIsReviewMode(false);
                localStorage.removeItem('wordsProgress');
              }}
              className="w-full bg-white text-green-600 font-bold text-xl py-5 px-8 rounded-2xl hover:bg-green-50 transition-colors shadow-lg mb-4"
            >
              Начать заново 🔄
            </button>
          )}
          
          <button
            onClick={() => setShowDayComplete(false)}
            className="w-full bg-white/20 text-white font-medium text-lg py-3 px-6 rounded-xl hover:bg-white/30 transition-colors"
          >
            Остаться на дне {currentDay}
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
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 p-4 overscroll-behavior-none">
      <div className="max-w-md mx-auto pb-4">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">
            Изучение английских слов
          </h1>
          <div className="text-white/80 text-lg">
            День {currentDay} из 10 {isReviewMode && '(Повторение)'}
          </div>
          {isReviewMode && (
            <div className="mt-2">
              <button
                onClick={exitReviewMode}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Выйти из режима повторения
              </button>
            </div>
          )}
        </div>

        {/* Day Navigation */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => {
              if (currentDay > 1) {
                setCurrentDay(prev => prev - 1);
                setCurrentWordIndex(0);
                setProgress(prev => ({ ...prev, day: currentDay - 1 }));
              }
            }}
            disabled={currentDay === 1}
            className="px-4 py-2 bg-white/20 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← День {currentDay - 1}
          </button>
          <div className="text-white font-medium text-center">
            <div className="text-lg">{getDayProgress()}/5 слов</div>
            <div className="text-sm opacity-80">
              {getDayProgress() === 5 ? '✅ Завершён' : 'Изучается'}
            </div>
            {progress.completedDays.has(currentDay) && !isReviewMode && (
              <button
                onClick={() => startReviewMode(currentDay)}
                className="mt-2 bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg text-xs font-medium transition-colors"
              >
                🔄 Повторить день
              </button>
            )}
            {progress.repeatedDays.has(currentDay) && (
              <div className="text-xs text-green-300 mt-1">
                ↻ Повторён {progress.repeatedDays.has(currentDay) ? '1 раз' : ''}
              </div>
            )}
          </div>
          <button
            onClick={() => {
              if (currentDay < 10) {
                setCurrentDay(prev => prev + 1);
                setCurrentWordIndex(0);
                setProgress(prev => ({ ...prev, day: currentDay + 1 }));
              }
            }}
            disabled={currentDay === 10}
            className="px-4 py-2 bg-white/20 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            День {currentDay + 1} →
          </button>
        </div>

        {/* Progress Dots */}
        <div className="flex justify-center gap-2 mb-6">
          {Array.from({length: 10}, (_, i) => {
            const dayNum = i + 1;
            const isCompleted = progress.completedDays.has(dayNum);
            const isRepeated = progress.repeatedDays.has(dayNum);
            const isCurrent = dayNum === currentDay;
            
            return (
              <div
                key={i}
                className={`w-3 h-3 rounded-full progress-circle relative ${
                  isCompleted && isRepeated
                    ? 'bg-blue-400 ring-2 ring-blue-200'
                    : isCompleted
                    ? 'bg-green-400'
                    : isCurrent
                    ? 'bg-yellow-400'
                    : 'bg-white/30'
                }`}
                title={
                  isCompleted && isRepeated
                    ? `День ${dayNum}: Завершён и повторён`
                    : isCompleted
                    ? `День ${dayNum}: Завершён`
                    : isCurrent
                    ? `День ${dayNum}: Текущий`
                    : `День ${dayNum}: Не начат`
                }
              />
            );
          })}
        </div>

        {/* Word Card - Bigger */}
        <div className={`${isCardVisible ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}>
          <div className="bg-white rounded-3xl shadow-2xl p-8 mb-6 min-h-[60vh] flex flex-col justify-center">
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

            {/* Emoji Box */}
            <div className="w-28 h-28 mx-auto rounded-xl mb-8 flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100 border-2 border-blue-200 shadow-lg">
              <div key={animationKey} className="text-6xl emoji-gentle-bounce">
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

            {/* PROMINENT English Word */}
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-4 mb-6">
                <h1 className="text-7xl font-bold text-gray-800 tracking-wide">
                  {currentWord.en}
                </h1>
                <button
                  onClick={() => speakText(currentWord.en)}
                  className="speak-button text-xl"
                  aria-label="Произнести слово"
                >
                  🔊
                </button>
              </div>
              
              {/* Russian Translation */}
              <div className="text-4xl text-gray-600 font-medium">
                {currentWord.ru}
              </div>
            </div>

            {/* Example Sentence */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 mb-8 border-2 border-purple-100">
              <div className="text-center mb-3">
                <div className="text-base font-semibold text-purple-600 uppercase tracking-wide">
                  Пример использования
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1 text-center">
                  <div className="text-xl font-medium text-gray-800 leading-relaxed italic">
                    "{currentWord.ex}"
                  </div>
                </div>
                <button
                  onClick={() => speakText(currentWord.ex)}
                  className="speak-button flex-shrink-0 bg-purple-500 hover:bg-purple-600 text-white rounded-full p-4 transition-colors text-lg"
                  aria-label="Произнести пример"
                >
                  🔊
                </button>
              </div>
            </div>

            {/* Action Button - Full Width */}
            <div className="text-center">
              {isReviewMode ? (
                <button
                  onClick={handleLearnedWord}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-5 px-8 rounded-2xl transition-colors text-2xl shadow-lg"
                >
                  ↻ Повторил
                </button>
              ) : !isCurrentWordLearned() ? (
                <button
                  onClick={handleLearnedWord}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-5 px-8 rounded-2xl transition-colors text-2xl shadow-lg"
                >
                  ✓ Запомнил
                </button>
              ) : (
                <div className="w-full bg-green-100 text-green-800 font-bold py-5 px-8 rounded-2xl text-2xl text-center shadow-lg">
                  ✓ Изучено
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Arrows - Fixed Bottom */}
        <div className="flex justify-between gap-4 mt-auto pt-4">
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
            className="flex-1 py-3 bg-white/20 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed text-base font-medium active:bg-white/30 transition-colors"
          >
            ← Назад
          </button>
          <button
            onClick={nextCard}
            disabled={currentWordIndex === currentWords.length - 1}
            className="flex-1 py-3 bg-white/20 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed text-base font-medium active:bg-white/30 transition-colors"
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