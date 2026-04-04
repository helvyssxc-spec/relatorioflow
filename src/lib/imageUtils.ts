/**
 * Comprime uma imagem antes do upload para o Storage.
 * Reduz tamanho em ~80% sem perda visual perceptível.
 */
export async function compressImage(
  file: File,
  maxPx: number = 1200,
  quality: number = 0.82
): Promise<File> {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;

      if (width > maxPx || height > maxPx) {
        if (width > height) {
          height = Math.round((height * maxPx) / width);
          width = maxPx;
        } else {
          width = Math.round((width * maxPx) / height);
          height = maxPx;
        }
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          const compressed = new File(
            [blob!],
            file.name.replace(/\.[^.]+$/, ".jpg"),
            { type: "image/jpeg" }
          );
          resolve(compressed);
        },
        "image/jpeg",
        quality
      );
    };

    img.src = url;
  });
}

export function getMaxImagePx(plan: string): number {
  if (plan === "business") return 1600;
  if (plan === "pro") return 1200;
  return 800;
}