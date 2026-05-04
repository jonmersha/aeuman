import React from 'react';
import { motion } from 'motion/react';
import { Volume2, CheckCircle2, BookOpen } from 'lucide-react';
import { cn } from '../../lib/utils';
import { AISummary } from '../AISummary';
import { RelatedCourses } from '../RelatedCourses';
import { FlashcardViewer } from '../FlashcardViewer';

interface LessonContentProps {
  currentLesson: any;
  completedLessons: string[];
  isSpeaking: boolean;
  onTTS: () => void;
  onToggleComplete: () => void;
  onSelectLesson: (lesson: any) => void;
  onOpenExam: (examId: string) => void;
  courseId: string;
  course: any;
  lessons: any[];
  exams: any[];
  getYouTubeId: (url: string) => string | null;
}

export const LessonContent: React.FC<LessonContentProps> = ({
  currentLesson,
  completedLessons,
  isSpeaking,
  onTTS,
  onToggleComplete,
  onSelectLesson,
  onOpenExam,
  courseId,
  course,
  lessons,
  exams,
  getYouTubeId
}) => {
  const isCompleted = completedLessons.includes(currentLesson.id);

  return (
    <div className="p-6 md:p-12 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold uppercase tracking-wider">
              {currentLesson.section || 'General'}
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-display font-bold tracking-tight text-zinc-900 dark:text-white">{currentLesson.title}</h2>
        </div>
        
        <div className="flex items-center gap-3 shrink-0">
          <button 
            onClick={onTTS}
            disabled={isSpeaking}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-200 dark:bg-zinc-700 transition-all disabled:opacity-50 font-semibold text-sm"
          >
            {isSpeaking ? <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" /> : <Volume2 className="w-4 h-4" />}
            Listen
          </button>
          <button 
            onClick={onToggleComplete}
            className={cn(
              "flex items-center gap-2 px-5 py-2 rounded-lg font-semibold text-sm transition-all",
              isCompleted
                ? "bg-purple-100 text-purple-700 hover:bg-purple-200"
                : "bg-zinc-900 text-white hover:bg-zinc-800"
            )}
          >
            <CheckCircle2 className="w-4 h-4" />
            {isCompleted ? 'Completed' : 'Mark Complete'}
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8 lg:gap-12">
        <div className="lg:col-span-8 space-y-8">
          {currentLesson.shortDescription && (
            <p className="text-lg text-zinc-600 dark:text-zinc-300 font-medium italic border-l-4 border-brand-primary pl-6">
              "{currentLesson.shortDescription}"
            </p>
          )}
          
          {currentLesson.type === 'flashcards' ? (
            currentLesson.flashcards?.length > 0 ? (
              <FlashcardViewer cards={currentLesson.flashcards} />
            ) : (
              <div className="flex flex-col items-center justify-center py-20 bg-zinc-50 dark:bg-zinc-800/50 rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-700">
                <p className="text-zinc-500 dark:text-zinc-400 font-medium">No flashcards are available for this lesson.</p>
              </div>
            )
          ) : (
            <div className="prose prose-zinc dark:prose-invert max-w-none shadow-sm p-4 rounded-xl border border-zinc-100 dark:border-zinc-800" dangerouslySetInnerHTML={{ __html: currentLesson.content || '<p>No detailed content provided for this lesson.</p>' }} />
          )}

          {/* Sub-lessons Grid */}
          {lessons.some(l => l.parentId === currentLesson.id) && (
            <div className="pt-8 border-t border-zinc-200 dark:border-zinc-800">
              <h3 className="text-lg font-display font-bold text-zinc-900 dark:text-white mb-6">Module Contents</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {lessons.filter(l => l.parentId === currentLesson.id).map((sub: any, idx: number) => (
                  <button
                    key={`sub-${sub.id}`}
                    onClick={() => onSelectLesson(sub)}
                    className="flex items-center gap-4 p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:shadow-md hover:border-brand-primary/30 transition-all text-left group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 flex items-center justify-center text-xs font-bold group-hover:bg-purple-50 group-hover:text-purple-700 group-hover:border-purple-200 transition-all">
                      {idx + 1}
                    </div>
                    <div>
                      <h4 className="font-semibold text-zinc-900 dark:text-white text-sm">{sub.title}</h4>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <RelatedCourses courseId={courseId} category={course?.category || ''} />

          {/* Lesson Quiz */}
          {exams.filter(e => e.lessonId === currentLesson.id).map(exam => (
            <div key={exam.id} className="mt-8 p-6 bg-purple-50 border border-purple-200 rounded-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-purple-900">{exam.title}</h3>
                  <p className="text-sm text-purple-700 mt-1">{exam.questions?.length || 0} Questions</p>
                </div>
                <button 
                  onClick={() => onOpenExam(exam.id)}
                  className="px-6 py-2 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-all"
                >
                  Take Quiz
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar Column */}
        <div className="lg:col-span-4 space-y-8">
          <div className="sticky top-8">
            <AISummary content={currentLesson.content || ''} title={currentLesson.title} />
          </div>
        </div>
      </div>
    </div>
  );
};
