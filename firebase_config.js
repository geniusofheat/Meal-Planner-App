// ================================================================
//  firebase_config.js — Shared Firebase Initialization
//  Import this file on every page that needs Auth or Firestore
// ================================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBod_5fi96oZ-Q7y9i8Iy-DL-uCkpMaACQ",
  authDomain: "meal-planner-app-16afd.firebaseapp.com",
  projectId: "meal-planner-app-16afd",
  storageBucket: "meal-planner-app-16afd.firebasestorage.app",
  messagingSenderId: "718879895385",
  appId: "1:718879895385:web:fce2ebf3ea17014830e648"
};

const app    = initializeApp(firebaseConfig);
const auth   = getAuth(app);
const db     = getFirestore(app);

export { app, auth, db, onAuthStateChanged };
