import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDUv7uboaGJ9h0Ht70NNqG5NidulgHckRs",
  authDomain: "a4-club-e3d2f.firebaseapp.com",
  projectId: "a4-club-e3d2f",
  storageBucket: "a4-club-e3d2f.firebasestorage.app",
  messagingSenderId: "205555459568",
  appId: "1:205555459568:web:49139a07836df44402a935"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
