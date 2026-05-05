import React, { useState, useEffect } from 'react';
import { doc, getDoc, collection, addDoc, query, where, getDocs, Timestamp, setDoc, collectionGroup } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { School as SchoolIcon, MapPin, Globe, Mail, Phone, User, ArrowLeft, CheckCircle2, BookOpen, Search, Settings } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { cn } from '../lib/utils';

interface SchoolProfileViewProps {
  schoolId: string;
  onBack: () => void;
  onSelectCourse: (id: string) => void;
  onManageSchool?: () => void;
}

export const SchoolProfileView: React.FC<SchoolProfileViewProps> = ({ schoolId, onBack, onSelectCourse, onManageSchool }) => {
  const { profile, currentRole } = useAuth();
  const [school, setSchool] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [joinStatus, setJoinStatus] = useState<'none' | 'pending' | 'member'>('none');
  const [requestingRole, setRequestingRole] = useState<string | null>(null);
  const [courseSearch, setCourseSearch] = useState('');
  const [isEnrolling, setIsEnrolling] = useState<string | null>(null);
  const [studentsCount, setStudentsCount] = useState<number>(0);

  const isManager = currentRole === 'super_admin' || 
                   (currentRole === 'admin' && profile?.schoolId === schoolId) || 
                   school?.managerId === profile?.uid;

  useEffect(() => {
    const fetchSchoolAndStatus = async () => {
      try {
        const docRef = doc(db, 'schools', schoolId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setSchool({ id: docSnap.id, ...docSnap.data() });
        }

        // Fetch courses for this school
        const coursesQ = query(collection(db, 'courses'), where('schoolId', '==', schoolId));
        const coursesSnap = await getDocs(coursesQ);
        setCourses(coursesSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        
        // Fetch students count
        if (profile && profile.uid) {
          const studentsQ = query(collection(db, 'users'), where('schoolId', '==', schoolId));
          const studentsSnap = await getDocs(studentsQ);
          const stCount = studentsSnap.docs.filter(d => d.data().role === 'student').length;
          setStudentsCount(stCount);
        }

        if (profile && profile.uid) {
          // Fetch existing enrollments
          const enrollmentsQ = query(collectionGroup(db, 'enrollments'), where('studentId', '==', profile.uid));
          const enrollSnapshot = await getDocs(enrollmentsQ);
          setEnrolledCourseIds(enrollSnapshot.docs.map(d => d.data().courseId).filter(Boolean));

          if (profile.schoolId === schoolId || (profile.schoolIds && profile.schoolIds.includes(schoolId))) {
            setJoinStatus('member');
          } else {
            const q = query(
              collection(db, 'joinRequests'), 
              where('schoolId', '==', schoolId),
              where('userId', '==', profile.uid)
            );
            const reqSnap = await getDocs(q);
            if (!reqSnap.empty) {
              const req = reqSnap.docs[0].data();
              if (req.status === 'pending') {
                setJoinStatus('pending');
              } else if (req.status === 'approved') {
                setJoinStatus('member');
              }
            }
          }
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `schools/${schoolId}`);
      } finally {
        setLoading(false);
      }
    };

    fetchSchoolAndStatus();
  }, [schoolId, profile]);

  const handleJoin = async (role: 'student' | 'teacher' | 'parent') => {
    if (!profile) return;
    setRequestingRole(role);
    try {
      await addDoc(collection(db, 'joinRequests'), {
        schoolId,
        userId: profile.uid,
        userEmail: profile.email,
        userName: profile.displayName,
        role,
        status: 'pending',
        createdAt: Timestamp.now()
      });
      setJoinStatus('pending');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'joinRequests');
    } finally {
      setRequestingRole(null);
    }
  };

  const handleEnrollCourse = async (course: any) => {
    if (!profile) return;
    setIsEnrolling(course.id);
    try {
      await setDoc(doc(db, 'courses', course.id, 'enrollments', profile.uid), {
        studentId: profile.uid,
        studentName: profile.displayName || 'Anonymous',
        teacherId: course.teacherId || 'unknown',
        courseId: course.id,
        title: course.title,
        enrolledAt: Timestamp.now(),
        progress: 0,
        status: 'approved',
        paymentVerified: true,
        type: 'course'
      });
      setEnrolledCourseIds(prev => [...prev, course.id]);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `courses/${course.id}/enrollments/${profile.uid}`);
    } finally {
      setIsEnrolling(null);
    }
  };

  const filteredCourses = courses.filter(c => 
    c.title.toLowerCase().includes(courseSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!school) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">School not found</h2>
        <button onClick={onBack} className="mt-4 text-emerald-600 hover:underline">Go back</button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-8 pb-12">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors w-max"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {/* Hero Section */}
      <div className="relative w-full rounded-[2.5rem] overflow-hidden bg-zinc-900 shadow-2xl border border-zinc-800">
        {school.bannerUrl ? (
          <div className="h-[28rem] relative w-full">
             <img src={school.bannerUrl} alt="School Banner" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
             <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          </div>
        ) : (
          <div className="h-[28rem] relative w-full bg-gradient-to-br from-zinc-800 to-zinc-950 text-white flex items-center justify-center">
            {/* Pattern overlay */}
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent z-0" />
            <SchoolIcon className="w-48 h-48 opacity-10" />
          </div>
        )}
        
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 z-10 flex flex-col md:flex-row gap-8 items-start md:items-end">
          <div className="w-32 h-32 md:w-40 md:h-40 bg-white dark:bg-zinc-950 rounded-[2rem] p-2 shadow-2xl shrink-0 border border-white/10 relative group">
            <div className="w-full h-full bg-zinc-100 dark:bg-zinc-900 rounded-[1.5rem] flex items-center justify-center overflow-hidden">
              {school.logoUrl ? (
                <img src={school.logoUrl} alt={school.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
              ) : (
                <SchoolIcon className="w-16 h-16 text-zinc-400" />
              )}
            </div>
          </div>
          
          <div className="flex-1 text-white">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4 drop-shadow-sm">{school.name}</h1>
            <div className="flex flex-wrap items-center gap-4 text-zinc-300 font-medium">
              {school.address && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  {school.address}
                </div>
              )}
              {school.academicStructure && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10">
                  <BookOpen className="w-4 h-4 text-blue-400" />
                  {school.academicStructure}
                </div>
              )}
              {studentsCount > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10">
                  <User className="w-4 h-4 text-purple-400" />
                  {studentsCount} Students
                </div>
              )}
              {courses.length > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10">
                  <BookOpen className="w-4 h-4 text-amber-400" />
                  {courses.length} Active Courses
                </div>
              )}
            </div>
          </div>
          
          {profile && (
            <div className="flex shrink-0 gap-3 mt-4 md:mt-0">
              {isManager && onManageSchool && (
                <button 
                  onClick={onManageSchool}
                  className="flex items-center gap-2 px-6 py-3.5 bg-white text-zinc-950 rounded-2xl font-bold hover:bg-emerald-50 hover:text-emerald-900 transition-all shadow-xl hover:shadow-emerald-500/20 active:scale-95"
                >
                  <Settings className="w-5 h-5" />
                  Manage School
                </button>
              )}
              {joinStatus === 'member' && profile?.schoolId !== schoolId && (
                <button 
                  onClick={async () => {
                    const { doc, setDoc } = await import('firebase/firestore');
                    const { db } = await import('../firebase');
                    await setDoc(doc(db, 'users', profile.uid), { schoolId: schoolId }, { merge: true });
                  }}
                  className="flex items-center gap-2 px-6 py-3.5 bg-blue-600/20 backdrop-blur-md border border-blue-500/30 text-blue-300 rounded-2xl font-bold shadow-xl hover:bg-blue-600/30 transition-all"
                >
                  Set as Active
                </button>
              )}
              {joinStatus === 'member' && (
                <button 
                  onClick={async () => {
                    if (confirm("Are you sure you want to leave this school?")) {
                      const { doc, setDoc } = await import('firebase/firestore');
                      const { db } = await import('../firebase');
                      const updatedSchoolIds = (profile.schoolIds || []).filter((id: string) => id !== schoolId);
                      const updates: any = { schoolIds: updatedSchoolIds };
                      if (profile.schoolId === schoolId) {
                        updates.schoolId = updatedSchoolIds.length > 0 ? updatedSchoolIds[0] : null;
                      }
                      await setDoc(doc(db, 'users', profile.uid), updates, { merge: true });
                      onBack();
                    }
                  }}
                  className="flex items-center gap-2 px-6 py-3.5 bg-red-500/20 backdrop-blur-md border border-red-500/30 text-red-300 rounded-2xl font-bold shadow-xl hover:bg-red-500/30 transition-all"
                >
                  Leave School
                </button>
              )}
              {joinStatus === 'member' ? (
                <div className="flex items-center gap-2 px-6 py-3.5 bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 text-emerald-300 rounded-2xl font-bold shadow-xl">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  {profile?.schoolId === schoolId ? 'Active School' : 'Joined'}
                </div>
              ) : joinStatus === 'pending' ? (
                <div className="flex items-center gap-2 px-6 py-3.5 bg-amber-500/20 backdrop-blur-md border border-amber-500/30 text-amber-300 rounded-2xl font-bold shadow-xl">
                  <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                  Request Pending
                </div>
              ) : (
                <div className="flex flex-col gap-2 bg-black/40 backdrop-blur-md p-3 rounded-3xl border border-white/10">
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider text-center px-2">Join Our Community</p>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleJoin('student')}
                      disabled={requestingRole !== null}
                      className="px-4 py-2.5 bg-white text-zinc-950 rounded-xl font-bold hover:bg-emerald-400 transition-all text-sm disabled:opacity-50 shadow-lg"
                    >
                      As Student
                    </button>
                    <button 
                      onClick={() => handleJoin('parent')}
                      disabled={requestingRole !== null}
                      className="px-4 py-2.5 bg-zinc-800 text-white rounded-xl font-bold hover:bg-zinc-700 transition-all text-sm disabled:opacity-50 border border-zinc-700"
                    >
                      As Parent
                    </button>
                    <button 
                      onClick={() => handleJoin('teacher')}
                      disabled={requestingRole !== null}
                      className="px-4 py-2.5 bg-zinc-800 text-white rounded-xl font-bold hover:bg-zinc-700 transition-all text-sm disabled:opacity-50 border border-zinc-700"
                    >
                      As Teacher
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: About & Courses */}
        <div className="lg:col-span-8 space-y-10">
          
          {/* About Section */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 sm:p-10 shadow-sm">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6">About the School</h2>
            <div className="prose prose-lg dark:prose-invert max-w-none text-zinc-600 dark:text-zinc-300 leading-relaxed font-serif">
              {school.description ? (
                <p className="whitespace-pre-wrap">{school.description}</p>
              ) : (
                <p className="italic text-zinc-400">Welcome to {school.name}. More information coming soon.</p>
              )}
            </div>
          </div>

          {/* Courses Section */}
          {courses.length > 0 && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
                <div>
                  <h2 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Academic Programs</h2>
                  <p className="text-zinc-500 font-medium mt-1">Discover our engaging courses</p>
                </div>
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input 
                    type="text" 
                    placeholder="Search courses..."
                    value={courseSearch}
                    onChange={(e) => setCourseSearch(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 dark:text-white transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {filteredCourses.map(course => {
                  const isEnrolled = enrolledCourseIds.includes(course.id);
                  return (
                    <div 
                      key={course.id} 
                      onClick={() => isEnrolled && onSelectCourse(course.id)}
                      className={cn(
                        "group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden flex flex-col transition-all hover:shadow-xl hover:-translate-y-1",
                        isEnrolled && "cursor-pointer"
                      )}
                    >
                      <div className="h-40 bg-zinc-100 dark:bg-zinc-800 relative overflow-hidden">
                        <img src={`https://picsum.photos/seed/${course.id}/400/200`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" referrerPolicy="no-referrer" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-4 left-4 right-4">
                          <h4 className="font-bold text-lg text-white leading-tight">{course.title}</h4>
                        </div>
                      </div>
                      
                      <div className="p-6 flex flex-col flex-1 gap-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-zinc-500 font-bold shrink-0 text-xs">
                            {course.teacherName?.[0] || 'T'}
                          </div>
                          <div>
                            <p className="text-xs text-zinc-500 font-medium">Instructor</p>
                            <p className="text-sm font-bold text-zinc-900 dark:text-white">{course.teacherName}</p>
                          </div>
                        </div>
                        
                        <div className="mt-auto">
                          {isEnrolled ? (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectCourse(course.id);
                              }}
                              className="w-full py-3 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-xl text-sm font-bold border border-emerald-200 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all"
                            >
                              Access Course
                            </button>
                          ) : (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEnrollCourse(course);
                              }}
                              disabled={isEnrolling !== null}
                              className="w-full py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 rounded-xl text-sm font-bold hover:bg-emerald-600 dark:hover:bg-emerald-400 hover:text-white transition-all shadow-md active:scale-95 disabled:opacity-50"
                            >
                              {isEnrolling === course.id ? 'Enrolling...' : 'Enroll Now'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {filteredCourses.length === 0 && (
                <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800">
                  <BookOpen className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white">No courses found</h3>
                  <p className="text-zinc-500">We couldn't find any courses matching your search.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Contact & Info Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 sticky top-8">
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-6">Contact & Info</h3>
            
            <div className="space-y-6">
              {school.principalName && (
                <div className="flex items-start gap-4 p-4 bg-white dark:bg-zinc-800/50 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-700/50">
                  <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center shrink-0">
                    <User className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Principal</p>
                    <p className="font-medium text-zinc-900 dark:text-white">{school.principalName}</p>
                  </div>
                </div>
              )}
              
              {school.adminEmail && (
                <div className="flex items-start gap-4 p-4 bg-white dark:bg-zinc-800/50 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-700/50">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Email</p>
                    <a href={`mailto:${school.adminEmail}`} className="font-medium text-zinc-900 dark:text-white hover:text-blue-600 transition-colors break-all block">
                      {school.adminEmail}
                    </a>
                  </div>
                </div>
              )}
              
              {school.contactPhone && (
                <div className="flex items-start gap-4 p-4 bg-white dark:bg-zinc-800/50 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-700/50">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Phone</p>
                    <p className="font-medium text-zinc-900 dark:text-white">{school.contactPhone}</p>
                  </div>
                </div>
              )}
              
              {school.website && (
                <div className="flex items-start gap-4 p-4 bg-white dark:bg-zinc-800/50 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-700/50">
                  <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center shrink-0">
                    <Globe className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Website</p>
                    <a href={school.website} target="_blank" rel="noopener noreferrer" className="font-medium text-zinc-900 dark:text-white hover:text-amber-600 transition-colors break-all block">
                      {school.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
