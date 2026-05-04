import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

interface Tab {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onSetActiveTab: (id: any) => void;
  className?: string;
  layoutId: string;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onSetActiveTab, className, layoutId }) => {
  return (
    <div className={cn("border-b border-zinc-200 dark:border-zinc-800 flex overflow-x-auto scrollbar-hide sticky top-0 bg-white dark:bg-zinc-900 z-10", className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onSetActiveTab(tab.id)}
          className={cn(
            "px-6 py-4 text-sm font-semibold whitespace-nowrap transition-all relative",
            activeTab === tab.id ? "text-purple-700 dark:text-purple-400" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
          )}
        >
          {tab.label}
          {activeTab === tab.id && (
            <motion.div layoutId={layoutId} className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600" />
          )}
        </button>
      ))}
    </div>
  );
};
