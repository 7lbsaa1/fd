const MAX_SOURCE_BYTES = 12 * 1024 * 1024;
const MAX_OUTPUT_BYTES = 900 * 1024;
const MAX_DIMENSION = 1920;

export function compressImage(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith("image/")) {
      reject(new Error("اختر ملف صورة صالحًا."));
      return;
    }

    if (file.type === "image/svg+xml") {
      reject(new Error("رفع صور SVG غير مسموح."));
      return;
    }

    if (file.size > MAX_SOURCE_BYTES) {
      reject(new Error("حجم الصورة الأصلية أكبر من 12MB."));
      return;
    }

    const reader = new FileReader();

    reader.onerror = () => reject(new Error("تعذرت قراءة الصورة."));
    reader.onload = () => {
      const image = new Image();

      image.onerror = () => reject(new Error("ملف الصورة غير صالح."));
      image.onload = () => {
        const ratio = Math.min(
          1,
          MAX_DIMENSION / image.width,
          MAX_DIMENSION / image.height
        );

        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * ratio);
        canvas.height = Math.round(image.height * ratio);

        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0, canvas.width, canvas.height);

        let quality = 0.82;
        let result = canvas.toDataURL("image/jpeg", quality);

        while (result.length * 0.75 > MAX_OUTPUT_BYTES && quality > 0.5) {
          quality -= 0.06;
          result = canvas.toDataURL("image/jpeg", quality);
        }

        if (result.length * 0.75 > MAX_OUTPUT_BYTES) {
          reject(new Error("الصورة كبيرة جدًا حتى بعد الضغط."));
          return;
        }

        resolve(result);
      };

      image.src = reader.result;
    };

    reader.readAsDataURL(file);
  });
}
