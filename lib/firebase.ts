import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyDUv7uboaGJ9h0Ht70NNqG5NidulgHckRs",
  authDomain: "a4-club-e3d2f.firebaseapp.com",
  projectId: "a4-club-e3d2f",
  storageBucket: "a4-club-e3d2f.firebasestorage.app",
  messagingSenderId: "205555459568",
  appId: "1:205555459568:web:49139a07836df44402a935"
}

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)

export const auth = getAuth(app)
export default app
