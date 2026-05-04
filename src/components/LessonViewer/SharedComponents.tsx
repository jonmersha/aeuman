import React from 'react';
import { FileText, Video, ExternalLink, Download, Trash2, User, Trophy, MessageCircle, Send } from 'lucide-react';

export const ResourceCard = ({ resource, onDelete, isAdmin }: any) => (
  <div className="group relative flex items-center gap-4 p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:shadow-md transition-all">
    <div className="w-10 h-10 rounded-lg bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 group-hover:bg-purple-50 group-hover:text-purple-700 dark:group-hover:text-purple-400 transition-all">
      {resource.type === 'pdf' ? <FileText className="w-5 h-5" /> : 
       resource.type === 'video' ? <Video className="w-5 h-5" /> : 
       <ExternalLink className="w-5 h-5" />}
    </div>
    <div className="flex-1 min-w-0">
      <h4 className="font-semibold text-zinc-900 dark:text-white truncate text-sm">{resource.title}</h4>
      <p className="text-xs text-zinc-500 capitalize mt-0.5">{resource.type}</p>
    </div>
    <div className="flex items-center gap-1">
      <a href={resource.url} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md text-zinc-500 hover:text-purple-700 transition-colors">
        <Download className="w-4 h-4" />
      </a>
      {isAdmin && (
        <button onClick={() => onDelete(resource.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md text-zinc-500 hover:text-red-600 transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  </div>
);

export const QuestionItem = ({ question, answers, newAnswer, onAnswerChange, onAddAnswer }: any) => (
  <div className="space-y-4">
    <div className="flex gap-4">
      <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 border border-zinc-200 dark:border-zinc-700">
        <User className="w-5 h-5 text-zinc-500" />
      </div>
      <div className="flex-1 p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold text-zinc-900 dark:text-white text-sm">{question.studentName}</h4>
          <span className="text-xs text-zinc-500">
            {question.createdAt?.toDate ? question.createdAt.toDate().toLocaleDateString() : 'Just now'}
          </span>
        </div>
        <p className="text-zinc-700 dark:text-zinc-300 text-sm leading-relaxed">{question.content}</p>
      </div>
    </div>
    <div className="ml-8 md:ml-14 space-y-4">
      {answers.map((ans: any) => (
        <div key={ans.id} className="flex gap-4">
          <div className="w-8 h-8 rounded-full bg-purple-50 dark:bg-zinc-800 flex items-center justify-center shrink-0 border border-purple-100 dark:border-zinc-700">
            {ans.userRole === 'teacher' || ans.userRole === 'admin' ? (
              <Trophy className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            ) : (
              <User className="w-4 h-4 text-zinc-500" />
            )}
          </div>
          <div className="flex-1 p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <h5 className="font-semibold text-zinc-900 dark:text-white text-sm">{ans.userName}</h5>
                {(ans.userRole === 'teacher' || ans.userRole === 'admin') && (
                  <span className="px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 text-[10px] font-bold uppercase rounded">Staff</span>
                )}
              </div>
              <span className="text-xs text-zinc-500">
                {ans.createdAt?.toDate ? ans.createdAt.toDate().toLocaleDateString() : 'Just now'}
              </span>
            </div>
            <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">{ans.content}</p>
          </div>
        </div>
      ))}
      <div className="flex gap-4">
        <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 border border-zinc-200 dark:border-zinc-700">
          <MessageCircle className="w-4 h-4 text-zinc-500" />
        </div>
        <div className="flex-1 relative">
          <input 
            type="text" 
            placeholder="Write a reply..."
            value={newAnswer}
            onChange={e => onAnswerChange(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onAddAnswer()}
            className="w-full px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm pr-10"
          />
          <button onClick={onAddAnswer} className="absolute right-1.5 top-1.5 p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
);
