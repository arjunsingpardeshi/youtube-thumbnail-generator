import { NextRequest, NextResponse } from 'next/server';
import axios from "axios";
import cloudinary from '@/lib/cloudinary';
import { promptEnhanced } from '@/lib/redefinePrompt.js';

//FREEPIK CONSTANTS 
const CREATE_URL = "https://api.freepik.com/v1/ai/gemini-2-5-flash-image-preview";
const STATUS_URL = "https://api.freepik.com/v1/ai/gemini-2-5-flash-image-preview/";

const HEADERS = {
  "x-freepik-api-key": process.env.FREEPIK_API_KEY,
  "Content-Type": "application/json",
};

// CREATE FREEPIK TASK
async function createTask(prompt, referenceImages) {
  const payload = {
    prompt,
    reference_images: referenceImages.map(img => img.url),
    size: { width: 1280, height: 720 },
  };

  const res = await axios.post(CREATE_URL, payload, { headers: HEADERS });
  return res.data?.data?.task_id ?? null;
}

// EXTRACT CDN URL
function extractImageUrl(data) {
  const gen = data?.generated;

  if (Array.isArray(gen)) {
    if (typeof gen[0] === "string") return gen[0];
    if (gen[0]?.url) return gen[0].url;
  }

  return null;
}


//POLL UNTIL IMAGE IS READY
async function pollTask(taskId, maxAttempts = 50, delayMs = 1500) {
  let attempt = 0;

  while (attempt < maxAttempts) {
    attempt++;

    try {
      const res = await axios.get(STATUS_URL + taskId, { headers: HEADERS });
      const data = res.data?.data;
      const status = data?.status?.toUpperCase();

      console.log(`Poll ${attempt} → ${status}`);

      if (["COMPLETED", "SUCCESS", "SUCCESSFUL"].includes(status)) {
        return extractImageUrl(data);
      }

      if (["FAILED", "ERROR"].includes(status)) {
        console.error("Freepik Task Failed:", data);
        return null;
      }

    } catch (err) {
      if (err.response?.status === 404) return null;
      console.error("Polling error:", err.message);
    }

    await new Promise(r => setTimeout(r, delayMs));
  }

  return null;
}


// UPLOAD CDN URL TO CLOUDINARY
async function uploadToCloudinary(url, index = 0) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      url,
      {
        folder: "ytthumbs/generated_thumbnails",
        public_id: `generated_${Date.now()}_${index}`,
        transformation: [
          { width: 1280, height: 720, crop: 'fit' },
          { quality: 'auto:good' }
        ]
      },
      (error, result) => {
        if (error) reject(error);
        else resolve({
          url: result.secure_url,
          public_id: result.public_id,
          variant: `Style ${index + 1}`,
        });
      }
    );
  });
}


//MAIN API ROUTE (POST)
export async function POST(request) {
  try {
    const formData = await request.formData();
    const prompt = formData.get("prompt");
    const promptStyle = formData.get("promptStyle")
    const imageUrls = formData.getAll("imageUrls");

    // FIX: validate prompt
    if (!prompt || prompt.trim() === "") {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }
    
    const newPrompt = await promptEnhanced(prompt, promptStyle)
    console.log("prompt in backend api = ", prompt)
    console.log("prompt style in backend api = ", promptStyle)
    console.log("new prompt in backend api = ", newPrompt)
    //return NextResponse.json({ promt: newPrompt,prompt, promptStyle }, { status: 200 })
    const referenceImages = imageUrls.map((url, i) => ({
      url,
      public_id: `frontend_uploaded_${Date.now()}_${i}`
    }));

   // Create Freepik AI Task
    const taskId = await createTask(newPrompt, referenceImages);
    if (!taskId) {
      return NextResponse.json({ error: "Freepik task creation failed" }, { status: 500 });
    }

    // Poll Until Freepik Finishes
    const cdnUrl = await pollTask(taskId);
    if (!cdnUrl) {
      return NextResponse.json({ error: "Freepik generation failed" }, { status: 500 });
    }

    console.log("Generated Freepik CDN URL:", cdnUrl);

    // Upload generated CDN URL to Cloudinary
    const uploaded = await uploadToCloudinary(cdnUrl, 0);

    return NextResponse.json({
      success: true,
      thumbnail: uploaded,
      freepik_url: cdnUrl,
      message: "Thumbnail generated successfully!",
      generationId: Date.now().toString(),
    });

  } catch (error) {
    console.error("Generate Thumbnail Error:", error);
    return NextResponse.json(
      { error: "Thumbnail generation failed", details: error.message },
      { status: 500 }
    );
  }
}