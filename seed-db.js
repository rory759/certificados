// seed-db.js - Script de Utilidad para Cargar Usuarios de Prueba en Firestore
// Puedes ejecutar este código directamente en la Consola del Desarrollador (F12) de tu navegador 
// en tu aplicación local una vez que Firebase esté inicializado, o adaptarlo para un script de Node.js.

import { db } from "./firebase-config.js";
import { doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Lista de usuarios de prueba a agregar
const usuariosPrueba = [
  {
    email: "alumno1@gmail.com",
    nombreCompleto: "Sofía Valentina Rodríguez",
    certificadoGenerado: false
  },
  {
    email: "alumno2@gmail.com",
    nombreCompleto: "Mateo Alejandro Fernández",
    certificadoGenerado: false
  },
  {
    email: "alumno3@gmail.com",
    nombreCompleto: "Camila Isabella Silva",
    certificadoGenerado: false
  }
];

/**
 * Agrega los usuarios de prueba a la colección 'usuarios' en Firestore.
 * El ID del documento se establece como el email del usuario para búsquedas rápidas.
 */
export async function sembrarBaseDeDatos() {
  console.log("Iniciando carga de usuarios de prueba...");
  
  for (const usuario of usuariosPrueba) {
    const emailLower = usuario.email.trim().toLowerCase();
    try {
      // Usamos el email como ID del documento
      const docRef = doc(db, "usuarios", emailLower);
      await setDoc(docRef, {
        email: emailLower,
        nombreCompleto: usuario.nombreCompleto,
        certificadoGenerado: usuario.certificadoGenerado,
        fechaRegistro: serverTimestamp()
      });
      console.log(`✅ Usuario agregado con éxito: ${emailLower} (${usuario.nombreCompleto})`);
    } catch (error) {
      console.error(`❌ Error al agregar usuario ${emailLower}:`, error);
    }
  }
  
  console.log("Proceso de carga de usuarios finalizado.");
}

// Nota: Si quieres ejecutarlo desde el navegador, puedes importar este archivo temporalmente en app.js y llamar a sembrarBaseDeDatos();
