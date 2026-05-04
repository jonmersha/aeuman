import React from 'react';
import { motion } from 'motion/react';
import { FileText, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { RelatedCourses } from '../RelatedCourses';

interface CourseOverviewProps {
  course: any;
  enrollment: any;
  sections: any[];
  resources: any[];
  exams: any[];
  isEnrolling: boolean;
  onEnroll: () => void;
  onSelectLesson: (lesson: any, section: any) => void;
  onOpenExam: (id: string) => void;
  courseId: string;
}

export const CourseOverview: React.FC<CourseOverviewProps> = ({
  course,
  enrollment,
  sections,
  resources,
  exams,
  isEnrolling,
  onEnroll,
  onSelectLesson,
  onOpenExam,
  courseId
}) => {
  return (
    <div className="p-6 md:p-12 space-y-8">
      <div className="space-y-4">
        <h2 className="text-3xl md:text-4xl font-display font-black tracking-tight text-zinc-900 dark:text-white leading-tight">Course Overview</h2>
        <p className="text-lg md:text-xl text-zinc-600 dark:text-zinc-300 font-medium leading-relaxed">{course?.title}</p>
      </div>
      <div className="prose prose-zinc dark:prose-invert max-w-none shadow-sm p-4 rounded-xl border border-zinc-100 dark:border-zinc-800" dangerouslySetInnerHTML={{ __html: course?.description || '<p>No course overview provided.</p>' }} />

      {!enrollment && (
        <div className="mt-8 p-6 bg-indigo-50 dark:bg-zinc-800 rounded-2xl border border-indigo-100 dark:border-zinc-700">
          <h3 className="font-display font-bold text-lg mb-2">Interested in this course?</h3>
          <p className="text-zinc-600 dark:text-zinc-300 mb-4">Enroll now to access all lessons, resources, and quizzes.</p>
          <button 
            onClick={onEnroll}
            disabled={isEnrolling}
            className="px-8 py-3 bg-brand-primary text-white rounded-xl font-display font-bold hover:bg-brand-secondary transition-all disabled:opacity-50"
          >
            {isEnrolling ? 'Enrolling...' : 'Enroll Now'}
          </button>
        </div>
      )}

      {sections.length > 0 && (
        <div className="pt-12 border-t border-zinc-100 dark:border-zinc-800">
          <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-6">Course Curriculum</h3>
          <div className="grid grid-cols-1 gap-4">
            {sections.map((section, idx) => (
              <div 
                key={`${section.id}-${idx}`} 
                onClick={() => {
                  if (section.mainLessons && section.mainLessons.length > 0) {
                    onSelectLesson(section.mainLessons[0], section);
                  }
                }}
                className="p-6 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-800 cursor-pointer hover:border-purple-200 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-zinc-500 dark:text-zinc-400 font-semibold text-xs uppercase tracking-wider">Section {idx + 1}</span>
                    <h4 className="font-bold text-zinc-900 dark:text-white text-lg group-hover:text-purple-600 transition-colors">{section.name}</h4>
                  </div>
                  <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:text-purple-500 transition-all group-hover:translate-x-1" />
                </div>
                {section.overview && (
                  <p className="text-zinc-600 dark:text-zinc-300 text-sm line-clamp-2 mt-2">{section.overview}</p>
                )}
                {/* Section Quiz */}
                {exams.filter(e => e.sectionId === section.id).map(exam => (
                  <div key={exam.id} className="mt-4 p-4 bg-white dark:bg-zinc-900 border border-purple-100 rounded-xl flex items-center justify-between shadow-sm">
                    <div>
                      <h5 className="font-bold text-purple-900 dark:text-purple-300">{exam.title}</h5>
                      <p className="text-xs text-purple-700 dark:text-purple-400 mt-1">{exam.questions?.length || 0} Questions</p>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenExam(exam.id);
                      }}
                      className="px-4 py-2 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-200 rounded-lg font-bold text-sm hover:bg-purple-200 transition-all"
                    >
                      Take Quiz
                    </button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Related Courses */}
      <div className="pt-12 border-t border-zinc-100 dark:border-zinc-800">
        <RelatedCourses courseId={courseId} category={course?.category || ''} />
      </div>

      {/* Resources */}
      <div className="pt-12 border-t border-zinc-100 dark:border-zinc-800">
        <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-6">Course Resources</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {resources.map(res => (
            <a 
              key={res.id} 
              href={res.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:shadow-md transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-zinc-800 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-zinc-900 dark:text-white text-sm">{res.title}</h4>
                <p className="text-xs text-zinc-500 capitalize">{res.type}</p>
              </div>
            </a>
          ))}
          {resources.length === 0 && (
            <p className="text-zinc-500 italic text-sm">No course resources available.</p>
          )}
        </div>
      </div>

      {/* Final Exam */}
      {exams.filter(e => e.type === 'final').length > 0 && (
        <div className="pt-12 border-t border-zinc-100 dark:border-zinc-800">
          <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-6">Final Certification Exam</h3>
          <div className="space-y-4">
            {exams.filter(e => e.type === 'final').map(exam => (
              <div key={exam.id} className="p-8 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-3xl border border-purple-400/20 flex flex-col md:flex-row items-center justify-between shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:scale-125 transition-transform duration-1000" />
                <div className="relative z-10 text-center md:text-left mb-6 md:mb-0">
                  <h4 className="font-display font-black text-white text-2xl md:text-3xl mb-2">{exam.title}</h4>
                  <p className="text-purple-100 font-medium">Get certified by completing the final assessment.</p>
                  <div className="flex items-center gap-4 mt-4 text-purple-100/80 text-sm font-bold uppercase tracking-wider">
                    <span>{exam.questions?.length || 0} Questions</span>
                    <span className="w-1 h-1 bg-white/30 rounded-full" />
                    <span>{exam.duration || 0} Minutes</span>
                  </div>
                </div>
                <button 
                  onClick={() => onOpenExam(exam.id)}
                  className="relative z-10 px-8 py-4 bg-white text-purple-700 rounded-2xl font-black text-lg shadow-lg hover:shadow-2xl hover:scale-105 active:scale-95 transition-all w-full md:w-auto"
                >
                  Start Exam
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
