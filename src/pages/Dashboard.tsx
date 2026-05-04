import React, { useState, useEffect } from 'react';
import { collection, collectionGroup, query, where, onSnapshot, getDoc, doc, getDocs } from 'firebase/firestore';
import { BookOpen, CheckCircle2, GraduationCap, Trophy, Award, Star, Zap } from 'lucide-react';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { Leaderboard } from '../components/Leaderboard';

interface DashboardProps {
  onSelectCourse: (id: string) => void;
  onSelectExam: (id: string) => void;
  onBrowseSchools: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onSelectCourse, onSelectExam, onBrowseSchools }) => {
  const { profile, joinSchool } = useAuth();
  const [recentResults, setRecentResults] = useState<any[]>([]);
  const [stats, setStats] = useState({ enrolled: 0, completed: 0, avgProgress: 0, points: 0 });
  const [recentCourses, setRecentCourses] = useState<any[]>([]);
  const [schoolCourses, setSchoolCourses] = useState<any[]>([]);
  const [upcomingExams, setUpcomingExams] = useState<any[]>([]);
  const [schoolCode, setSchoolCode] = useState('');

  const handleJoinSchool = async () => {
    if (!schoolCode) return;
    await joinSchool(schoolCode);
    setSchoolCode('');
  };

  useEffect(() => {
    if (!profile || !profile.uid) {
      setStats({ enrolled: 0, completed: 0, avgProgress: 0, points: 0 });
      setRecentResults([]);
      setRecentCourses([]);
      setUpcomingExams([]);
      return;
    }

    // Set points from profile
    setStats(prev => ({ ...prev, points: profile.points || 0 }));

    // Listener for enrollments
    const enrollmentsQ = query(collectionGroup(db, 'enrollments'), where('studentId', '==', profile.uid));
    const unsubEnrollments = onSnapshot(enrollmentsQ, async (snapshot) => {
      const allDocs = snapshot.docs.map(doc => doc.data());
      const enrolledCourseIds = allDocs.filter(d => d.courseId).map(d => d.courseId);
      // Include pending in stats but maybe differentiate later if needed
      const docs = allDocs.filter(d => d.status === 'approved' || d.status === 'pending');
      const enrolled = docs.filter(d => d.courseId).length;
      const completed = docs.filter(d => d.courseId && d.progress === 100).length;
      const totalProgress = docs.filter(d => d.courseId).reduce((acc, curr) => acc + (curr.progress || 0), 0);
      const avgProgress = enrolled > 0 ? Math.round(totalProgress / enrolled) : 0;
      
      setStats(prev => ({ ...prev, enrolled, completed, avgProgress }));

      // Fetch recent courses
      const courseEnrollments = docs.filter(d => d.courseId).slice(0, 3);
      const coursePromises = courseEnrollments.map(async (e) => {
        const d = await getDoc(doc(db, 'courses', e.courseId));
        return { id: d.id, ...d.data(), progress: e.progress, enrollmentStatus: e.status };
      });
      const courses = await Promise.all(coursePromises);
      const validCourses = courses.filter((c: any) => c && c.title);
      const uniqueCourses = Array.from(new Map(validCourses.map((c: any) => [c.id, c])).values());
      setRecentCourses(uniqueCourses);

      // Fetch school courses (not yet enrolled)
      if (profile.schoolId) {
        const schoolCoursesQ = query(collection(db, 'courses'), where('schoolId', '==', profile.schoolId));
        const schoolSnapshot = await getDocs(schoolCoursesQ);
        const sCourses = schoolSnapshot.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter((c: any) => !enrolledCourseIds.includes(c.id))
          .slice(0, 3);
        setSchoolCourses(sCourses);
      } else {
        setSchoolCourses([]);
      }
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'enrollments'));

    // Listener for exam results
    const resultsQ = query(collection(db, 'examResults'), where('studentId', '==', profile.uid));
    const unsubResults = onSnapshot(resultsQ, async (resultsSnapshot) => {
      const results = resultsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStats(prev => ({ ...prev, examsTaken: results.length }));
      
      const sortedResults = [...results].sort((a: any, b: any) => (b.completedAt?.toMillis() || 0) - (a.completedAt?.toMillis() || 0)).slice(0, 3);
      setRecentResults(sortedResults);

      // Fetch upcoming exams (subscribed but not taken or attempts remaining)
      // We need the enrollments to know which exams the student is subscribed to
      // This is a bit tricky since we separated the listeners. 
      // We'll use a separate effect or just fetch them here by querying enrollments once.
      try {
        const enrollmentsSnap = await getDocs(query(
          collectionGroup(db, 'enrollments'), 
          where('studentId', '==', profile.uid),
          where('status', '==', 'approved')
        ));
        const examEnrollments = enrollmentsSnap.docs.map(d => d.data()).filter((d: any) => d.examId);
        
        const examPromises = examEnrollments.map(async (e: any) => {
          const studentResultsForExam = results.filter((r: any) => r.examId === e.examId);
          const examDoc = await getDoc(doc(db, 'exams', e.examId));
          if (!examDoc.exists()) return null;
          
          const examData = examDoc.data();
          const maxAttempts = examData.maxAttempts || 0;
          
          if (studentResultsForExam.length === 0 || (maxAttempts > 0 && studentResultsForExam.length < maxAttempts)) {
            return { id: examDoc.id, ...examData };
          }
          return null;
        });
        const exams = await Promise.all(examPromises);
        const validExams = exams.filter(e => e !== null);
        const uniqueExams = Array.from(new Map(validExams.map((e: any) => [e.id, e])).values());
        setUpcomingExams(uniqueExams.slice(0, 3));
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'enrollments');
      }
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'examResults'));

    return () => {
      unsubEnrollments();
      unsubResults();
    };
  }, [profile]);
  
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight dark:text-white">Welcome back, {profile?.displayName}</h1>
        <p className="text-zinc-500 dark:text-zinc-400 dark:text-zinc-500 mt-1">Here's what's happening with your learning today.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="p-6 bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/5 rounded-2xl shadow-sm">
          <div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center mb-4">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-zinc-500 dark:text-zinc-400 dark:text-zinc-500 text-sm font-medium uppercase tracking-wider">Courses</h3>
          <p className="text-3xl font-bold mt-1 dark:text-white">{stats.enrolled}</p>
        </div>
        
        <div className="p-6 bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/5 rounded-2xl shadow-sm">
          <div className="w-10 h-10 bg-emerald-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center mb-4">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-zinc-500 dark:text-zinc-400 dark:text-zinc-500 text-sm font-medium uppercase tracking-wider">Completed</h3>
          <p className="text-3xl font-bold mt-1 dark:text-white">{stats.completed}</p>
        </div>

        <div className="p-6 bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/5 rounded-2xl shadow-sm">
          <div className="w-10 h-10 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center mb-4">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h3 className="text-zinc-500 dark:text-zinc-400 dark:text-zinc-500 text-sm font-medium uppercase tracking-wider">Avg Progress</h3>
          <p className="text-3xl font-bold mt-1 dark:text-white">{stats.avgProgress}%</p>
        </div>

        <div className="p-6 bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/5 rounded-2xl shadow-sm">
          <div className="w-10 h-10 bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center mb-4">
            <Star className="w-6 h-6" />
          </div>
          <h3 className="text-zinc-500 dark:text-zinc-400 dark:text-zinc-500 text-sm font-medium uppercase tracking-wider">Total Points</h3>
          <p className="text-3xl font-bold mt-1 dark:text-white">{stats.points}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold dark:text-white">My Badges</h2>
              <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500">
                {profile?.badges?.length || 0} Earned
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {profile?.badges && profile.badges.length > 0 ? profile.badges.map((badge: any) => (
                <div key={badge.id} className="p-4 bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/10 rounded-2xl flex flex-col items-center text-center gap-2 group hover:scale-105 transition-transform cursor-default">
                  <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-full flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
                    {badge.icon === 'zap' ? <Zap className="w-6 h-6" /> : 
                     badge.icon === 'trophy' ? <Trophy className="w-6 h-6" /> : 
                     badge.icon === 'graduation-cap' ? <GraduationCap className="w-6 h-6" /> :
                     badge.icon === 'calendar-check' ? <CheckCircle2 className="w-6 h-6" /> :
                     <Award className="w-6 h-6" />}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-tight dark:text-white">{badge.name}</span>
                </div>
              )) : (
                <div className="col-span-full py-8 bg-zinc-50 dark:bg-zinc-800 rounded-2xl text-center border-2 border-dashed border-zinc-200 dark:border-zinc-700">
                  <Award className="w-8 h-8 mx-auto mb-2 text-zinc-300" />
                  <p className="text-xs text-zinc-500 font-bold">No badges yet. Keep learning!</p>
                </div>
              )}
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold dark:text-white">Recent Courses</h2>
          <div className="space-y-3">
            {recentCourses.length > 0 ? recentCourses.map(course => (
              <div 
                key={course.id} 
                onClick={() => onSelectCourse(course.id)}
                className={cn(
                  "p-4 bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/5 rounded-2xl flex items-center gap-4 hover:shadow-md transition-all cursor-pointer"
                )}
              >
                <div className="w-16 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-lg overflow-hidden shrink-0 relative">
                  <img src={`https://picsum.photos/seed/${course.id}/100/100`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  {course.enrollmentStatus === 'pending' && (
                    <div className="absolute inset-0 bg-amber-500/20 flex items-center justify-center">
                      <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold truncate dark:text-white">{course.title}</h4>
                    {course.enrollmentStatus === 'pending' && (
                      <span className="text-[8px] font-black uppercase bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded">Pending</span>
                    )}
                  </div>
                  <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1 rounded-full mt-2 overflow-hidden">
                    <div className="bg-purple-500 h-full" style={{ width: `${course.progress}%` }} />
                  </div>
                </div>
                <div className="text-xs font-bold text-zinc-400 dark:text-zinc-500">{course.progress}%</div>
              </div>
            )) : (
              <p className="text-zinc-400 dark:text-zinc-500 text-sm italic">No active courses.</p>
            )}
          </div>
        </section>

        {schoolCourses.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-xl font-bold dark:text-white">Available in your School</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {schoolCourses.map(course => (
                <div 
                  key={course.id} 
                  onClick={() => onSelectCourse(course.id)}
                  className="p-4 bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/5 rounded-2xl flex items-center gap-4 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="w-16 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-lg overflow-hidden shrink-0">
                    <img src={`https://picsum.photos/seed/${course.id}/100/100`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold truncate dark:text-white">{course.title}</h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">By {course.teacherName}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="space-y-4">
          <h2 className="text-xl font-bold dark:text-white">Recent Exam Results</h2>
          <div className="space-y-3">
            {recentResults.length > 0 ? recentResults.map(result => (
              <div 
                key={result.id} 
                className="p-4 bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/5 rounded-2xl flex items-center gap-4 hover:shadow-md transition-all"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${result.score >= 70 ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400' : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400'}`}>
                  <Trophy className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold truncate dark:text-white">{result.examTitle || 'Exam Result'}</h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">{new Date(result.completedAt?.toMillis()).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-black ${result.score >= 70 ? 'text-purple-600' : 'text-red-600'}`}>{result.score.toFixed(1)}%</div>
                  <div className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">{result.score >= 70 ? 'Passed' : 'Failed'}</div>
                </div>
              </div>
            )) : (
              <p className="text-zinc-400 dark:text-zinc-500 text-sm italic">No exam results yet.</p>
            )}
          </div>
        </section>

        <section className="space-y-4 lg:col-span-2">
          <h2 className="text-xl font-bold dark:text-white">Upcoming Exams</h2>
          <div className="space-y-3">
            {upcomingExams.length > 0 ? upcomingExams.map(exam => (
              <div 
                key={exam.id} 
                onClick={() => onSelectExam(exam.id)}
                className="p-4 bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/5 rounded-2xl flex items-center gap-4 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="w-12 h-12 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center shrink-0">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold truncate dark:text-white">{exam.title}</h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">{exam.category} • {exam.questions?.length || 0} Questions</p>
                </div>
                <button className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 dark:bg-zinc-800 text-white dark:text-zinc-900 dark:text-white text-xs font-bold rounded-lg">Start</button>
              </div>
            )) : (
              <p className="text-zinc-400 dark:text-zinc-500 text-sm italic">No upcoming exams.</p>
            )}
          </div>
        </section>
        </div>

        <div className="space-y-8">
          <Leaderboard 
            schoolId={profile?.schoolId} 
            title={profile?.schoolId ? "School Rankings" : "Global Rankings"} 
          />

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold dark:text-white">Join a School</h2>
              <button 
                onClick={onBrowseSchools}
                className="text-xs font-bold text-purple-600 hover:underline flex items-center gap-1"
              >
                Browse Schools directory &rarr;
              </button>
            </div>
          <div className="p-6 bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/5 rounded-2xl shadow-sm">
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">Enter your school's unique code to join and access your classes.</p>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="School Code" 
                value={schoolCode}
                onChange={(e) => setSchoolCode(e.target.value)}
                className="flex-1 px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 dark:text-white"
              />
              <button 
                onClick={handleJoinSchool}
                className="px-4 py-2 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700"
              >
                Join
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
);
};
