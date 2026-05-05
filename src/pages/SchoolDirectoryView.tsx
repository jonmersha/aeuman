import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Search, MapPin, School as SchoolIcon, Users, BookOpen, Star, LogOut, CheckCircle2 } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { useAuth } from '../context/AuthContext';

interface SchoolDirectoryViewProps {
  onSelectSchool: (schoolId: string) => void;
  showOnlyJoined?: boolean;
}

export const SchoolDirectoryView: React.FC<SchoolDirectoryViewProps> = ({ onSelectSchool, showOnlyJoined = false }) => {
  const { profile } = useAuth();
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'schools'), where('status', '==', 'active'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const schoolData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSchools(schoolData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'schools');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredSchools = schools.filter(school => 
    school.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    school.address?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const mySchools = filteredSchools.filter(s => profile?.schoolIds?.includes(s.id) || profile?.schoolId === s.id);
  const otherSchools = filteredSchools.filter(s => !mySchools.includes(s));

  const handleSetActive = async (schoolId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!profile?.uid) return;
    try {
      await setDoc(doc(db, 'users', profile.uid), { schoolId }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${profile.uid}`);
    }
  };

  const handleLeaveSchool = async (schoolId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!profile?.uid) return;
    if (confirm("Are you sure you want to leave this school?")) {
      try {
        const updatedSchoolIds = (profile.schoolIds || []).filter((id: string) => id !== schoolId);
        const updates: any = { schoolIds: updatedSchoolIds };
        if (profile.schoolId === schoolId) {
          updates.schoolId = updatedSchoolIds.length > 0 ? updatedSchoolIds[0] : null;
        }
        await setDoc(doc(db, 'users', profile.uid), updates, { merge: true });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `users/${profile.uid}`);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const renderSchoolCard = (school: any, isMine = false) => (
    <div 
      key={school.id} 
      onClick={() => onSelectSchool(school.id)}
      className={`bg-white dark:bg-zinc-900 border ${isMine ? 'border-emerald-200 dark:border-emerald-800 shadow-emerald-100 dark:shadow-emerald-900/10' : 'border-zinc-200 dark:border-zinc-800'} rounded-3xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col h-full relative`}
    >
      <div className="flex items-start gap-4 mb-4">
        {isMine && profile?.schoolId === school.id && (
          <div className="absolute top-4 right-4 px-2.5 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider" title="Active School">
            <Star className="w-3 h-3 fill-current" />
            Active
          </div>
        )}
        <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden">
          {school.logoUrl ? (
            <img src={school.logoUrl} alt={school.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <SchoolIcon className="w-8 h-8" />
          )}
        </div>
        <div className="flex-1 min-w-0 pr-16">
          <h3 className="text-xl font-bold text-zinc-900 dark:text-white group-hover:text-emerald-600 transition-colors line-clamp-2">{school.name}</h3>
          <div className="flex items-center gap-1 text-zinc-500 text-sm mt-1">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">{school.address || 'Location not specified'}</span>
          </div>
        </div>
      </div>
      
      {school.description && (
        <p className="text-zinc-600 dark:text-zinc-400 text-sm line-clamp-3 mb-4 flex-1 mt-2">
          {school.description}
        </p>
      )}
      
      {isMine && (
        <div className="flex gap-2 items-center mb-4 mt-auto">
           {profile?.schoolId !== school.id && (
             <button 
               onClick={(e) => handleSetActive(school.id, e)}
               className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-bold hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-400 transition-all border border-transparent hover:border-emerald-200 dark:hover:border-emerald-500/20"
             >
               <CheckCircle2 className="w-3.5 h-3.5" />
               Set Active
             </button>
           )}
           <button 
             onClick={(e) => handleLeaveSchool(school.id, e)}
             className={`flex items-center justify-center gap-1.5 py-2 px-3 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold hover:bg-red-100 dark:hover:bg-red-500/20 transition-all border border-transparent hover:border-red-200 dark:hover:border-red-500/20 ${profile?.schoolId === school.id ? 'flex-1' : 'w-auto max-w-[120px]'}`}
           >
             <LogOut className="w-3.5 h-3.5" />
             Leave
           </button>
        </div>
      )}
      
      <div className={`pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between ${!isMine ? 'mt-auto' : ''}`}>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs font-medium text-zinc-600 dark:text-zinc-300">
          {school.academicStructure || 'K-12'}
        </span>
        <span className="text-emerald-600 text-sm font-bold group-hover:translate-x-1 transition-transform flex items-center gap-1">
          View Profile &rarr;
        </span>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
            {showOnlyJoined ? 'My Schools' : 'Schools Directory'}
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            {showOnlyJoined ? 'Manage your joined schools and active learning environments' : 'Discover and join educational institutions'}
          </p>
        </div>
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-zinc-400" />
          </div>
          <input
            type="text"
            placeholder="Search schools by name or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-3 border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 dark:text-white transition-all shadow-sm"
          />
        </div>
      </div>

      {filteredSchools.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800">
          <SchoolIcon className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white">No schools found</h3>
          <p className="text-zinc-500">Try adjusting your search query.</p>
        </div>
      ) : showOnlyJoined && mySchools.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800">
          <SchoolIcon className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white">You haven't joined any schools yet</h3>
          <p className="text-zinc-500">Go to the Schools directory to discover and join schools.</p>
        </div>
      ) : (
        <div className="space-y-12">
          {mySchools.length > 0 && (
            <div>
              {!showOnlyJoined && (
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2 mb-6">
                  <Star className="w-6 h-6 text-emerald-500" /> My Schools
                </h2>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mySchools.map(school => renderSchoolCard(school, true))}
              </div>
            </div>
          )}

          {!showOnlyJoined && otherSchools.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6">
                {mySchools.length > 0 ? 'Explore Other Schools' : 'All Schools'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {otherSchools.map(school => renderSchoolCard(school, false))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
