import React, { useState, useEffect } from 'react';
import { Navbar } from './Navbar';
import { Dashboard } from '../pages/Dashboard';
import { Marketplace } from '../pages/Marketplace';
import { MyCourses } from '../pages/MyCourses';
import { SettingsView } from '../pages/SettingsView';
import { useAuth } from '../context/AuthContext';
import SuperAdminView from '../pages/SuperAdminView';
import SchoolManagerView from '../pages/SchoolManagerView';
import ManagerDashboard from '../pages/ManagerDashboard';
import TeacherView from '../pages/TeacherView';
import { ParentView } from '../pages/ParentView';
import { SchoolDirectoryView } from '../pages/SchoolDirectoryView';
import { SchoolProfileView } from '../pages/SchoolProfileView';
import { LessonViewer } from './LessonViewer';
import { ExamViewer } from './ExamViewer';

export const MainApp: React.FC = () => {
  const { profile } = useAuth();
  
  const getDefaultTab = (role?: string) => {
    return 'dashboard';
  };

  const [activeTab, setActiveTab] = useState(getDefaultTab(profile?.role));
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [viewingSchoolId, setViewingSchoolId] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    
    // Reset activeTab if the current tab is not appropriate for the new role
    if (activeTab === 'super-admin' && profile.role !== 'super_admin') setActiveTab(getDefaultTab(profile.role));
    if (activeTab === 'school' && profile.role !== 'admin') setActiveTab(getDefaultTab(profile.role));
    if (activeTab === 'my-courses' && profile.role !== 'teacher' && profile.role !== 'super_admin') setActiveTab(getDefaultTab(profile.role));
    if (activeTab === 'parent' && profile.role !== 'parent') setActiveTab(getDefaultTab(profile.role));
    
    // If they are on dashboard but they are not a student, maybe they should be moved to their default tab?
    // The user said "avoid automatic moving of the user to dashboard", so we only move them if they are on a restricted tab.
  }, [profile?.role]);

  const handleSelectCourse = (id: string) => {
    setSelectedCourseId(id);
  };

  const handleSelectExam = (id: string) => {
    setSelectedExamId(id);
  };

  const renderContent = () => {
    if (selectedCourseId) {
      return <LessonViewer courseId={selectedCourseId} onBack={() => setSelectedCourseId(null)} />;
    }
    if (selectedExamId) {
      return <ExamViewer examId={selectedExamId} onBack={() => setSelectedExamId(null)} />;
    }
    if (viewingSchoolId) {
      return <SchoolProfileView schoolId={viewingSchoolId} onBack={() => setViewingSchoolId(null)} onSelectCourse={handleSelectCourse} />;
    }

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onSelectCourse={handleSelectCourse} onSelectExam={handleSelectExam} onBrowseSchools={() => setActiveTab('schools')} />;
      case 'courses':
        return <MyCourses onSelectCourse={handleSelectCourse} onSelectExam={handleSelectExam} />;
      case 'marketplace':
        return <Marketplace onSelectCourse={handleSelectCourse} onSelectExam={handleSelectExam} />;
      case 'settings':
        return <SettingsView />;
      case 'super-admin':
        return <SuperAdminView />;
      case 'schools':
        if (profile?.role === 'super_admin' || profile?.role === 'admin') {
          return <ManagerDashboard onSelectSchool={() => setActiveTab('school')} />;
        }
        return <SchoolDirectoryView onSelectSchool={setViewingSchoolId} />;
      case 'school':
        return <SchoolManagerView />;
      case 'my-courses':
        return <TeacherView />;
      case 'parent':
        return <ParentView />;
      default:
        return <Dashboard onSelectCourse={handleSelectCourse} onSelectExam={handleSelectExam} onBrowseSchools={() => setActiveTab('schools')} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F9F8] dark:bg-zinc-950 transition-colors duration-300">
      <Navbar activeTab={activeTab} setActiveTab={(tab) => {
        setActiveTab(tab);
        setSelectedCourseId(null);
        setSelectedExamId(null);
        setViewingSchoolId(null);
      }} />
      <main className="max-w-7xl mx-auto px-4 py-8 pb-24 md:pb-8">
        {renderContent()}
      </main>
    </div>
  );
};
