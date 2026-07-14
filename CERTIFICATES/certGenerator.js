// certGenerator.js - Generación de certificados en PNG y PDF sin dependencias de Firebase

function cargarImagen(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`No se pudo cargar la imagen: ${src}`));
    img.src = src;
  });
}

function limpiarNombre(nombreCompleto) {
  return nombreCompleto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "_");
}

// Dibuja el certificado en un canvas y retorna la URL base64
async function dibujarCertificadoEnCanvas(nombreCompleto) {
  const imgPath = "assets/plantilla.png";
  const img = await cargarImagen(imgPath);
  
  const canvas = document.createElement("canvas");
  canvas.width = img.width || 4663;
  canvas.height = img.height || 3294;
  const ctx = canvas.getContext("2d");
  
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  
  // Aumentar otro 15% (de 123 a 141px)
  ctx.font = "bold 141px 'Google Sans', sans-serif";
  ctx.fillStyle = "#000000"; 
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  
  // Convertir a mayúsculas
  const textoMayusculas = nombreCompleto.toUpperCase();

  // CENTRADO REAL: El centro de 4663 de ancho es 2331.5. 
  const exactX = canvas.width / 2;
  // Subir 10 píxeles adicionales: 1405 - 10 = 1395
  const exactY = 1395; 
  
  ctx.fillText(textoMayusculas, exactX, exactY);
  
  return canvas.toDataURL("image/png");
}

// Exporta generación en PDF
export async function generarCertificadoPDF(nombreCompleto) {
  const { jsPDF } = window.jspdf;
  const docPdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4"
  });

  const imgPath = "assets/plantilla.png";
  const img = await cargarImagen(imgPath);

  docPdf.addImage(img, "PNG", 0, 0, 297, 210);

  // Aumentar otro 15% (de 37 a 43 aprox)
  docPdf.setFont("helvetica", "bold");
  docPdf.setFontSize(43);
  
  docPdf.setTextColor(0, 0, 0);

  // Convertir a mayúsculas
  const textoMayusculas = nombreCompleto.toUpperCase();

  // CENTRADO REAL en A4: La mitad de 297mm es 148.5mm
  // Subir el equivalente a 10px adicionales: 89.55 - 0.637 = 88.9 mm
  docPdf.text(textoMayusculas, 148.5, 88.9, { align: "center" });

  const nombreArchivo = `certificado_${limpiarNombre(nombreCompleto)}.pdf`;
  docPdf.save(nombreArchivo);
}

// Exporta generación en PNG
export async function generarCertificadoPNG(nombreCompleto) {
  const dataUrl = await dibujarCertificadoEnCanvas(nombreCompleto);
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = `certificado_${limpiarNombre(nombreCompleto)}.png`;
  link.click();
}
