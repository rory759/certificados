# Sistema de Certificados Digitales con Firebase & jsPDF

Este proyecto es una plataforma web premium de generación y descarga segura de certificados digitales. Integra **Firebase Authentication (Passwordless)**, **Firestore Database** para verificar registros de alumnos, y la biblioteca **jsPDF** para renderizar el certificado sobre una plantilla local de manera fluida y responsiva.

---

## 🚀 Guía de Configuración Manual

### PASO 1: Configuración en Firebase Console
1. Ve a [Firebase Console](https://console.firebase.google.com/) y haz clic en **Agregar proyecto** (ej: `certificados-app`).
2. **Activar Authentication**:
   - En el menú izquierdo, ve a **Build > Authentication** y haz clic en **Comenzar**.
   - En la pestaña **Método de inicio de sesión**, selecciona **Correo electrónico/Contraseña**.
   - Habilita la segunda opción: **Vínculo por correo electrónico (inicio de sesión sin contraseña)** y haz clic en **Guardar**.
3. **Crear Firestore Database**:
   - Ve a **Build > Firestore Database** y haz clic en **Crear base de datos**.
   - Selecciona **Iniciar en modo de prueba** (luego actualizaremos las reglas) y haz clic en **Siguiente** y luego en **Habilitar**.
4. **Obtener credenciales**:
   - Ve a la **Configuración del proyecto** (icono de engranaje junto a "Descripción general del proyecto").
   - En la pestaña *General*, desplázate hasta *Tus apps* y crea una **Web App** (dale el nombre `certificados-web`).
   - Copia el objeto `firebaseConfig` generado y pégalo reemplazando los valores en tu archivo local [firebase-config.js](file:///e:/Watson/Desktop/CERTIFICATES/firebase-config.js).
5. **Configurar Dominios Autorizados**:
   - En **Authentication > Settings > Authorized domains** (o Dominios autorizados), haz clic en **Agregar dominio**.
   - Agrega el dominio de tu GitHub Pages: `tusuario.github.io` (reemplaza `tusuario` con tu nombre de usuario de GitHub). Esto es indispensable para que Firebase Auth permita el login desde allí.

---

## 🔒 Reglas de Seguridad Recomendadas

### 1. Reglas de Firestore
En la pestaña **Reglas (Rules)** de tu Firestore Database en la consola de Firebase, pega el siguiente bloque para asegurar que los usuarios autenticados solo puedan leer y modificar su propio documento:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /usuarios/{userId} {
      // Un usuario solo puede leer y actualizar su propio documento.
      // El ID del documento debe ser el email del usuario en minúsculas.
      allow read: if request.auth != null && request.auth.token.email.lower() == userId.lower();
      allow update: if request.auth != null && request.auth.token.email.lower() == userId.lower() 
                    && request.resource.data.email == resource.data.email 
                    && request.resource.data.nombreCompleto == resource.data.nombreCompleto;
      
      // Bloquear creación y eliminación por defecto desde el cliente por seguridad
      allow create, delete: if false;
    }
  }
}
```

### 2. Reglas de Storage (Opcional)
Si en el futuro decides hospedar la plantilla en Firebase Storage:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      // Permitir lectura a todo el mundo (público) pero escritura solo al admin
      allow read: if true;
      allow write: if false;
    }
  }
}
```

---

## 👥 Carga Manual de Usuarios de Prueba en Firestore

Para hacer pruebas rápidas en Firestore, puedes crear documentos de usuario directamente desde la consola web de Firebase:

1. Ve a **Firestore Database > Iniciar colección**.
2. Nombre de la colección: `usuarios`.
3. **ID del documento**: Introduce el correo electrónico en minúsculas del usuario de prueba (ej: `alumno@gmail.com`). *Es crucial usar el correo exacto como ID del documento.*
4. Agrega los siguientes campos en el documento:
   - **`email`** (Tipo: `string`): `alumno@gmail.com`
   - **`nombreCompleto`** (Tipo: `string`): `Juan Pérez Martínez`
   - **`certificadoGenerado`** (Tipo: `boolean`): `false`
   - **`fechaRegistro`** (Tipo: `timestamp`): Selecciona la fecha actual.

---

## 📧 Envío de Enlaces Únicos con EmailJS

Para invitar a tus usuarios a descargar su certificado mediante un enlace personalizado:

1. Crea una cuenta gratuita en [EmailJS](https://www.emailjs.com/).
2. Vincula tu servicio de correo (por ejemplo, Gmail).
3. Crea una plantilla de correo (Email Template) con el siguiente formato:
   ```html
   Hola {{nombreCompleto}},
   
   Tu certificado digital de finalización ya está listo para ser descargado.
   
   Para acceder de forma segura y descargar tu PDF, haz clic en el siguiente enlace:
   https://tusuario.github.io/certificados-app/?user={{email}}
   
   El equipo de Soporte.
   ```
4. Puedes enviar estos correos masivamente usando la sección de EmailJS o mediante un pequeño script de integración en Node/Python que lea tu base de datos y envíe los datos a la API de EmailJS.

---

## 🌐 Despliegue en GitHub Pages

Para publicar el sitio web de forma gratuita:

1. Abre tu terminal de PowerShell o Git Bash en la carpeta del proyecto:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Certificados App"
   ```
2. Crea un repositorio vacío en tu cuenta de GitHub llamado `certificados-app`.
3. Vincula y sube tu código local:
   ```bash
   git branch -M main
   git remote add origin https://github.com/tusuario/certificados-app.git
   git push -u origin main
   ```
4. Configura GitHub Pages:
   - En tu repositorio de GitHub, ve a **Settings > Pages**.
   - En *Build and deployment*, bajo **Source**, selecciona **Deploy from a branch**.
   - En *Branch*, selecciona **main** y la carpeta **/ (root)**. Haz clic en **Save**.
5. Espera 1-2 minutos y tu sitio estará en línea en `https://tusuario.github.io/certificados-app/`.

---

## 🧪 Cómo Probar la Aplicación (Doble Flujo)

El sistema ahora cuenta con dos pestañas de navegación que facilitan el testeo y desarrollo:

### 1. Certificado de Prueba (Pestaña 1 - Activa por Defecto)
* **Propósito**: Probar el renderizado, centrado del texto y la descarga del PDF de forma instantánea sin necesidad de configurar Firebase.
* **Instrucciones**:
  1. Abre tu servidor local (ej: `http://127.0.0.1:5500/index.html`).
  2. En la pestaña **1. Certificado de Prueba**, escribe cualquier nombre en el input (ej. `María José Pérez`).
  3. Haz clic en **Generar Certificado de Prueba**.
  4. Se descargará un archivo PDF con el nombre que escribiste sobre tu plantilla `assets/plantilla.png`.

### 2. Forma Oficial - Firebase (Pestaña 2)
* **Propósito**: Validar la autenticación real Passwordless (Email Link Auth) y restringir descargas únicamente a correos registrados en Firestore.
* **Instrucciones**:
  1. Haz clic en la pestaña **2. Forma Oficial (Firebase)**.
  2. El sistema cargará el estado seguro. Si no estás logueado y entras sin parámetros, te pedirá tu correo.
  3. Introduce el correo que agregaste previamente en Firestore (ej: `tu-correo@gmail.com`) y pulsa **Enviar Enlace**.
  4. Firebase enviará automáticamente un correo electrónico a tu buzón.
  5. **Bandeja de Entrada**: Entra a tu correo personal, busca el mensaje de Firebase (puede tardar unos segundos o caer en Spam/No deseado) y **haz clic en el enlace seguro**.
  6. Al hacer clic, el enlace te redirigirá a la app. Verás brevemente la pantalla de carga e inmediatamente después aparecerá tu nombre extraído de Firestore en una pantalla de bienvenida premium.
  7. Pulsa **Generar mi Certificado** para descargar el PDF final. Al hacerlo, el campo `certificadoGenerado` pasará a ser `true` en tu base de datos de Firestore.

---

## 🛠️ Solución de Problemas Comunes

* **La app se queda en "Validando seguridad..." al pulsar la pestaña de Firebase**:
  - Asegúrate de haber completado el **Paso 4 (Configuración)** ingresando tus credenciales reales en `firebase-config.js`. Si usas las credenciales ficticias de demostración, la app no se conectará y el loader se quedará de forma permanente.
* **No me llega el correo de Firebase con el enlace**:
  - Revisa tu bandeja de Spam o Correo no deseado.
  - Asegúrate de haber activado el **Vínculo por correo electrónico (inicio de sesión sin contraseña)** en la sección de Authentication de tu consola de Firebase.
* **Error de CORS o no carga la imagen**:
  - Recuerda que es indispensable levantar un servidor de desarrollo local (como la extensión Live Server en VS Code o ejecutando `npx http-server` en el directorio de trabajo). Si abres el archivo haciendo doble clic directo en el archivo `index.html` (ruta `file://`), el navegador bloqueará la carga de Firebase y de archivos locales de imagen por razones de seguridad.

