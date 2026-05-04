import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, Timestamp, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase';

export type UserRole = 'super_admin' | 'teacher' | 'student' | 'parent' | 'admin' | 'pending';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  schoolId?: string;
  schoolIds?: string[];
  studentIds?: string[];
  parentIds?: string[];
  isIndependent?: boolean;
  photoURL?: string;
  createdAt: any;
  points?: number;
  badges?: Array<{
    id: string;
    name: string;
    icon: string;
    awardedAt: any;
  }>;
}

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: () => Promise<void>;
  logout: () => Promise<void>;
  switchRole: (role: UserRole) => Promise<void>;
  joinSchool: (schoolCode: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile: () => void = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      unsubscribeProfile(); // Unsubscribe from previous profile listener

      if (user) {
        const docRef = doc(db, 'users', user.uid);
        
        // Use onSnapshot to listen for changes
        unsubscribeProfile = onSnapshot(docRef, async (docSnap) => {
          if (docSnap.exists()) {
            const existingProfile = { ...docSnap.data(), uid: user.uid } as UserProfile;
            // Force super_admin role for the primary admin email if currently pending
            if (user.email === 'beshegercom@gmail.com' && existingProfile.role === 'pending') {
              const updatedProfile = { ...existingProfile, role: 'super_admin' as UserRole };
              await setDoc(docRef, updatedProfile, { merge: true });
              setProfile(updatedProfile);
            } else {
              setProfile(existingProfile);
            }
          } else {
            const isFirstAdmin = user.email === 'beshegercom@gmail.com';
            const newProfile: UserProfile = {
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || 'Anonymous',
              role: isFirstAdmin ? 'super_admin' : 'pending',
              photoURL: user.photoURL || undefined,
              createdAt: Timestamp.now(),
              points: 0,
              badges: [],
            };
            await setDoc(docRef, newProfile);
            setProfile(newProfile);
          }
          setLoading(false);
        });
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeProfile();
    };
  }, []);

  const signIn = async () => {
    const provider = new GoogleAuthProvider();
    // For localhost development, ensure localhost is added to Firebase Authorized Domains
    await signInWithPopup(auth, provider);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const switchRole = async (newRole: UserRole) => {
    if (!user) return;
    const docRef = doc(db, 'users', user.uid);
    await setDoc(docRef, { role: newRole }, { merge: true });
  };

  const joinSchool = async (schoolCode: string) => {
    if (!user) return;
    // Logic to join school: 
    // 1. Find school by code
    // 2. Add user to school's enrollments or update user's schoolId
    console.log('Joining school with code:', schoolCode);
    // For now, just a placeholder as we need to define the school joining logic
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, logout, switchRole, joinSchool }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
