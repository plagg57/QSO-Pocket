/**
 * Export ADIF file — multi-strategy with honest feedback and detailed logging.
 * 
 * Android (Capacitor):
 *   1. Capacitor Filesystem + Share (real file + native share sheet)
 *   2. Web Share API with File (if supported)
 *   3. Clipboard fallback (no fake success)
 * 
 * Web (browser):
 *   1. Blob URL download
 *   2. Clipboard fallback
 */

const log = (msg, data) => console.log(`[ADIF Export] ${msg}`, data || "");

async function isCapacitorAvailable() {
  try {
    const { Capacitor } = await import("@capacitor/core");
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

async function tryCapacitorExport(content, filename) {
  log("Trying Capacitor Filesystem + Share...");
  
  const { Filesystem, Directory, Encoding } = await import("@capacitor/filesystem");
  const { Share } = await import("@capacitor/share");
  
  // Step 1: Write file
  log("Writing file with Filesystem...");
  const writeResult = await Filesystem.writeFile({
    path: filename,
    data: content,
    directory: Directory.Cache,
    encoding: Encoding.UTF8,
  });
  log("Filesystem.writeFile SUCCESS", { uri: writeResult.uri });
  
  // Step 2: Share file
  log("Opening Share sheet...");
  await Share.share({
    title: "Export ADIF",
    url: writeResult.uri,
    dialogTitle: "Enregistrer ou partager le fichier ADIF",
  });
  log("Share.share completed (user interacted with share sheet)");
  
  return { success: true, message: "Fichier ADIF prêt à être partagé" };
}

async function tryWebShareApi(content, filename) {
  log("Checking Web Share API...");
  
  if (!navigator.share) {
    log("navigator.share NOT available");
    return null;
  }
  if (!navigator.canShare) {
    log("navigator.canShare NOT available");
    return null;
  }
  
  const file = new File([content], filename, { type: "application/octet-stream" });
  const canShareFiles = navigator.canShare({ files: [file] });
  log("navigator.canShare({ files })", { canShareFiles });
  
  if (!canShareFiles) {
    log("Device cannot share files via Web Share API");
    return null;
  }
  
  log("Calling navigator.share with file...");
  await navigator.share({ title: "Export ADIF", files: [file] });
  log("Web Share API completed successfully");
  
  return { success: true, message: "Fichier ADIF prêt à être partagé" };
}

function tryBlobDownload(content, filename) {
  log("Trying Blob URL download (web browser)...");
  
  const blob = new Blob([content], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 500);
  
  log("Blob download triggered");
  return { success: true, message: "Fichier enregistré dans Téléchargements" };
}

async function tryClipboard(content) {
  log("Fallback: copying ADIF to clipboard...");
  await navigator.clipboard.writeText(content);
  log("Clipboard copy success");
  return { success: true, message: "Contenu ADIF copié dans le presse-papier (aucun fichier créé)" };
}

export async function exportAdifFile(content, filename) {
  const native = await isCapacitorAvailable();
  log("Platform", { native, userAgent: navigator.userAgent });

  if (native) {
    // === ANDROID / iOS (Capacitor) ===
    
    // Strategy 1: Capacitor Filesystem + Share
    try {
      return await tryCapacitorExport(content, filename);
    } catch (e) {
      const msg = e?.message || String(e);
      log("Capacitor export FAILED", { error: msg });
      // User cancelled share = still OK
      if (msg.includes("cancel") || msg.includes("dismiss") || msg.includes("abort")) {
        return { success: true, message: "Partage annulé" };
      }
    }

    // Strategy 2: Web Share API with File
    try {
      const result = await tryWebShareApi(content, filename);
      if (result) return result;
    } catch (e) {
      const msg = e?.message || String(e);
      log("Web Share API FAILED", { error: msg });
      if (e?.name === "AbortError") {
        return { success: true, message: "Partage annulé" };
      }
    }

    // Strategy 3: Clipboard (no fake file download)
    try {
      return await tryClipboard(content);
    } catch (e) {
      log("Clipboard FAILED", { error: e?.message });
    }

    return { success: false, message: "Impossible d'exporter sur cet appareil. Essayez depuis un navigateur." };

  } else {
    // === WEB BROWSER ===
    
    // Strategy 1: Blob download
    try {
      return tryBlobDownload(content, filename);
    } catch (e) {
      log("Blob download FAILED", { error: e?.message });
    }

    // Strategy 2: Clipboard
    try {
      return await tryClipboard(content);
    } catch (e) {
      log("Clipboard FAILED", { error: e?.message });
    }

    return { success: false, message: "Impossible d'exporter le fichier." };
  }
}
