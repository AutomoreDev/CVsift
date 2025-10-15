// Import the functions you need from the SDKs you need
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';

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
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, analytics, auth, db, storage };
