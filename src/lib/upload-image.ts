"use client";

type UploadOptions = {
  restaurantName?: string;
  subdomain?: string;
};

const UPLOAD_ENDPOINT =
  process.env.NEXT_PUBLIC_IMAGE_UPLOAD_URL ?? "http://localhost:3002/api/upload";
const UPLOAD_KEY = process.env.NEXT_PUBLIC_IMAGE_UPLOAD_KEY;

export async function uploadImageFile(file: File, options: UploadOptions = {}): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  if (options.restaurantName) formData.append("restaurantName", options.restaurantName);
  if (options.subdomain) formData.append("subdomain", options.subdomain);

  const response = await fetch(UPLOAD_ENDPOINT, {
    method: "POST",
    body: formData,
    headers: UPLOAD_KEY ? { "x-upload-key": UPLOAD_KEY } : undefined,
  });

  if (!response.ok) {
    let message = "تعذر رفع الصورة";
    try {
      const error = await response.json();
      if (error?.error) message = String(error.error);
      if (error?.message) message = String(error.message);
    } catch {}
    throw new Error(message);
  }

  const data = (await response.json().catch(() => ({}))) as {
    publicUrl?: string;
    s3Url?: string;
    url?: string;
    objectName?: string;
  };

  const fallback =
    data.objectName
      ? `https://images.meelza.com/images/${String(data.objectName)
          .replace(/^\/+/, "")
          .replace(/^restaurants\//, "")}`
      : "";
  const url = data.publicUrl || data.s3Url || data.url || fallback;
  if (!url) {
    throw new Error("لم يتم إرجاع رابط الصورة");
  }
  return url;
}
