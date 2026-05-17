// app/services/predictionService.ts
const BASE_URL = "http://10.228.145.22:5000"; // Use your PC IP here

export async function predictFromUri(uri: string) {
  try {
    const formData = new FormData();
    formData.append("image", {
      uri,
      name: "drawing.jpg",
      type: "image/jpeg",
    } as any);

    const response = await fetch(`${BASE_URL}/predict`, {
      method: "POST",
      body: formData,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    if (!response.ok) {
      throw new Error("Prediction request failed");
    }

    const data = await response.json();

    // Only top 1 prediction
    const top1 = {
      label: data.prediction,   // Already mapped Tamil letter
      prob: data.confidence,    // Confidence value
    };

    return { top1 };
  } catch (error: any) {
    console.error("Prediction error:", error);
    throw new Error(error?.message ?? "Unknown error during prediction");
  }
}