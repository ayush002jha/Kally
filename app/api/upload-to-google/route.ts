export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GOOGLE_AI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Google AI API key is not configured" },
        { status: 500 }
      );
    }

    // Initialize the Google Generative AI client
    const genAI = new GoogleGenerativeAI(apiKey);
    
    const formData = await req.formData();
    const imageFile = formData.get("image") as File;

    if (!imageFile) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // Convert the image to base64
    const imageArrayBuffer = await imageFile.arrayBuffer();
    const base64Image = Buffer.from(imageArrayBuffer).toString('base64');

    // Create the prompt for food identification and nutrition analysis
    const prompt = `
    Given the provided image, identify the dish/food name and extract the following nutritional properties: calories, protein, carbohydrates, and fat. Return your response as a raw JSON object WITHOUT any markdown formatting, code block indicators, explanations, or additional text. The JSON should use the following keys exactly: 'name', 'calories', 'protein', 'carbs', and 'fat'. Example of the expected format:
    {
      "name": "Dish Name",
      "calories": 000,
      "protein": 00,
      "carbs": 00,
      "fat": 00
    }`;

    // Get the Gemini 2 Flash model
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      // systemInstruction helps ensure we get JSON output
      systemInstruction: "Always respond with structured JSON data as requested by the user."
    });

    // Create content parts with the inline base64 image and prompt
    const result = await model.generateContent([
      {
        inlineData: {
          data: base64Image,
          mimeType: imageFile.type || "image/jpeg",
        },
      },
      prompt
    ]);

    const response = result.response;
    const textContent = response.text();
  
    // console.log("Response from Gemini:", response);

    // console.log("Response from Gemini:", textContent);
    return NextResponse.json(textContent);
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { error: "Failed to process request", details: String(error) },
      { status: 500 }
    );
  }
}