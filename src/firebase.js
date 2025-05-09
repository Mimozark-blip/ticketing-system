import { initializeApp } from "firebase/app";

import {
  getAuth,
  GoogleAuthProvider,
  signInWithRedirect,
  signInWithPopup,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  // apiKey: "AIzaSyCGWkzLMgz9KdF3zTYxMlN2jtEdaRr4KAo",
  // authDomain: "ticketingapp-22d74.firebaseapp.com",
  // projectId: "ticketingapp-22d74",
  // storageBucket: "ticketingapp-22d74.firebasestorage.app",
  // messagingSenderId: "117931534196",
  // appId: "1:117931534196:web:116ca51ee2152ef206ee21",

  // apiKey: "AIzaSyCLjs9dvn-KigY6Jg1U4kq3CHqBBZGUNus",
  // authDomain: "ticketingapp-23abf.firebaseapp.com",
  // projectId: "ticketingapp-23abf",
  // storageBucket: "ticketingapp-23abf.firebasestorage.app",
  // messagingSenderId: "259410840435",
  // appId: "1:259410840435:web:6df512b8e3ed1057a45306",
  // measurementId: "G-KYCSG35WDF",

  apiKey: "AIzaSyCvNsZxEszkBJGmdN5p7qz0c5yhP4EuRuw",
  authDomain: "ticketingapp-7b4f7.firebaseapp.com",
  projectId: "ticketingapp-7b4f7",
  storageBucket: "ticketingapp-7b4f7.firebasestorage.app",
  messagingSenderId: "890480368611",
  appId: "1:890480368611:web:a0e2e6ad1312ac7c975ed6",
  measurementId: "G-N6CMKXB0CC",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

// ✅ Google Sign-In using Redirect (COOP-Safe)
export const signInWithGoogleRedirect = async () => {
  try {
    await signInWithRedirect(auth, googleProvider);
  } catch (error) {
    console.error("Google Sign-In Redirect Error:", error.message);
  }
};

// ✅ Google Sign-In using Popup (No window.close)
export const signInWithGooglePopup = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    console.log("User signed in:", result.user);
  } catch (error) {
    console.error("Google Sign-In Popup Error:", error.message);
  }
};
