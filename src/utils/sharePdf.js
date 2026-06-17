export function canSharePdfFile(file) {
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

export async function sharePdfFile(file, title) {
  if (file) {
    await navigator.share({
      files: [file]
    });
    return;
  }

  await navigator.share({
    title
  });
}

export function downloadPdfBlob(blob, fileName) {
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
}
