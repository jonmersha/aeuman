import React from 'react';
import Markdown from 'react-markdown';
import { BookOpen, ExternalLink, FileText } from 'lucide-react';

interface SectionOverviewProps {
  selectedSection: any;
  onSelectLesson: (lesson: any) => void;
  getYouTubeId: (url: string) => string | null;
}

export const SectionOverview: React.FC<SectionOverviewProps> = ({
  selectedSection,
  onSelectLesson,
  getYouTubeId
}) => {
  return (
    <div className="p-6 md:p-12 space-y-8">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-brand-primary/10 text-brand-primary text-xs font-display font-bold rounded-md">
            Module Summary
          </span>
        </div>
        <h2 className="text-3xl md:text-4xl font-display font-black tracking-tight text-zinc-900 dark:text-white leading-tight">{selectedSection.name}</h2>
      </div>
      <div className="markdown-body">
        <Markdown>{selectedSection.overview || 'No overview provided for this module.'}</Markdown>
      </div>

      {selectedSection.additionalBlocks && selectedSection.additionalBlocks.length > 0 && (
        <div className="space-y-8 mt-8">
          {selectedSection.additionalBlocks.map((block: any, idx: number) => {
            if (block.type === 'text') {
              return (
                <div key={idx} className="markdown-body border-t border-zinc-100 dark:border-zinc-800 pt-8">
                  <Markdown>{block.content}</Markdown>
                </div>
              );
            }
            if (block.type === 'video') {
              return (
                <div key={idx} className="bg-black w-full aspect-video rounded-xl overflow-hidden shadow-lg relative border-t border-zinc-100 dark:border-zinc-800 pt-4 mt-4">
                  {getYouTubeId(block.content) ? (
                    <iframe
                      width="100%"
                      height="100%"
                      src={`https://www.youtube.com/embed/${getYouTubeId(block.content)}?rel=0&modestbranding=1`}
                      title={`YouTube video player ${idx + 1}`}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                    ></iframe>
                  ) : (
                    <video 
                      src={block.content} 
                      controls 
                      className="w-full h-full object-contain"
                    >
                      Your browser does not support the video tag.
                    </video>
                  )}
                </div>
              );
            }
            if (block.type === 'pdf') {
              return (
                <div key={idx} className="w-full h-[600px] border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden mt-8 border-t pt-4">
                  <iframe src={block.content} className="w-full h-full" title={`PDF Viewer ${idx}`} />
                </div>
              );
            }
            return null;
          })}
        </div>
      )}

      {/* Section Additional Resources */}
      {selectedSection.resources && selectedSection.resources.length > 0 && (
        <div className="space-y-4 pt-8 border-t border-zinc-100 dark:border-zinc-800 mt-8">
          <h3 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-purple-600" /> Additional Resources
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {selectedSection.resources.map((res: any, idx: number) => (
              <a
                key={`sec-res-${idx}`}
                href={res.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 bg-zinc-50 dark:bg-zinc-800 border border-black/5 rounded-xl hover:bg-zinc-100 transition"
              >
                <div className="w-10 h-10 rounded-full bg-white dark:bg-zinc-900 flex items-center justify-center shrink-0 shadow-sm border border-black/5">
                  <ExternalLink className="w-4 h-4 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">{res.title || 'Untitled Resource'}</p>
                  <p className="text-xs text-zinc-500 truncate">{res.url}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
      
      <div className="pt-12 border-t border-zinc-100 dark:border-zinc-800">
        <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-6">Lessons in this Section</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {selectedSection.mainLessons.map((lesson: any, idx: number) => (
            <button
              key={`section-lesson-${lesson.id}`}
              onClick={() => onSelectLesson(lesson)}
              className="flex items-center gap-4 p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:shadow-md hover:border-purple-300 transition-all text-left group"
            >
              <div className="w-10 h-10 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-500 flex items-center justify-center text-sm font-bold group-hover:bg-purple-50 group-hover:text-purple-700 group-hover:border-purple-200 transition-all">
                {idx + 1}
              </div>
              <div>
                <h4 className="font-semibold text-zinc-900 dark:text-white text-sm">{lesson.title}</h4>
                <p className="text-xs text-zinc-500 capitalize mt-0.5">{lesson.type}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
