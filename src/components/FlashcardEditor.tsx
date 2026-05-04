import React from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { motion, Reorder } from 'motion/react';

interface Flashcard {
  id: string;
  front: string;
  back: string;
}

interface FlashcardEditorProps {
  cards: Flashcard[];
  onChange: (cards: Flashcard[]) => void;
}

export const FlashcardEditor: React.FC<FlashcardEditorProps> = ({ cards = [], onChange }) => {
  const addCard = () => {
    const newCard: Flashcard = {
      id: Math.random().toString(36).substring(7),
      front: '',
      back: ''
    };
    onChange([...cards, newCard]);
  };

  const updateCard = (index: number, field: 'front' | 'back', value: string) => {
    const newCards = [...cards];
    newCards[index] = { ...newCards[index], [field]: value };
    onChange(newCards);
  };

  const removeCard = (index: number) => {
    const newCards = cards.filter((_, i) => i !== index);
    onChange(newCards);
  };

  return (
    <div className="space-y-6 bg-zinc-50 dark:bg-zinc-800/50 p-6 rounded-[2rem] border border-black/5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest px-2">Flipping Flashcards</h3>
        <button 
          onClick={addCard}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-purple-700 transition-all shadow-lg shadow-purple-200"
        >
          <Plus size={14} /> Add Card
        </button>
      </div>

      <div className="space-y-4">
        {cards.map((card, index) => (
          <motion.div 
            key={card.id || index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="group flex gap-4 items-start bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-black/5 shadow-sm hover:shadow-md transition-all"
          >
            <div className="pt-2 text-zinc-300">
              <GripVertical size={16} />
            </div>
            
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest ml-1">Front (Question/Concept)</label>
                <textarea 
                  value={card.front}
                  onChange={(e) => updateCard(index, 'front', e.target.value)}
                  placeholder="e.g. What is photosynthesis?"
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-all resize-none min-h-[100px]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest ml-1">Back (Answer/Definition)</label>
                <textarea 
                  value={card.back}
                  onChange={(e) => updateCard(index, 'back', e.target.value)}
                  placeholder="e.g. The process by which green plants and some other organisms use sunlight to synthesize nutrients..."
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-all resize-none min-h-[100px]"
                />
              </div>
            </div>

            <button 
              onClick={() => removeCard(index)}
              className="p-2 text-zinc-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all self-start mt-6"
            >
              <Trash2 size={16} />
            </button>
          </motion.div>
        ))}

        {cards.length === 0 && (
          <div className="py-12 text-center bg-white dark:bg-zinc-900 border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-[2rem]">
            <p className="text-sm text-zinc-400 dark:text-zinc-500 font-medium">No cards added yet. Start by adding your first flashcard.</p>
          </div>
        )}
      </div>
    </div>
  );
};
