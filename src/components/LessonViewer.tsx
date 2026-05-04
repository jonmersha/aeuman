import React, { useState, useEffect, useMemo } from 'react';
import { 
  collection, 
  collectionGroup,
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  setDoc,
  Timestamp,
  getDoc,
  addDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { 
  BookOpen, 
  ChevronRight, 
  ChevronLeft,
  Volume2, 
  CheckCircle2, 
  Video, 
  FileText,
  Menu,
  X,
  ArrowLeft,
  ArrowRight,
  MessageSquare,
  ChevronDown,
  PlayCircle,
  Trophy,
  Users,
  Plus,
  Trash2,
  Send,
  ExternalLink,
  Download,
  Paperclip,
  MessageCircle,
  User
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { CourseChat } from './CourseChat';
import { AISummary } from './AISummary';
import { RelatedCourses } from './RelatedCourses';
import { useEnrollment } from '../hooks/useEnrollment';
import { OperationType, handleFirestoreError } from '../lib/firestore-errors';
import { Sidebar } from './LessonViewer/Sidebar';
import { Section } from './LessonViewer/types';
import { LessonContent } from './LessonViewer/LessonContent';
import { CourseOverview } from './LessonViewer/CourseOverview';
import { SectionOverview } from './LessonViewer/SectionOverview';
import { Tabs } from './LessonViewer/Tabs';
import { ResourceCard, QuestionItem } from './LessonViewer/SharedComponents';

import { ExamViewer } from './ExamViewer';

interface LessonViewerProps {
  courseId: string;
  onBack: () => void;
}

export const LessonViewer: React.FC<LessonViewerProps> = ({ courseId, onBack }) => {
  const { profile } = useAuth();
  const { enrollment, loading: enrollmentLoading } = useEnrollment(courseId);
  const [course, setCourse] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [sectionMetadata, setSectionMetadata] = useState<any[]>([]);
  const [currentLesson, setCurrentLesson] = useState<any>(null);
  const [selectedSection, setSelectedSection] = useState<any>(null);
  const [isViewingCourseOverview, setIsViewingCourseOverview] = useState(true);
  const [loading, setLoading] = useState(true);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [expandedLessons, setExpandedLessons] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'resources' | 'qa' | 'chat' | 'students' | 'contents'>('resources');
  const [isMobile, setIsMobile] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [selectedExam, setSelectedExam] = useState<string | null>(null);

  // Resource & Q&A State
  const [resources, setResources] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<{ [key: string]: any[] }>({});
  const [enrolledStudents, setEnrolledStudents] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState<{ [key: string]: string }>({});
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    // Fetch course details
    getDoc(doc(db, 'courses', courseId)).then(doc => {
      if (doc.exists()) setCourse(doc.data());
    });

    const q = query(collection(db, 'lessons'), where('courseId', '==', courseId), orderBy('order', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLessons(docs);
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'lessons'));

    // Fetch section metadata
    const sectionsQ = query(collection(db, 'sections'), where('courseId', '==', courseId), orderBy('order', 'asc'));
    const unsubSections = onSnapshot(sectionsQ, (snapshot) => {
      setSectionMetadata(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'sections'));

    let unsubEnroll: any = null;
    let unsubResources: any = null;
    let unsubQuestions: any = null;

    if (profile) {
      const enrollRef = doc(db, 'courses', courseId, 'enrollments', profile.uid);
      unsubEnroll = onSnapshot(enrollRef, (doc) => {
        if (doc.exists()) {
          setCompletedLessons(doc.data().completedLessons || []);
        }
      }, (error) => handleFirestoreError(error, OperationType.GET, `courses/${courseId}/enrollments/${profile.uid}`));

      // Fetch Resources
      const resourcesQ = query(collection(db, 'resources'), where('courseId', '==', courseId));
      unsubResources = onSnapshot(resourcesQ, (snapshot) => {
        setResources(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'resources'));

      // Fetch Questions
      const questionsQ = query(
        collection(db, 'questions'), 
        where('courseId', '==', courseId),
        orderBy('createdAt', 'desc')
      );
      unsubQuestions = onSnapshot(questionsQ, (snapshot) => {
        const qDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setQuestions(qDocs);
        
        // Fetch Answers for each question
        qDocs.forEach(q => {
          const answersQ = query(
            collection(db, 'answers'), 
            where('questionId', '==', q.id),
            orderBy('createdAt', 'asc')
          );
          onSnapshot(answersQ, (ansSnapshot) => {
            setAnswers(prev => ({
              ...prev,
              [q.id]: ansSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
            }));
          }, (error) => handleFirestoreError(error, OperationType.LIST, 'answers'));
        });
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'questions'));

      // Fetch Exams
      const examsQ = query(collection(db, 'exams'), where('courseId', '==', courseId));
      onSnapshot(examsQ, (snapshot) => {
        setExams(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'exams'));
    }

    return () => {
      unsubscribe();
      unsubSections();
      if (unsubEnroll) unsubEnroll();
      if (unsubResources) unsubResources();
      if (unsubQuestions) unsubQuestions();
    };
  }, [courseId, profile]);

  useEffect(() => {
    if (!profile || !course) return;

    const isTeacherOrAdmin = profile.role === 'admin' || profile.role === 'super_admin' || (profile.role === 'teacher' && course.teacherId === profile.uid);

    // Fetch Enrolled Students
    const enrollQ = query(
      collectionGroup(db, 'enrollments'),
      where('courseId', '==', courseId),
      where('status', '==', 'approved')
    );
    const unsubEnrollments = onSnapshot(enrollQ, (snapshot) => {
      setEnrolledStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Error fetching enrollments:", error);
    });

    return () => {
      unsubEnrollments();
    };
  }, [courseId, profile, course]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const isTeacherOrAdmin = profile?.role === 'admin' || profile?.role === 'super_admin' || (profile?.role === 'teacher' && course?.teacherId === profile?.uid);

  const handleDeleteResource = async (id: string) => {
    if (!isTeacherOrAdmin) return;
    try {
      await deleteDoc(doc(db, 'resources', id));
      setConfirmDeleteId(null);
    } catch (error) {
      console.error("Error deleting resource:", error);
    }
  };

  const handleDeleteEnrollment = async (enrollmentId: string) => {
    if (!isTeacherOrAdmin) return;
    try {
      const student = enrolledStudents.find(s => s.id === enrollmentId);
      if (!student) return;
      await deleteDoc(doc(db, 'courses', student.courseId, 'enrollments', enrollmentId));
    } catch (error) {
      console.error("Error deleting enrollment:", error);
    }
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !newQuestion.trim()) return;

    await addDoc(collection(db, 'questions'), {
      courseId,
      lessonId: currentLesson?.id || null,
      studentId: profile.uid,
      studentName: profile.displayName || 'Anonymous',
      content: newQuestion,
      createdAt: serverTimestamp()
    });
    setNewQuestion('');
  };

  const handleAddAnswer = async (questionId: string) => {
    if (!profile || !newAnswer[questionId]?.trim()) return;

    await addDoc(collection(db, 'answers'), {
      questionId,
      userId: profile.uid,
      userName: profile.displayName || 'Anonymous',
      userRole: profile.role,
      content: newAnswer[questionId],
      createdAt: serverTimestamp()
    });
    setNewAnswer(prev => ({ ...prev, [questionId]: '' }));
  };

  // Auto-expand current lesson's section and parent
  useEffect(() => {
    if (currentLesson) {
      const section = currentLesson.section || 'General';
      setExpandedSections(prev => prev.includes(section) ? prev : [...prev, section]);
      if (currentLesson.parentId) {
        setExpandedLessons(prev => prev.includes(currentLesson.parentId) ? prev : [...prev, currentLesson.parentId]);
      }
    }
  }, [currentLesson]);

  const toggleSection = (section: any) => {
    setExpandedSections(prev => 
      prev.includes(section.name) ? prev.filter(s => s !== section.name) : [...prev, section.name]
    );
    setSelectedSection(section);
    setIsViewingCourseOverview(false);
    setCurrentLesson(null);
  };

  const toggleLesson = (lessonId: string) => {
    setExpandedLessons(prev => 
      prev.includes(lessonId) ? prev.filter(id => id !== lessonId) : [...prev, lessonId]
    );
  };

  const sections = useMemo(() => {
    const grouped: { [key: string]: any[] } = {};
    
    // First, group by section
    lessons.forEach(lesson => {
      const sectionName = lesson.section || 'General';
      if (!grouped[sectionName]) grouped[sectionName] = [];
      grouped[sectionName].push(lesson);
    });

    // Get all unique section names from lessons and metadata
    const allSectionNames = Array.from(new Set([
      'General',
      ...Object.keys(grouped),
      ...sectionMetadata.map(s => s.name)
    ]));

    return allSectionNames.map(sectionName => {
      const metadata = sectionMetadata.find(s => s.name === sectionName);
      const sectionLessons = grouped[sectionName] || [];
      
      // Within each section, organize by main lessons and their sub-lessons
      const mainLessons = sectionLessons.filter(l => !l.parentId);
      const subLessons = sectionLessons.filter(l => l.parentId);

      return {
        id: metadata?.id || sectionName,
        name: sectionName,
        overview: metadata?.overview || '',
        order: metadata?.order ?? 999,
        mainLessons: mainLessons.map(main => ({
          ...main,
          subs: subLessons.filter(sub => sub.parentId === main.id)
        }))
      };
    }).sort((a, b) => a.order - b.order);
  }, [lessons, sectionMetadata]);

  const currentIndex = lessons.findIndex(l => l.id === currentLesson?.id);
  const nextLesson = currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;
  const prevLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null;

  const getYouTubeId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleTTS = async () => {
    if (!currentLesson?.content) return;
    setIsSpeaking(true);
    const { generateSpeech } = await import('../services/geminiService');
    const url = await generateSpeech(currentLesson.content);
    setAudioUrl(url);
    setIsSpeaking(false);
  };

  const toggleComplete = async () => {
    if (!profile || !currentLesson) return;
    
    const isCompleted = completedLessons.includes(currentLesson.id);
    const newCompleted = isCompleted 
      ? completedLessons.filter(id => id !== currentLesson.id)
      : [...completedLessons, currentLesson.id];
    
    const progress = lessons.length > 0 ? Math.round((newCompleted.length / lessons.length) * 100) : 0;
    
    const enrollRef = doc(db, 'courses', courseId, 'enrollments', profile.uid);
    await updateDoc(enrollRef, {
      completedLessons: newCompleted,
      progress: progress,
      lastAccessed: Timestamp.now()
    });

    if (!isCompleted) {
      const { awardPoints, checkAchievements, GAMIFICATION_POINTS } = await import('../services/gamificationService');
      await awardPoints(profile.uid, GAMIFICATION_POINTS.LESSON_COMPLETE);
      if (progress === 100) {
        await checkAchievements(profile.uid, { type: 'course', data: { progress: 100 } });
      }
    }

    // Auto open next lesson if marking as complete and not already completed
    if (!isCompleted && nextLesson) {
      setCurrentLesson(nextLesson);
      setAudioUrl(null);
    }
  };

  const progress = lessons.length > 0 ? Math.round((completedLessons.length / lessons.length) * 100) : 0;

  const handleEnroll = async () => {
    if (!profile) return;
    setIsEnrolling(true);
    try {
      const enrollRef = doc(db, 'courses', courseId, 'enrollments', profile.uid);
      await setDoc(enrollRef, {
        studentId: profile.uid,
        studentName: profile.displayName || 'Anonymous',
        courseId: courseId,
        courseTitle: course?.title || 'Unknown Course',
        status: 'approved',
        enrolledAt: Timestamp.now(),
        progress: 0,
        completedLessons: []
      });
      // Add a small delay for better user feedback
      await new Promise(resolve => setTimeout(resolve, 1500));
    } catch (error) {
      console.error("Error enrolling:", error);
      setIsEnrolling(false);
    }
  };

  if (loading || enrollmentLoading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" /></div>;

  if (selectedExam) {
    return <ExamViewer examId={selectedExam} onBack={() => setSelectedExam(null)} />;
  }



  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-zinc-900 flex flex-col overflow-hidden">
      {/* Top Menu Bar */}
      <header className="h-16 bg-zinc-900 text-white flex items-center justify-between px-4 md:px-8 shrink-0 z-20">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
            title="Back to Courses"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="hidden md:block">
            <h1 className="font-bold text-sm truncate max-w-[400px]">{course?.title || 'Course'}</h1>
            <div className="flex items-center gap-3 mt-0.5">
              <div className="w-40 h-1 bg-white dark:bg-zinc-900/10 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="bg-purple-500 h-full" 
                />
              </div>
              <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">{progress}% COMPLETE</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-6">
          <div className="hidden sm:flex items-center gap-1 bg-white/10 rounded-xl p-1">
            <button 
              onClick={() => prevLesson && setCurrentLesson(prevLesson)}
              disabled={!prevLesson}
              className="p-2 hover:bg-white/10 disabled:opacity-20 rounded-lg transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="px-4 text-[10px] font-black text-zinc-400 dark:text-zinc-500 border-x border-white/10 tracking-widest">
              {currentIndex + 1} / {lessons.length}
            </div>
            <button 
              onClick={() => nextLesson && setCurrentLesson(nextLesson)}
              disabled={!nextLesson}
              className="p-2 hover:bg-white/10 disabled:opacity-20 rounded-lg transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all text-sm font-bold"
          >
            <Menu className="w-4 h-4" />
            <span className="hidden md:inline">Contents</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Course Content Outline (Left Sidebar) */}
        {isSidebarOpen && (
          <div className={cn(
            "w-80 border-r border-zinc-200 dark:border-zinc-800 shrink-0 z-20",
            isMobile ? "absolute inset-0 z-[100] w-full bg-white dark:bg-zinc-900" : "hidden md:block"
          )}>
            <Sidebar 
              isMobile={isMobile}
              progress={progress}
              sections={sections as Section[]}
              expandedSections={expandedSections}
              expandedLessons={expandedLessons}
              completedLessons={completedLessons}
              currentLesson={currentLesson}
              selectedSection={selectedSection}
              isViewingCourseOverview={isViewingCourseOverview}
              onCloseSidebar={() => setIsSidebarOpen(false)}
              onViewOverview={() => {
                setIsViewingCourseOverview(true);
                setCurrentLesson(null);
                setSelectedSection(null);
                if (isMobile) {
                  setIsSidebarOpen(false);
                  setActiveTab('resources');
                }
              }}
              onToggleSection={toggleSection}
              onToggleLesson={toggleLesson}
              onSelectLesson={(lesson, section) => {
                setCurrentLesson(lesson);
                setSelectedSection(section);
                setIsViewingCourseOverview(false);
                setAudioUrl(null);
                if (isMobile) {
                  setIsSidebarOpen(false);
                  setActiveTab('resources');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              onSetActiveTab={setActiveTab}
            />
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-zinc-900 relative">
          
          {/* Video Player (Sticky at top) */}
          {currentLesson?.type === 'video' && currentLesson.videoUrl && !isViewingCourseOverview && (
            <div className="bg-black w-full aspect-video md:max-h-[60vh] relative shrink-0 z-10">
              {getYouTubeId(currentLesson.videoUrl) ? (
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${getYouTubeId(currentLesson.videoUrl)}?autoplay=1&rel=0&modestbranding=1`}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                ></iframe>
              ) : (
                <video 
                  src={currentLesson.videoUrl} 
                  controls 
                  autoPlay 
                  className="w-full h-full object-contain"
                >
                  Your browser does not support the video tag.
                </video>
              )}
            </div>
          )}

          {/* Scrollable Content Below Video */}
          <div className="flex-1 overflow-y-auto scroll-smooth">
            <div className="max-w-7xl mx-auto w-full">
              {activeTab === 'contents' && isMobile ? (
                <Sidebar 
                  isMobile={isMobile}
                  progress={progress}
                  sections={sections as Section[]}
                  expandedSections={expandedSections}
                  expandedLessons={expandedLessons}
                  completedLessons={completedLessons}
                  currentLesson={currentLesson}
                  selectedSection={selectedSection}
                  isViewingCourseOverview={isViewingCourseOverview}
                  onCloseSidebar={() => setIsSidebarOpen(false)}
                  onViewOverview={() => {
                    setIsViewingCourseOverview(true);
                    setCurrentLesson(null);
                    setSelectedSection(null);
                    setActiveTab('resources');
                  }}
                  onToggleSection={toggleSection}
                  onToggleLesson={toggleLesson}
                  onSelectLesson={(lesson, section) => {
                    setCurrentLesson(lesson);
                    setSelectedSection(section);
                    setIsViewingCourseOverview(false);
                    setAudioUrl(null);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  onSetActiveTab={setActiveTab}
                />
              ) : (
                <div className="flex flex-col">
                  {/* Main Content Layer - Always Visible */}
                  <div className="border-b border-zinc-100 dark:border-zinc-800">
                    <AnimatePresence mode="wait">
                      {isViewingCourseOverview ? (
                        <motion.div
                          key="course-overview"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="flex flex-col"
                        >
                          <CourseOverview 
                            course={course}
                            enrollment={enrollment}
                            sections={sections}
                            resources={resources.filter(r => !r.lessonId && (r.section === 'General' || !r.section))}
                            exams={exams}
                            isEnrolling={isEnrolling}
                            onEnroll={handleEnroll}
                            onSelectLesson={(lesson, section) => {
                              setCurrentLesson(lesson);
                              setSelectedSection(section);
                              setIsViewingCourseOverview(false);
                              setAudioUrl(null);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            onOpenExam={setSelectedExam}
                            courseId={courseId}
                          />
                        </motion.div>
                      ) : selectedSection && !currentLesson ? (
                        <motion.div
                          key={`section-${selectedSection.id}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="flex flex-col"
                        >
                          <SectionOverview 
                            selectedSection={selectedSection}
                            onSelectLesson={setCurrentLesson}
                            getYouTubeId={getYouTubeId}
                          />
                        </motion.div>
                      ) : currentLesson ? (
                        <motion.div 
                          key={currentLesson.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="flex flex-col"
                        >
                          {!(enrollment || currentLesson?.isPublic || selectedSection?.isPublic || course?.isPublic) ? (
                            <div className="p-12 text-center">
                              <h3 className="text-2xl font-bold mb-4">Enroll to access this lesson</h3>
                              <p className="text-zinc-500 dark:text-zinc-400 mb-8">This lesson is restricted. Enroll in the course to access all content.</p>
                              <button 
                                onClick={handleEnroll}
                                disabled={isEnrolling}
                                className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black text-lg hover:bg-purple-700 transition-all disabled:opacity-50"
                              >
                                {isEnrolling ? 'Enrolling...' : 'Enroll Now'}
                              </button>
                            </div>
                          ) : (
                            <>
                              <LessonContent 
                                currentLesson={currentLesson}
                                completedLessons={completedLessons}
                                isSpeaking={isSpeaking}
                                onTTS={handleTTS}
                                onToggleComplete={toggleComplete}
                                onSelectLesson={setCurrentLesson}
                                onOpenExam={setSelectedExam}
                                courseId={courseId}
                                course={course}
                                lessons={lessons}
                                exams={exams}
                                getYouTubeId={getYouTubeId}
                              />
                              
                              <div className="px-6 md:px-12 py-8 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between mt-8">
                                <button
                                  onClick={() => {
                                    if (prevLesson) {
                                      setCurrentLesson(prevLesson);
                                      window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }
                                  }}
                                  disabled={!prevLesson}
                                  className="flex items-center gap-2 px-4 md:px-6 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-xl font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all disabled:opacity-30 disabled:hover:bg-zinc-100 dark:disabled:hover:bg-zinc-800"
                                >
                                  <ChevronLeft className="w-5 h-5" />
                                  <span className="hidden sm:inline">Previous Lesson</span>
                                  <span className="sm:hidden">Previous</span>
                                </button>
                                <button
                                  onClick={() => {
                                    if (nextLesson) {
                                      setCurrentLesson(nextLesson);
                                      window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }
                                  }}
                                  disabled={!nextLesson}
                                  className="flex items-center gap-2 px-4 md:px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all disabled:opacity-30 disabled:hover:bg-emerald-600 shadow-lg shadow-emerald-200 dark:shadow-none"
                                >
                                  <span className="hidden sm:inline">Next Lesson</span>
                                  <span className="sm:hidden">Next</span>
                                  <ChevronRight className="w-5 h-5" />
                                </button>
                              </div>
                            </>
                          )}
                        </motion.div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-40">
                          <BookOpen className="w-12 h-12 text-zinc-300 mb-4" />
                          <p className="text-zinc-500">Pick a lesson to start learning.</p>
                        </div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Supplementary Tabs and Content Layer */}
                  <div className="flex flex-col">
                    <Tabs 
                      tabs={[
                        { id: 'resources', label: 'Resources' },
                        { id: 'qa', label: 'Q&A' },
                        { id: 'chat', label: 'Chat' },
                        { id: 'students', label: 'Students' }
                      ]}
                      activeTab={activeTab === 'contents' ? 'resources' : activeTab}
                      onSetActiveTab={setActiveTab as any}
                      layoutId="supplementaryTabs"
                      className="bg-zinc-50 dark:bg-zinc-900/50 sticky top-0"
                    />

                    <div className="min-h-[400px] bg-white dark:bg-zinc-900">
                      {activeTab === 'chat' ? (
                        <div className="p-6 md:p-12 animate-in fade-in duration-500">
                          <CourseChat courseId={courseId} />
                        </div>
                      ) : activeTab === 'resources' ? (
                        <div className="p-6 md:p-12 space-y-8 animate-in fade-in duration-500">
                          <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Resources & Materials</h3>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {resources.length > 0 ? (
                              resources.map(res => (
                                <ResourceCard 
                                  key={res.id} 
                                  resource={res} 
                                  onDelete={setConfirmDeleteId} 
                                  isAdmin={isTeacherOrAdmin} 
                                />
                              ))
                            ) : (
                              <div className="col-span-full py-20 text-center text-zinc-500 dark:text-zinc-400">
                                No resources found for this course.
                              </div>
                            )}
                          </div>
                        </div>
                      ) : activeTab === 'qa' ? (
                        <div className="p-6 md:p-12 space-y-8 animate-in fade-in duration-500">
                          <form onSubmit={handleAddQuestion} className="relative">
                            <textarea 
                              placeholder="Ask a question about this course..."
                              value={newQuestion}
                              onChange={e => setNewQuestion(e.target.value)}
                              className="w-full p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none min-h-[100px] resize-none pr-16 text-sm"
                              required
                            />
                            <button type="submit" className="absolute bottom-3 right-3 p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all">
                              <Send className="w-4 h-4" />
                            </button>
                          </form>
                          <div className="space-y-12">
                            {questions.length > 0 ? (
                              questions.map(q => (
                                <QuestionItem 
                                  key={q.id} 
                                  question={q} 
                                  answers={answers[q.id] || []} 
                                  newAnswer={newAnswer[q.id] || ''}
                                  onAnswerChange={(val : string) => setNewAnswer(prev => ({ ...prev, [q.id]: val }))}
                                  onAddAnswer={() => handleAddAnswer(q.id)}
                                />
                              ))
                            ) : (
                              <div className="text-center py-20 text-zinc-500 dark:text-zinc-400">
                                No questions yet. Be the first to ask!
                              </div>
                            )}
                          </div>
                        </div>
                      ) : activeTab === 'students' ? (
                        <div className="p-6 md:p-12 space-y-8 animate-in fade-in duration-500">
                          <div className="flex items-center justify-between">
                            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">Enrolled Students</h3>
                            <span className="px-4 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full text-sm font-bold text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800">
                              {enrolledStudents.length} Students
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {enrolledStudents.map(student => (
                              <div key={student.id} className="flex items-center justify-between p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm hover:border-purple-200 dark:hover:border-purple-900 transition-all group">
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-100 to-indigo-50 dark:from-zinc-800 dark:to-zinc-800 flex items-center justify-center font-bold text-purple-700 dark:text-purple-400 border border-purple-100 dark:border-zinc-700">
                                    {student.studentName?.charAt(0)}
                                  </div>
                                  <div>
                                    <div className="font-bold text-zinc-900 dark:text-white group-hover:text-purple-600 transition-colors uppercase tracking-tight">{student.studentName}</div>
                                    <div className="flex items-center gap-2 text-xs text-zinc-500 mt-0.5">
                                      <Trophy className="w-3 h-3" />
                                      <span>{student.progress || 0}% Progress</span>
                                    </div>
                                  </div>
                                </div>
                                {isTeacherOrAdmin && (
                                  <button 
                                    onClick={() => handleDeleteEnrollment(student.id)}
                                    className="p-2 opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500 transition-all rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <AnimatePresence>
          {confirmDeleteId && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            >
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-xl overflow-hidden"
              >
                <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-5">
                  <Trash2 className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Delete Resource?</h3>
                <p className="text-zinc-500 dark:text-zinc-400 dark:text-zinc-500 text-sm mb-6">
                  This action cannot be undone. This resource will be permanently removed from the course.
                </p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setConfirmDeleteId(null)}
                    className="flex-1 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl font-semibold hover:bg-zinc-200 dark:bg-zinc-700 transition-all text-sm"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => handleDeleteResource(confirmDeleteId)}
                    className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all shadow-sm text-sm"
                  >
                    Delete
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
