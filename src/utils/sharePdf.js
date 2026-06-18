import { Capacitor } from "@capacitor/core";
import { Directory, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

const APP_FOLDER = "GFCC";

const isNativePlatform = () => Capacitor.isNativePlatform();

const toBase64 = (blob) => new Promise((resolve, reject) => {
  const reader = new FileReader();

  reader.onerror = () => reject(new Error("PDF_READ_ERROR"));
  reader.onload = () => {
    const result = typeof reader.result === "string" ? reader.result : "";
    const [, base64 = ""] = result.split(",");
    resolve(base64);
  };

  reader.readAsDataURL(blob);
});

const writePdfFile = async (blob, fileName, directory) => {
  const base64Data = await toBase64(blob);
  const path = `${APP_FOLDER}/${fileName}`;
  const { uri } = await Filesystem.writeFile({
    path,
    data: base64Data,
    directory,
    recursive: true
  });

  return {
    path,
    uri
  };
};

export async function canSharePdfFile(file) {
  if (isNativePlatform()) {
    try {
      const { value } = await Share.canShare();
      return Boolean(value);
    } catch {
      return false;
    }
  }

  if (!file || typeof navigator === "undefined") {
    return false;
  }

  if (typeof navigator.share !== "function" || typeof navigator.canShare !== "function") {
    return false;
  }

  try {
    return navigator.canShare({ files: [file] });
  } catch {
    return false;
  }
}

export async function sharePdfFile({ file, blob, fileName, title }) {
  if (isNativePlatform()) {
    if (!blob || !fileName) {
      throw new Error("PDF_NATIVE_SHARE_DATA_MISSING");
    }

    const { uri } = await writePdfFile(blob, fileName, Directory.Cache);
    await Share.share({
      title,
      dialogTitle: title,
      files: [uri]
    });

    return { uri };
  }

  if (file) {
    await navigator.share({
      title,
      files: [file]
    });
    return null;
  }

  await navigator.share({ title });
  return null;
}

export async function downloadPdfBlob(blob, fileName) {
  if (isNativePlatform()) {
    try {
      const { path, uri } = await writePdfFile(blob, fileName, Directory.Documents);

      return {
        native: true,
        publicLocation: true,
        path,
        uri
      };
    } catch {
      const { path, uri } = await writePdfFile(blob, fileName, Directory.Data);

      return {
        native: true,
        publicLocation: false,
        path,
        uri
      };
    }
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);

  return {
    native: false,
    url
  };
}
