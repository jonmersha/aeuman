import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot, where } from 'firebase/firestore';
import { Trophy, Medal, Star, Target } from 'lucide-react';
import { db } from '../firebase';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface LeaderboardProps {
  schoolId?: string;
  classId?: string;
  title?: string;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ schoolId, classId, title = "Top Learners" }) => {
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let q = query(
      collection(db, 'users'),
      where('role', '==', 'student'),
      orderBy('points', 'desc'),
      limit(10)
    );

    if (classId) {
      q = query(
        collection(db, 'users'),
        where('classId', '==', classId),
        where('role', '==', 'student'),
        orderBy('points', 'desc'),
        limit(10)
      );
    } else if (schoolId) {
      q = query(
        collection(db, 'users'),
        where('schoolId', '==', schoolId),
        where('role', '==', 'student'),
        orderBy('points', 'desc'),
        limit(10)
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLeaders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      console.error("Error fetching leaderboard:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [schoolId, classId]);

  if (loading) return <div className="p-8 text-center animate-pulse">Loading rankings...</div>;

  return (
    <div className="bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/5 rounded-[2.5rem] p-8 shadow-sm">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-xl flex items-center justify-center">
          <Trophy className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold dark:text-white">{title}</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium tracking-wide">Monthly Rankings</p>
        </div>
      </div>

      <div className="space-y-3">
        {leaders.length > 0 ? leaders.map((leader, index) => (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            key={leader.id}
            className={cn(
              "flex items-center gap-4 p-4 rounded-2xl transition-all",
              index === 0 ? "bg-amber-50/50 border border-amber-100 dark:bg-amber-900/10 dark:border-amber-900/20" : 
              index === 1 ? "bg-zinc-50 dark:bg-zinc-800" : 
              index === 2 ? "bg-zinc-50/50 dark:bg-zinc-800/50" : "bg-transparent"
            )}
          >
            <div className="w-8 flex justify-center">
              {index === 0 ? <Medal className="w-6 h-6 text-amber-500" /> :
               index === 1 ? <Medal className="w-6 h-6 text-zinc-400" /> :
               index === 2 ? <Medal className="w-6 h-6 text-amber-700" /> :
               <span className="text-sm font-black text-zinc-300 dark:text-zinc-600">#{index + 1}</span>}
            </div>
            
            <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
              {leader.photoURL ? (
                <img src={leader.photoURL} alt={leader.displayName} className="w-full h-full rounded-full object-cover" />
              ) : (
                <Star className="w-5 h-5 text-zinc-400" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-sm truncate dark:text-white">{leader.displayName}</h4>
              {leader.badges && leader.badges.length > 0 && (
                <div className="flex gap-1 mt-1">
                  {leader.badges.slice(0, 3).map((badge: any) => (
                    <div key={badge.id} title={badge.name} className="w-4 h-4 rounded-full bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/10 flex items-center justify-center">
                      <Target className="w-2.5 h-2.5 text-purple-600" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="text-right">
              <div className="text-sm font-black text-purple-600">{leader.points || 0}</div>
              <div className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase">Points</div>
            </div>
          </motion.div>
        )) : (
          <div className="py-12 text-center text-zinc-400">
            <Target className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-sm">No rankings yet. Start learning to earn points!</p>
          </div>
        )}
      </div>
    </div>
  );
};
