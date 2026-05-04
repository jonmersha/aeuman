import React from 'react';
import { motion } from 'motion/react';
import { UserRole, useAuth } from '../context/AuthContext';
import { GraduationCap, BookOpen, School, ShieldCheck, Users } from 'lucide-react';

export const RoleSelectionView: React.FC = () => {
  const { switchRole } = useAuth();

  const roles: { id: UserRole; label: string; icon: React.ReactNode; description: string }[] = [
    { id: 'student', label: 'Student', icon: <GraduationCap size={32} />, description: 'Access courses, exams, and learning materials.' },
    { id: 'teacher', label: 'Teacher', icon: <BookOpen size={32} />, description: 'Manage classes, create content, and grade students.' },
    { id: 'parent', label: 'Parent', icon: <Users size={32} />, description: 'Monitor your children\'s progress and grades.' },
    { id: 'super_admin', label: 'Super Admin', icon: <ShieldCheck size={32} />, description: 'Full system access and platform management.' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl w-full"
      >
        <div className="text-center mb-12">
          <h2 className="text-4xl font-black mb-4 tracking-tight dark:text-white">Select Your Role</h2>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium">Choose how you want to get started with EduManage.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {roles.map((role) => (
            <button
              key={role.id}
              onClick={() => switchRole(role.id)}
              className="p-8 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-sm hover:shadow-xl hover:border-purple-200 dark:hover:border-purple-800 transition-all text-left group"
            >
              <div className="w-16 h-16 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                {role.icon}
              </div>
              <h3 className="text-xl font-bold mb-2 dark:text-white">{role.label}</h3>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm">{role.description}</p>
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
