import { 
  doc, 
  updateDoc, 
  increment, 
  arrayUnion, 
  getDoc,
  Timestamp,
  FieldValue
} from 'firebase/firestore';
import { db } from '../firebase';

export interface Badge {
  id: string;
  name: string;
  icon: string;
  awardedAt: Timestamp;
}

export const GAMIFICATION_POINTS = {
  LESSON_COMPLETE: 10,
  EXAM_PASSED: 50,
  EXAM_PERFECT: 100,
  ASSIGNMENT_SUBMITTED: 30,
};

export const BADGES = {
  QUICK_LEARNER: { id: 'quick_learner', name: 'Quick Learner', icon: 'zap' },
  SCHOLAR: { id: 'scholar', name: 'Scholar', icon: 'graduation-cap' },
  TOP_SCORER: { id: 'top_scorer', name: 'Top Scorer', icon: 'trophy' },
  COURSE_COMPLETED: { id: 'course_completed', name: 'Course Master', icon: 'award' },
  PERFECT_ATTENDANCE: { id: 'perfect_attendance', name: 'Perfect Attendance', icon: 'calendar-check' },
};

export const awardPoints = async (userId: string, points: number) => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    points: increment(points)
  });
};

export const awardBadge = async (userId: string, badgeId: string) => {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) return;
  
  const userData = userSnap.data();
  const existingBadges = userData.badges || [];
  
  if (existingBadges.some((b: any) => b.id === badgeId)) return;
  
  const badgeInfo = Object.values(BADGES).find(b => b.id === badgeId);
  if (!badgeInfo) return;
  
  const newBadge: Badge = {
    ...badgeInfo,
    awardedAt: Timestamp.now()
  };
  
  await updateDoc(userRef, {
    badges: arrayUnion(newBadge)
  });
};

export const checkAchievements = async (userId: string, context: { type: 'lesson' | 'exam' | 'course', data: any }) => {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return;
  const userData = userSnap.data();

  if (context.type === 'lesson') {
    // Check for Quick Learner (e.g. 5 lessons completed across all courses might be hard, let's check one course or total)
    // For simplicity, let's assume we can check total completed lessons.
    // However, completedLessons is stored in enrollments.
    // Let's just award based on the action for now.
  }

  if (context.type === 'exam') {
    if (context.data.score === 100) {
      await awardBadge(userId, BADGES.TOP_SCORER.id);
      await awardPoints(userId, GAMIFICATION_POINTS.EXAM_PERFECT);
    } else if (context.data.score >= 70) {
      await awardPoints(userId, GAMIFICATION_POINTS.EXAM_PASSED);
    }
  }

  if (context.type === 'course' && context.data.progress === 100) {
    await awardBadge(userId, BADGES.COURSE_COMPLETED.id);
  }
};
