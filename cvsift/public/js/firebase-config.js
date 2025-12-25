// Firebase Configuration for CVSift
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCSMYG08Nf7TUtV5HfGEHIM-9yPz5nioC0",
  authDomain: "cvsift-3dff8.firebaseapp.com",
  projectId: "cvsift-3dff8",
  storageBucket: "cvsift-3dff8.firebasestorage.app",
  messagingSenderId: "796887835619",
  appId: "1:796887835619:web:db0557cb12ec69b637f6d6",
  measurementId: "G-LY1RPH3S11"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
let analytics = null;
try {
  analytics = getAnalytics(app);
} catch (error) {
  console.warn('Analytics not available:', error.message);
}

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app, 'us-central1'); // Specify the region where your functions are deployed

// Export for use throughout the app
export { app, analytics, auth, db, storage, functions };