import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth, db } from '../js/firebase-config';

// Create Auth Context
const AuthContext = createContext();

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Auth Provider Component
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sign up with email and password
  async function signup(email, password, displayName) {
    try {
      setError(null);
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update profile with display name
      await updateProfile(result.user, { displayName });
      
      // Create user document in Firestore
      await setDoc(doc(db, 'users', result.user.uid), {
        uid: result.user.uid,
        email: result.user.email,
        displayName: displayName,
        role: 'user', // Default role
        plan: 'free',
        cvUploadsThisMonth: 0,
        cvUploadLimit: 10,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      });
      
      return result.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }

  // Sign in with email and password
  async function signin(email, password) {
    try {
      setError(null);
      const result = await signInWithEmailAndPassword(auth, email, password);

      // Update last login
      await setDoc(doc(db, 'users', result.user.uid), {
        lastLogin: new Date().toISOString()
      }, { merge: true });

      // Check if this is the master account and initialize if needed
      try {
        const functions = getFunctions();
        const initializeMaster = httpsCallable(functions, 'initializeMasterAccount');
        const masterResult = await initializeMaster();
        console.log('Master account check:', masterResult.data);

        // Force refresh user data to get updated plan/role
        const freshUserData = await getUserData(result.user.uid);
        if (freshUserData) {
          setCurrentUser({ ...result.user, userData: freshUserData });
        }
      } catch (masterError) {
        // Log but don't throw - not all users are master accounts
        console.log('Master account check failed:', masterError.message);
      }

      return result.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }

  // Sign in with Google
  async function signInWithGoogle() {
    try {
      setError(null);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      // Check if user document exists
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));

      // If user doesn't exist, create user document
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', result.user.uid), {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName,
          photoURL: result.user.photoURL,
          role: 'user', // Default role
          plan: 'free',
          cvUploadsThisMonth: 0,
          cvUploadLimit: 10,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        });
      } else {
        // Update last login
        await setDoc(doc(db, 'users', result.user.uid), {
          lastLogin: new Date().toISOString()
        }, { merge: true });
      }

      // Check if this is the master account and initialize if needed
      try {
        const functions = getFunctions();
        const initializeMaster = httpsCallable(functions, 'initializeMasterAccount');
        const masterResult = await initializeMaster();
        console.log('Master account check:', masterResult.data);

        // Force refresh user data to get updated plan/role
        const freshUserData = await getUserData(result.user.uid);
        if (freshUserData) {
          setCurrentUser({ ...result.user, userData: freshUserData });
        }
      } catch (masterError) {
        // Log but don't throw - not all users are master accounts
        console.log('Master account check failed:', masterError.message);
      }

      return result.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }

  // Sign out
  async function logout() {
    try {
      setError(null);
      await signOut(auth);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }

  // Reset password
  async function resetPassword(email) {
    try {
      setError(null);
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }

  // Get user data from Firestore
  async function getUserData(uid) {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();

        // Check team access
        try {
          const functions = getFunctions();
          const checkTeamAccess = httpsCallable(functions, 'checkTeamAccess');
          const teamResult = await checkTeamAccess();

          userData.teamAccess = {
            isTeamOwner: teamResult.data.isTeamOwner || false,
            isTeamMember: teamResult.data.isTeamMember || false,
            teamOwnerId: teamResult.data.teamOwnerId || null,
            role: teamResult.data.role || null
          };

          // If user is a team member, inherit owner's plan
          if (teamResult.data.isTeamMember && teamResult.data.ownerPlan) {
            userData.plan = teamResult.data.ownerPlan;
            console.log('Team member inheriting owner plan:', teamResult.data.ownerPlan);
          }
        } catch (teamError) {
          console.log('Team access check failed:', teamError.message);
          userData.teamAccess = {
            isTeamOwner: false,
            isTeamMember: false,
            teamOwnerId: null,
            role: null
          };
        }

        return userData;
      }
      return null;
    } catch (err) {
      console.error('Error getting user data:', err);
      return null;
    }
  }

  // Refresh current user data
  async function refreshUserData() {
    if (currentUser) {
      const userData = await getUserData(currentUser.uid);
      setCurrentUser({ ...currentUser, userData });
    }
  }

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Get additional user data from Firestore
        const userData = await getUserData(user.uid);
        setCurrentUser({ ...user, userData });
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userData: currentUser?.userData,
    signup,
    signin,
    signInWithGoogle,
    logout,
    resetPassword,
    getUserData,
    refreshUserData,
    error,
    setError
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}