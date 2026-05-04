import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ChevronLeft, RefreshCcw } from 'lucide-react';
import { cn } from '../lib/utils';

interface Flashcard {
  id: string;
  front: string;
  back: string;
}

interface FlashcardViewerProps {
  cards: Flashcard[];
}

export const FlashcardViewer: React.FC<FlashcardViewerProps> = ({ cards = [] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [direction, setDirection] = useState(0);

  if (!cards || cards.length === 0) return null;

  const handleNext = () => {
    setDirection(1);
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % cards.length);
    }, 50);
  };

  const handlePrev = () => {
    setDirection(-1);
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
    }, 50);
  };

  const currentCard = cards[currentIndex];

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 500 : -500,
      opacity: 0,
      scale: 0.8
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 500 : -500,
      opacity: 0,
      scale: 0.8
    })
  };

  return (
    <div className="w-full max-w-2xl mx-auto py-12 px-4 space-y-8 flex flex-col items-center">
      <div className="relative w-full aspect-[4/3] md:aspect-[5/3] perspective-1000">
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
              scale: { duration: 0.4 }
            }}
            className="absolute inset-0 w-full h-full cursor-pointer"
            onClick={() => setIsFlipped(!isFlipped)}
          >
            <motion.div
              className="w-full h-full relative preserve-3d transition-all duration-700"
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* Front */}
              <div className="absolute inset-0 w-full h-full backface-hidden bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl border border-zinc-100 dark:border-zinc-800 flex flex-col items-center justify-center p-10 text-center">
                <div className="absolute top-6 left-6 text-[10px] font-black tracking-widest text-zinc-300 dark:text-zinc-600 uppercase">CONCEPT</div>
                <p className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-white leading-relaxed whitespace-pre-wrap">
                  {currentCard.front}
                </p>
                <div className="absolute bottom-6 flex items-center gap-2 text-zinc-400 text-[10px] font-bold uppercase tracking-widest">
                  <RefreshCcw size={12} className="text-emerald-500" />
                  Click to reveal answer
                </div>
              </div>

              {/* Back */}
              <div 
                className="absolute inset-0 w-full h-full backface-hidden bg-zinc-900 text-white dark:bg-emerald-600 dark:text-white rounded-[2.5rem] shadow-2xl flex flex-col items-center justify-center p-10 text-center rotateY-180"
                style={{ transform: 'rotateY(180deg)' }}
              >
                <div className="absolute top-6 left-6 text-[10px] font-black tracking-widest text-white/40 uppercase">EXPLANATION</div>
                <p className="text-xl md:text-2xl font-bold leading-relaxed whitespace-pre-wrap">
                  {currentCard.back}
                </p>
                <div className="absolute bottom-6 flex items-center gap-2 text-white/40 text-[10px] font-bold uppercase tracking-widest">
                  <RefreshCcw size={12} className="text-emerald-300" />
                  Click to see question
                </div>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-6">
        <button 
          onClick={handlePrev}
          className="p-4 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-2xl shadow-lg border border-black/5 hover:scale-110 active:scale-95 transition-all"
        >
          <ChevronLeft size={24} />
        </button>
        
        <div className="px-6 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-full text-xs font-black tracking-widest text-zinc-500">
          {currentIndex + 1} / {cards.length}
        </div>

        <button 
          onClick={handleNext}
          className="p-4 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-2xl shadow-lg hover:scale-110 active:scale-95 transition-all"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .perspective-1000 {
          perspective: 1000px;
        }
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        .rotateY-180 {
          transform: rotateY(180deg);
        }
      `}} />
    </div>
  );
};
