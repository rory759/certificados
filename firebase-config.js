// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCki7qLf8FowYcKM_sPTvQGm19W8meUPSA",
  authDomain: "certificados-app-98589.firebaseapp.com",
  projectId: "certificados-app-98589",
  storageBucket: "certificados-app-98589.firebasestorage.app",
  messagingSenderId: "587239828047",
  appId: "1:587239828047:web:2921ab899db048301ad83a",
  measurementId: "G-5Q3DTFTPX0"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Exportar servicios para usar en app.js
export { app, auth, db, firebaseConfig };
