import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

/**
 * Export ADIF file. Uses Capacitor native APIs on Android/iOS,
 * falls back to blob download on web.
 * @param {string} content - ADIF file content
 * @param {string} filename - File name (e.g. "F4MVD_log.adi")
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function exportAdifFile(content, filename) {
  const isNative = Capacitor.isNativePlatform();

  if (isNative) {
    // === Native (Android / iOS) ===
    try {
      const result = await Filesystem.writeFile({
        path: filename,
        data: content,
        directory: Directory.Cache,
        encoding: Encoding.UTF8,
      });

      const fileUri = result.uri;

      await Share.share({
        title: "Export ADIF",
        text: `Fichier ${filename}`,
        url: fileUri,
        dialogTitle: "Enregistrer ou partager le fichier ADIF",
      });

      return { success: true, message: "Fichier partagé" };
    } catch (err) {
      const msg = err?.message || String(err);
      if (msg.includes("cancel") || msg.includes("dismiss")) {
        return { success: true, message: "Partage annulé" };
      }
      return { success: false, message: `Erreur: ${msg}` };
    }
  } else {
    // === Web (navigateur) ===
    try {
      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 500);
      return { success: true, message: "Téléchargement lancé" };
    } catch (err) {
      return { success: false, message: `Erreur: ${err?.message || String(err)}` };
    }
  }
}
