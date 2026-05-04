import React from 'react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, ChevronRight, CheckCircle2, Video, FileText } from 'lucide-react';
import { Section } from './types';

interface SidebarProps {
  isMobile: boolean;
  progress: number;
  sections: Section[];
  expandedSections: string[];
  expandedLessons: string[];
  completedLessons: string[];
  currentLesson: any;
  selectedSection: any;
  isViewingCourseOverview: boolean;
  onViewOverview: () => void;
  onToggleSection: (section: any) => void;
  onToggleLesson: (lessonId: string) => void;
  onSelectLesson: (lesson: any, section: any) => void;
  onSetActiveTab: (tab: any) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  isMobile,
  progress,
  sections,
  expandedSections,
  expandedLessons,
  completedLessons,
  currentLesson,
  selectedSection,
  isViewingCourseOverview,
  onViewOverview,
  onToggleSection,
  onToggleLesson,
  onSelectLesson,
  onSetActiveTab
}) => {
  return (
    <div className={cn("flex flex-col bg-zinc-50 dark:bg-zinc-800", isMobile ? "" : "h-full")}>
      <div className="p-6 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex flex-col gap-4 shrink-0">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-zinc-900 dark:text-white text-sm">Course Contents</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-purple-700 bg-purple-100 px-2.5 py-1 rounded-md">{progress}% COMPLETE</span>
          </div>
        </div>
        <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-purple-500"
          />
        </div>
      </div>
      
      <div className={cn("pb-20", isMobile ? "" : "flex-1 overflow-y-auto scrollbar-hide")}>
        <div className="border-b border-zinc-200 dark:border-zinc-800">
          <button 
            onClick={onViewOverview}
            className={cn(
              "w-full flex items-center gap-4 px-6 py-4 text-left transition-all group",
              isViewingCourseOverview ? "bg-purple-50/50 border-l-[4px] border-purple-600" : "hover:bg-zinc-50 dark:bg-zinc-800 border-l-[4px] border-transparent"
            )}
          >
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
              isViewingCourseOverview ? "bg-purple-100 text-purple-700" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 dark:text-zinc-500 group-hover:bg-zinc-200 dark:bg-zinc-700"
            )}>
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-0.5">Introduction</p>
              <h4 className="font-semibold text-zinc-900 dark:text-white text-sm">Course Overview</h4>
            </div>
          </button>
        </div>

        {sections.map((section, sIdx) => {
          const isExpanded = expandedSections.includes(section.name);
          const isSectionActive = selectedSection?.id === section.id && !currentLesson;
          return (
            <div key={`section-${section.name}-${sIdx}`} className="border-b border-zinc-200 dark:border-zinc-800 last:border-0">
              <button 
                onClick={() => onToggleSection(section)}
                className={cn(
                  "w-full flex items-center justify-between px-6 py-4 text-left transition-all group border-l-[4px]",
                  isSectionActive ? "bg-purple-50/50 border-purple-600" : "hover:bg-zinc-50 dark:bg-zinc-800 border-transparent"
                )}
              >
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1">Module {sIdx + 1}</p>
                  <h4 className="font-semibold text-zinc-900 dark:text-white text-sm">{section.name}</h4>
                </div>
                <div className={cn(
                  "w-6 h-6 rounded-md flex items-center justify-center transition-all",
                  isExpanded ? "bg-zinc-800 text-white rotate-90" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 dark:text-zinc-500 group-hover:bg-zinc-200 dark:bg-zinc-700"
                )}>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </button>
              
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    className="overflow-hidden bg-white dark:bg-zinc-900"
                  >
                    {section.mainLessons.map((main, index) => {
                      const hasSubs = main.subs.length > 0;
                      const isLessonExpanded = expandedLessons.includes(main.id);
                      const isActive = currentLesson?.id === main.id;
                      const isCompleted = completedLessons.includes(main.id);
                      
                      return (
                        <div key={`${main.id}-${index}`}>
                          <div className={cn(
                            "flex items-stretch group border-l-[4px] transition-all",
                            isActive ? "border-purple-600 bg-purple-50/30" : "border-transparent hover:bg-zinc-50 dark:bg-zinc-800"
                          )}>
                            <button
                              onClick={() => onSelectLesson(main, section)}
                              className="flex-1 flex items-start gap-4 px-6 py-3.5 text-left"
                            >
                              <div className={cn(
                                "mt-0.5 w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-all",
                                isCompleted 
                                  ? "bg-purple-600 border-purple-600 text-white" 
                                  : isActive 
                                    ? "border-purple-600 text-purple-600 bg-purple-50" 
                                    : "border-zinc-300 text-zinc-400 dark:text-zinc-500 bg-white dark:bg-zinc-900 group-hover:border-zinc-400"
                              )}>
                                {isCompleted ? <CheckCircle2 className="w-3 h-3" /> : <span className="text-[9px] font-bold">{main.order}</span>}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={cn(
                                  "text-sm font-medium leading-snug",
                                  isActive ? "text-purple-900 font-semibold" : "text-zinc-700 dark:text-zinc-300",
                                  isCompleted && !isActive && "text-zinc-500 dark:text-zinc-400 dark:text-zinc-500"
                                )}>{main.title}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <div className="flex items-center gap-1">
                                    {main.type === 'video' ? <Video className="w-3 h-3 text-zinc-400 dark:text-zinc-500" /> : <FileText className="w-3 h-3 text-zinc-400 dark:text-zinc-500" />}
                                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 dark:text-zinc-500 capitalize">{main.type}</span>
                                  </div>
                                  {hasSubs && (
                                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">{main.subs.length} sub-lessons</span>
                                  )}
                                </div>
                              </div>
                            </button>
                            {hasSubs && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onToggleLesson(main.id);
                                }}
                                className="px-4 hover:bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 transition-colors"
                              >
                                <ChevronRight className={cn("w-4 h-4 transition-transform duration-300", isLessonExpanded && "rotate-90")} />
                              </button>
                            )}
                          </div>

                          {/* Sub-lessons */}
                          {hasSubs && (
                            <AnimatePresence initial={false}>
                              {isLessonExpanded && (
                                <motion.div 
                                  initial={{ height: 0 }}
                                  animate={{ height: 'auto' }}
                                  exit={{ height: 0 }}
                                  className="overflow-hidden bg-zinc-50 dark:bg-zinc-800/80"
                                >
                                  {main.subs.map((sub, index) => {
                                    const isSubActive = currentLesson?.id === sub.id;
                                    const isSubCompleted = completedLessons.includes(sub.id);
                                    return (
                                      <button
                                        key={`${sub.id}-${index}`}
                                        onClick={() => onSelectLesson(sub, section)}
                                        className={cn(
                                          "w-full flex items-start gap-5 px-14 py-4 text-left transition-all border-l-[6px]",
                                          isSubActive ? "border-purple-600 bg-purple-50/60" : "border-transparent hover:bg-zinc-100 dark:bg-zinc-800"
                                        )}
                                      >
                                        <div className={cn(
                                          "mt-0.5 w-5 h-5 rounded-md flex items-center justify-center shrink-0 border-2 transition-all",
                                          isSubCompleted 
                                            ? "bg-purple-600 border-purple-600 text-white" 
                                            : isSubActive 
                                              ? "border-purple-600 text-purple-600 bg-white dark:bg-zinc-900" 
                                              : "border-zinc-200 dark:border-zinc-800 text-zinc-300 bg-white dark:bg-zinc-900"
                                        )}>
                                          {isSubCompleted ? <CheckCircle2 className="w-3 h-3" /> : <span className="text-[9px] font-black">{sub.order}</span>}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className={cn(
                                            "text-xs font-bold leading-snug tracking-tight",
                                            isSubActive ? "text-purple-900" : "text-zinc-700 dark:text-zinc-300",
                                            isSubCompleted && !isSubActive && "text-zinc-400 dark:text-zinc-500"
                                          )}>{sub.title}</p>
                                        </div>
                                      </button>
                                    );
                                  })}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          )}
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
};
