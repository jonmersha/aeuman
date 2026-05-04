import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, query, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { Plus, School, Search, LayoutGrid, List, Settings, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SchoolData {
  id: string;
  name: string;
  address: string;
  managerId: string;
}

interface ManagerDashboardProps {
  onSelectSchool: (id: string) => void;
}

const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ onSelectSchool }) => {
  const { profile } = useAuth();
  const [schools, setSchools] = useState<SchoolData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSchool, setNewSchool] = useState({ name: '', address: '' });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!profile?.uid) return;

    // Query schools: Super Admins see all, others see only their managed schools
    const schoolsRef = collection(db, 'schools');
    
    // For joining, we might want to see ALL schools if we are looking for one
    // But initially, let's show managed/joined schools
    const q = profile.role === 'super_admin' 
      ? query(schoolsRef)
      : query(schoolsRef); // Show all for now so they can find one to join, or we can add a search

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const schoolList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SchoolData));
      setSchools(schoolList);
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'schools'));

    return () => unsubscribe();
  }, [profile?.uid, profile?.role]);

  const isSuperAdmin = profile?.role === 'super_admin';

  const handleSchoolClick = async (schoolId: string) => {
    if (!profile?.uid) return;
    try {
      // Update the user's active schoolId
      const { doc, setDoc } = await import('firebase/firestore');
      await setDoc(doc(db, 'users', profile.uid), { schoolId }, { merge: true });
      onSelectSchool(schoolId);
    } catch (error) {
      console.error("Error switching school:", error);
    }
  };

  const handleJoinSchool = async (schoolId: string) => {
    if (!profile?.uid) return;
    try {
      const { doc, setDoc } = await import('firebase/firestore');
      // In a real app, this might be a request, but for now we set the schoolId directly
      // or add them to some member list
      await setDoc(doc(db, 'users', profile.uid), { schoolId }, { merge: true });
      onSelectSchool(schoolId);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'users');
    }
  };

  const handleAddSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.uid || !isSuperAdmin) return;

    try {
      await addDoc(collection(db, 'schools'), {
        name: newSchool.name,
        address: newSchool.address,
        managerId: profile.uid,
        createdAt: new Date().toISOString()
      });

      setNewSchool({ name: '', address: '' });
      setShowAddModal(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'schools');
    }
  };

  const filteredSchools = schools.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black tracking-tight">{isSuperAdmin ? 'All Schools' : 'Find Your School'}</h2>
          <p className="text-zinc-500 font-medium mt-2">
            {isSuperAdmin 
              ? 'Institutional management and oversight.' 
              : 'Join as a student, teacher, or parent to access school resources.'}
          </p>
        </div>
        {isSuperAdmin && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 px-6 py-3.5 bg-purple-600 text-white rounded-2xl font-bold shadow-xl shadow-purple-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Plus size={20} />
            Create New School
          </button>
        )}
      </div>

      <div className="relative w-full">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
        <input 
          type="text" 
          placeholder="Search for a school by name or address..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl focus:ring-2 focus:ring-purple-500 transition-all font-medium shadow-sm"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-zinc-100 dark:bg-zinc-900 animate-pulse rounded-[2rem]" />
          ))}
        </div>
      ) : (
        <div className="space-y-12">
          {filteredSchools.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {filteredSchools.map((school) => {
                  const isMember = profile?.schoolId === school.id || school.managerId === profile?.uid;
                  return (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      key={school.id}
                      onClick={() => isMember ? handleSchoolClick(school.id) : null}
                      className={cn(
                        "group relative bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[2.5rem] p-8 shadow-sm transition-all",
                        isMember ? "hover:shadow-xl hover:shadow-zinc-200/50 dark:hover:shadow-none cursor-pointer" : ""
                      )}
                    >
                      <div className="flex items-center justify-between mb-6">
                        <div className="bg-purple-50 dark:bg-purple-900/20 text-purple-600 w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                          <School size={28} />
                        </div>
                        {isMember ? (
                          <div className="p-2 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-zinc-400 group-hover:text-purple-600 transition-colors">
                            <ChevronRight size={20} />
                          </div>
                        ) : (
                          <div className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-lg">
                            Public
                          </div>
                        )}
                      </div>
                      <h3 className="text-2xl font-black tracking-tight group-hover:text-purple-600 transition-colors">{school.name}</h3>
                      <p className="text-sm text-zinc-500 font-medium mt-2">{school.address}</p>
                      
                      <div className="mt-8 pt-6 border-t border-zinc-50 dark:border-zinc-800 flex items-center justify-between">
                        {isMember ? (
                          <div className="flex items-center gap-2">
                            <Settings size={14} className="text-zinc-400" />
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Joined</span>
                          </div>
                        ) : (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleJoinSchool(school.id);
                            }}
                            className="w-full py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all"
                          >
                            Join as {profile?.role || 'Member'}
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          ) : (
            <div className="py-20 text-center bg-white dark:bg-zinc-900 rounded-[3rem] border border-dashed border-zinc-200 dark:border-zinc-800">
              <div className="w-20 h-20 bg-zinc-50 dark:bg-zinc-800 rounded-full flex items-center justify-center text-zinc-300 mx-auto mb-6">
                <School size={40} />
              </div>
              <h3 className="text-xl font-bold">No Schools Found</h3>
              <p className="text-zinc-500 mt-2 max-w-xs mx-auto">Try a different search term or contact support if the school isn't listed.</p>
              {isSuperAdmin && (
                <button 
                  onClick={() => setShowAddModal(true)}
                  className="mt-8 px-8 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-bold"
                >
                  Create First School
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Add School Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-zinc-950/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-zinc-100 dark:border-zinc-800"
            >
              <div className="p-8 border-b border-zinc-100 dark:border-zinc-800">
                <h3 className="text-2xl font-black tracking-tight">Create New School</h3>
                <p className="text-zinc-500 font-medium mt-1">Start managing a new educational institution.</p>
              </div>
              <form onSubmit={handleAddSchool} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-500 uppercase tracking-wider ml-1">School Name</label>
                  <input 
                    required
                    type="text" 
                    placeholder="e.g. Westside High School"
                    value={newSchool.name}
                    onChange={(e) => setNewSchool({ ...newSchool, name: e.target.value })}
                    className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-800 border-none rounded-2xl focus:ring-2 focus:ring-purple-500 transition-all font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-500 uppercase tracking-wider ml-1">Address</label>
                  <input 
                    required
                    type="text" 
                    placeholder="e.g. 456 Education Ave, SF"
                    value={newSchool.address}
                    onChange={(e) => setNewSchool({ ...newSchool, address: e.target.value })}
                    className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-800 border-none rounded-2xl focus:ring-2 focus:ring-purple-500 transition-all font-medium"
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-2xl font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-[2] py-4 bg-purple-600 text-white rounded-2xl font-bold shadow-xl shadow-purple-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    Create School
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ManagerDashboard;
