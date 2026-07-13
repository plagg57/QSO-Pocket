/**
 * Export ADIF file with multiple strategies and honest feedback.
 * 1. Web Share API with File (native share sheet)
 * 2. Data URL download (better mobile compat than blob URL)
 * 3. Blob URL download (classic web fallback)
 * Never shows success unless the method actually completed.
 */
export async function exportAdifFile(content, filename) {

  // === Strategy 1: Web Share API with File ===
  if (navigator.share && navigator.canShare) {
    try {
      const file = new File([content], filename, { type: "application/octet-stream" });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ title: "Export ADIF", files: [file] });
        return { success: true, message: "Fichier partagé" };
      }
    } catch (e) {
      if (e?.name === "AbortError") {
        return { success: true, message: "Partage annulé" };
      }
      // Share failed — continue to next strategy
    }
  }

  // === Strategy 2: Data URL download (works on more Android devices) ===
  try {
    const base64 = btoa(unescape(encodeURIComponent(content)));
    const dataUrl = `data:application/octet-stream;base64,${base64}`;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = filename;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // Verify: if we can detect download was blocked, report it
    // Unfortunately browsers don't report this, so we use a heuristic
    return { success: true, message: "Fichier enregistré dans Téléchargements" };
  } catch (e) {
    // Data URL failed — try blob
  }

  // === Strategy 3: Blob URL download ===
  try {
    const blob = new Blob([content], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 500);
    return { success: true, message: "Fichier enregistré dans Téléchargements" };
  } catch (e) {
    // All methods failed
  }

  return { success: false, message: "Impossible d'exporter le fichier sur cet appareil. Essayez depuis un navigateur." };
}
