// app.js
import { generarCertificadoPDF, generarCertificadoPNG } from "./certGenerator.js";

// ----------------------------------------------------
// 1. GESTIÓN DE PESTAÑAS (SÍNCRONA)
// ----------------------------------------------------
const tabs = ["prueba", "google", "manual"];
tabs.forEach(tab => {
  document.getElementById(`tab-${tab}`).addEventListener("click", () => {
    tabs.forEach(t => {
      document.getElementById(`tab-${t}`).classList.remove("active");
      document.getElementById(`section-${t}`).classList.remove("active");
    });
    document.getElementById(`tab-${tab}`).classList.add("active");
    document.getElementById(`section-${tab}`).classList.add("active");
  });
});

// ----------------------------------------------------
// 2. PESTAÑA 1: PRUEBA LIBRE (Sin BD)
// ----------------------------------------------------
const inputNamePrueba = document.getElementById("input-name-prueba");
document.getElementById("btn-generate-png-prueba").addEventListener("click", async function() {
  const nombre = inputNamePrueba.value.trim();
  if (!nombre) return alert("Escribe tu nombre.");
  this.disabled = true; this.innerText = "Generando...";
  await generarCertificadoPNG(nombre).catch(console.error);
  this.innerText = "Descargar PNG"; this.disabled = false;
});
document.getElementById("btn-generate-pdf-prueba").addEventListener("click", async function() {
  const nombre = inputNamePrueba.value.trim();
  if (!nombre) return alert("Escribe tu nombre.");
  this.disabled = true; this.innerText = "Generando...";
  await generarCertificadoPDF(nombre).catch(console.error);
  this.innerText = "Descargar PDF"; this.disabled = false;
});

// ----------------------------------------------------
// 3. INICIALIZACIÓN DE FIREBASE PARA PESTAÑAS 2 Y 3
// ----------------------------------------------------
let auth, db, signInWithPopup, GoogleAuthProvider, doc, getDoc, query, collection, where, getDocs, updateDoc;

async function inicializarFirebase() {
  try {
    const config = await import("./firebase-config.js");
    auth = config.auth;
    db = config.db;

    const authSDK = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js");
    signInWithPopup = authSDK.signInWithPopup;
    GoogleAuthProvider = authSDK.GoogleAuthProvider;

    const firestoreSDK = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
    doc = firestoreSDK.doc;
    getDoc = firestoreSDK.getDoc;
    query = firestoreSDK.query;
    collection = firestoreSDK.collection;
    where = firestoreSDK.where;
    getDocs = firestoreSDK.getDocs;
    updateDoc = firestoreSDK.updateDoc;

  } catch (error) {
    console.error("Error cargando Firebase:", error);
    document.getElementById("google-error-msg").innerText = "Firebase no configurado correctamente.";
    document.getElementById("manual-error-msg").innerText = "Firebase no configurado correctamente.";
  }
}
inicializarFirebase();

// Función auxiliar para buscar usuario en Firestore
async function buscarUsuario(email) {
  const emailLower = email.trim().toLowerCase();
  
  // Intento 1: Por ID de documento (si el ID es el correo)
  try {
    const docSnap = await getDoc(doc(db, "usuarios", emailLower));
    if (docSnap.exists()) return { ref: doc(db, "usuarios", emailLower), data: docSnap.data() };
  } catch(e) {}

  // Intento 2: Por campo "email"
  try {
    const q = query(collection(db, "usuarios"), where("email", "==", emailLower));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const docRef = doc(db, "usuarios", querySnapshot.docs[0].id);
      return { ref: docRef, data: querySnapshot.docs[0].data() };
    }
  } catch(e) {}

  return null;
}

// Función común para generar oficialmente y bloquear
async function descargarOficial(tipo, emailRef, emailUsuario, nombre, metodo, btnElem) {
  if (!emailRef) return;
  
  try {
    btnElem.disabled = true;
    btnElem.innerText = "Generando...";

    // 1. Doble check de seguridad en la DB
    const docSnap = await getDoc(emailRef);
    if (!docSnap.exists() || docSnap.data().certificadoGenerado === true) {
      alert("Acceso denegado. Este certificado ya fue emitido.");
      location.reload();
      return;
    }

    // 2. Generar el archivo
    if (tipo === 'png') await generarCertificadoPNG(nombre);
    else await generarCertificadoPDF(nombre);

    // 3. Bloquear en la base de datos y guardar el nombre y método usado
    await updateDoc(emailRef, { 
      certificadoGenerado: true,
      nombreGenerado: nombre,
      metodoLogin: metodo
    });
    
    alert("¡Certificado generado exitosamente! Su acceso ha sido bloqueado para futuras emisiones.");
    location.reload(); // Recargar para volver al estado inicial y aplicar el bloqueo visual

  } catch (error) {
    console.error(error);
    alert("Error generando certificado: " + error.message);
  } finally {
    btnElem.disabled = false;
    btnElem.innerText = tipo === 'png' ? "Descargar PNG" : "Descargar PDF";
  }
}


// ----------------------------------------------------
// 4. LÓGICA PESTAÑA 2: GOOGLE AUTH
// ----------------------------------------------------
let currentGoogleRef = null;
let currentGoogleEmail = "";

document.getElementById("btn-login-google").addEventListener("click", async () => {
  if (!auth) return alert("Firebase aún cargando. Intenta de nuevo en 2 segundos.");
  
  const btn = document.getElementById("btn-login-google");
  const errorMsg = document.getElementById("google-error-msg");
  btn.disabled = true; errorMsg.innerText = "";

  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const userEmail = result.user.email;

    const userDoc = await buscarUsuario(userEmail);
    
    if (!userDoc) {
      errorMsg.innerText = `El correo ${userEmail} no está registrado en la base de datos de alumnos.`;
      auth.signOut();
      btn.disabled = false;
      return;
    }

    if (userDoc.data.certificadoGenerado === true) {
      errorMsg.innerText = `El certificado para ${userEmail} YA fue generado. No se puede emitir dos veces.`;
      auth.signOut();
      btn.disabled = false;
      return;
    }

    // Usuario válido y sin certificado emitido. Mostrar formulario.
    currentGoogleRef = userDoc.ref;
    currentGoogleEmail = userEmail;
    document.getElementById("google-user-email").innerText = userEmail;
    document.getElementById("google-login-box").classList.remove("active");
    document.getElementById("google-form-box").classList.remove("hidden");
    document.getElementById("google-form-box").classList.add("active");
    
  } catch (error) {
    console.error("Error completo de Google Auth:", error);
    errorMsg.innerText = "Error Firebase: " + error.message + " (Si dice 'unauthorized domain', usa localhost en vez de 127.0.0.1)";
    btn.disabled = false;
  }
});

document.getElementById("btn-generate-png-google").addEventListener("click", function() {
  const nombre = document.getElementById("input-name-google").value.trim();
  if (!nombre) return alert("Por favor escriba su nombre.");
  descargarOficial('png', currentGoogleRef, currentGoogleEmail, nombre, 'Google', this);
});

document.getElementById("btn-generate-pdf-google").addEventListener("click", function() {
  const nombre = document.getElementById("input-name-google").value.trim();
  if (!nombre) return alert("Por favor escriba su nombre.");
  descargarOficial('pdf', currentGoogleRef, currentGoogleEmail, nombre, 'Google', this);
});

// ----------------------------------------------------
// 5. LÓGICA PESTAÑA 3: MANUAL
// ----------------------------------------------------
let currentManualRef = null;
let currentManualEmail = "";

document.getElementById("form-check-email").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!db) return alert("Firebase aún cargando. Intenta de nuevo en 2 segundos.");

  const emailInput = document.getElementById("input-email-manual").value.trim();
  const btn = document.getElementById("btn-check-email");
  const errorMsg = document.getElementById("manual-error-msg");
  
  btn.disabled = true; btn.innerText = "Buscando..."; errorMsg.innerText = "";

  try {
    const userDoc = await buscarUsuario(emailInput);

    if (!userDoc) {
      errorMsg.innerText = "Este correo no está registrado en la base de datos.";
      btn.disabled = false; btn.innerText = "Verificar Correo";
      return;
    }

    if (userDoc.data.certificadoGenerado === true) {
      errorMsg.innerText = "El certificado para este correo YA fue generado.";
      btn.disabled = false; btn.innerText = "Verificar Correo";
      return;
    }

    currentManualRef = userDoc.ref;
    currentManualEmail = emailInput;
    document.getElementById("manual-user-email").innerText = emailInput;
    document.getElementById("manual-login-box").classList.remove("active");
    document.getElementById("manual-form-box").classList.remove("hidden");
    document.getElementById("manual-form-box").classList.add("active");

  } catch (error) {
    errorMsg.innerText = "Error de conexión con la base de datos.";
    btn.disabled = false; btn.innerText = "Verificar Correo";
  }
});

document.getElementById("btn-generate-png-manual").addEventListener("click", function() {
  const nombre = document.getElementById("input-name-manual").value.trim();
  if (!nombre) return alert("Por favor escriba su nombre.");
  descargarOficial('png', currentManualRef, currentManualEmail, nombre, 'Manual', this);
});

document.getElementById("btn-generate-pdf-manual").addEventListener("click", function() {
  const nombre = document.getElementById("input-name-manual").value.trim();
  if (!nombre) return alert("Por favor escriba su nombre.");
  descargarOficial('pdf', currentManualRef, currentManualEmail, nombre, 'Manual', this);
});

// ----------------------------------------------------
// 6. LÓGICA DE ADMINISTRADOR (MODAL Y DESBLOQUEO)
// ----------------------------------------------------
const adminModal = document.getElementById("admin-modal");
const adminLoginView = document.getElementById("admin-login-view");
const adminPanelView = document.getElementById("admin-panel-view");

document.getElementById("btn-open-admin").addEventListener("click", () => {
  adminModal.classList.remove("hidden");
  adminLoginView.classList.add("active");
  adminPanelView.classList.remove("active");
  document.getElementById("admin-user").value = "";
  document.getElementById("admin-pass").value = "";
  document.getElementById("admin-login-error").innerText = "";
});

document.getElementById("btn-close-admin").addEventListener("click", () => {
  adminModal.classList.add("hidden");
});

// Función auxiliar para renderizar la tabla del admin
async function cargarTablaAdmin() {
  const tbody = document.getElementById("admin-table-body");
  const loading = document.getElementById("admin-loading-msg");
  const empty = document.getElementById("admin-empty-msg");
  
  tbody.innerHTML = "";
  loading.classList.remove("hidden");
  empty.classList.add("hidden");

  try {
    const q = query(collection(db, "usuarios"), where("certificadoGenerado", "==", true));
    const querySnapshot = await getDocs(q);
    
    loading.classList.add("hidden");

    if (querySnapshot.empty) {
      empty.classList.remove("hidden");
      return;
    }

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const tr = document.createElement("tr");
      tr.id = `row-${docSnap.id}`;
      
      const email = data.email || docSnap.id;
      const nombreGenerado = data.nombreGenerado || "No registrado";
      const metodo = data.metodoLogin || "No registrado";
      
      tr.innerHTML = `
        <td>${email}</td>
        <td>${nombreGenerado}</td>
        <td><span style="background:#0f172a; color:#fff; padding:2px 6px; border-radius:4px; font-size:10px;">${metodo}</span></td>
        <td>
          <button class="btn-unlock-small" data-id="${docSnap.id}">Desbloquear</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    // Agregar eventos a los botones
    document.querySelectorAll(".btn-unlock-small").forEach(btn => {
      btn.addEventListener("click", async function() {
        const id = this.getAttribute("data-id");
        this.disabled = true;
        this.innerText = "Procesando...";
        
        try {
          const docRef = doc(db, "usuarios", id);
          await updateDoc(docRef, { certificadoGenerado: false });
          // Remover fila visualmente
          document.getElementById(`row-${id}`).remove();
          
          // Comprobar si la tabla quedó vacía
          if (tbody.children.length === 0) {
            empty.classList.remove("hidden");
          }
        } catch (error) {
          alert("Error al desbloquear: " + error.message);
          this.disabled = false;
          this.innerText = "Desbloquear";
        }
      });
    });

  } catch (error) {
    loading.classList.add("hidden");
    alert("Error cargando la lista: " + error.message);
  }
}

document.getElementById("form-admin-login").addEventListener("submit", (e) => {
  e.preventDefault();
  const user = document.getElementById("admin-user").value;
  const pass = document.getElementById("admin-pass").value;
  
  if (user === "admin" && pass === "admin123") {
    adminLoginView.classList.remove("active");
    adminPanelView.classList.remove("hidden");
    adminPanelView.classList.add("active");
    cargarTablaAdmin();
  } else {
    document.getElementById("admin-login-error").innerText = "Credenciales incorrectas.";
  }
});

const btnUnlockAll = document.getElementById("btn-unlock-all");
if (btnUnlockAll) {
  btnUnlockAll.addEventListener("click", async () => {
    if (!confirm("¿Seguro que deseas desbloquear a TODOS los alumnos al mismo tiempo?")) return;
    
    btnUnlockAll.disabled = true;
    btnUnlockAll.innerText = "Desbloqueando...";
    
    try {
      const q = query(collection(db, "usuarios"), where("certificadoGenerado", "==", true));
      const querySnapshot = await getDocs(q);
      
      let count = 0;
      for (const docSnap of querySnapshot.docs) {
        await updateDoc(docSnap.ref, { certificadoGenerado: false });
        count++;
      }
      
      alert(`¡Éxito! Se han desbloqueado ${count} alumnos en total.`);
      cargarTablaAdmin(); // Recargar la tabla
    } catch (err) {
      alert("Error desbloqueando todos: " + err.message);
    } finally {
      btnUnlockAll.disabled = false;
      btnUnlockAll.innerText = "🔓 Desbloquear a TODOS los alumnos";
    }
  });
}
