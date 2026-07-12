/**
 * Export ADIF file with multiple fallback strategies:
 * 1. Capacitor Filesystem + Share (if plugins available)
 * 2. Web Share API with File (native Android/iOS share sheet)
 * 3. Blob download (web browser fallback)
 */
export async function exportAdifFile(content, filename) {
  
  // === Strategy 1: Capacitor plugins ===
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (Capacitor.isNativePlatform()) {
      const { Filesystem, Directory, Encoding } = await import("@capacitor/filesystem");
      const { Share } = await import("@capacitor/share");
      
      const result = await Filesystem.writeFile({
        path: filename,
        data: content,
        directory: Directory.Cache,
        encoding: Encoding.UTF8,
      });
      
      await Share.share({
        title: "Export ADIF",
        url: result.uri,
        dialogTitle: "Enregistrer ou partager le fichier ADIF",
      });
      
      return { success: true, message: "Fichier partagé" };
    }
  } catch (e) {
    console.log("Capacitor export failed, trying Web Share API:", e?.message);
  }

  // === Strategy 2: Web Share API with File (works on Android Chrome/WebView) ===
  try {
    if (navigator.share && navigator.canShare) {
      const file = new File([content], filename, { type: "application/octet-stream" });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: "Export ADIF",
          files: [file],
        });
        return { success: true, message: "Fichier partagé" };
      }
    }
  } catch (e) {
    if (e?.name === "AbortError") {
      return { success: true, message: "Partage annulé" };
    }
    console.log("Web Share API failed, trying blob download:", e?.message);
  }

  // === Strategy 3: Blob download (web browser) ===
  try {
    const blob = new Blob([content], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 500);
    return { success: true, message: "Téléchargement lancé" };
  } catch (e) {
    return { success: false, message: `Erreur: ${e?.message || String(e)}` };
  }
}
