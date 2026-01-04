// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCCoVGcNYlHyVSjgdRi39J8qv17Ajaj_4w",
  authDomain: "travels-7e32e.firebaseapp.com",
  projectId: "travels-7e32e",
  storageBucket: "travels-7e32e.firebasestorage.app",
  messagingSenderId: "781881939566",
  appId: "1:781881939566:web:7211c9eacd06ff2645f87f",
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
