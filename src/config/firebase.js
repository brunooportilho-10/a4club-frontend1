import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "COLE_AQUI_apiKey",
  authDomain: "a4-club-e3d2f.firebaseapp.com",
  projectId: "a4-club-e3d2f",
  storageBucket: "a4-club-e3d2f.appspot.com",
  messagingSenderId: "COLE_AQUI_messagingSenderId",
  appId: "COLE_AQUI_appId"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
