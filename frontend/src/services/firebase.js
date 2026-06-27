import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, FacebookAuthProvider } from 'firebase/auth';

// Cấu hình Firebase thực từ dự án VESTRA mới của bạn
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyA8OH1qNo6RZ_L8piYgPzJTMTwn6grGCRs",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "vestra-ed052.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "vestra-ed052",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "vestra-ed052.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "332184354513",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:332184354513:web:1268196bb1e1529c328ff0"
};

// Khởi tạo Firebase App
const app = initializeApp(firebaseConfig);

// Khởi tạo các dịch vụ
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const facebookProvider = new FacebookAuthProvider();
export default app;
