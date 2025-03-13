export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import fs from "fs/promises";
import os from "os";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    // const authToken = process.env.AUTH_TOKEN;
    // const xApiKey = process.env.X_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "API keys are not configured" },
        { status: 500 }
      );
    }

    const fileManager = new GoogleAIFileManager(apiKey);
    const formData = await req.formData();
    const imageFile = formData.get("image") as File;

    if (!imageFile) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "upload-"));
    const tempFilePath = path.join(tempDir, `image-${Date.now()}.jpg`);
    const bytes = await imageFile.arrayBuffer();
    await fs.writeFile(tempFilePath, new Uint8Array(bytes));

    const uploadResult = await fileManager.uploadFile(tempFilePath, {
      mimeType: imageFile.type || "image/jpeg",
      displayName: `food-image-${Date.now()}`,
    });

    await fs
      .unlink(tempFilePath)
      .catch((err) => console.error("Failed to delete temp file:", err));
    await fs
      .rmdir(tempDir)
      .catch((err) => console.error("Failed to delete temp dir:", err));

    console.log(
      `Uploaded file ${uploadResult.file.displayName} as: ${uploadResult.file.uri}`
    );

    const prompt = `
    Given the provided image, identify the dish/food name and extract the following nutritional properties: calories, protein, carbohydrates, and fat. Return your response as a raw JSON object WITHOUT any markdown formatting, code block indicators, explanations, or additional text. The JSON should use the following keys exactly: 'name', 'calories', 'protein', 'carbs', and 'fat'. Example of the expected format:
    {
    "name": "Dish Name",
    "calories": 000,
    "protein": 00,
    "carbs": 00,
    "fat": 00
    }
`;

    // Call the external API with the uploaded file URI
    const response = await fetch(
      "http://127.0.0.1:7860/api/v1/run/88f676c8-7484-438a-807a-e9aa15ca0b2c?stream=false",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input_value: prompt,
          output_type: "chat",
          input_type: "chat",
          tweaks: {
            "ChatOutput-gvJDG": {},
            "ChatInput-5S2Am": {},
            "CustomComponent-KVGjb": {},
            "ParseData-1oHix": {},
            "TextInput-MOtin": { input_value: uploadResult.file.uri },
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(
        `External API request failed with status ${response.status}`
      );
    }

  
    const responseData = await response.json();
    console.log("Response from external API:", responseData.outputs[0].outputs[0].results.message.data.text
    );
    return NextResponse.json(responseData);
  
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { error: "Failed to process request", details: String(error) },
      { status: 500 }
    );
  }
}
