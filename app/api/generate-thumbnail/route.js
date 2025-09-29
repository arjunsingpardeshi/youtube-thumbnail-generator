import { NextRequest, NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';
import { ThumbnailGenerator } from '@/lib/thumbnail-generator';

async function generateThumbnailWithAI(prompt, referenceImages = []) {
  if(referenceImages.length===0){
      const response = ThumbnailGenerator.generateFromPrompt(prompt)
      console.log("response for promt = ", response)
  }else{
      const response = ThumbnailGenerator.generateFromImageAndPrompt(prompt, referenceImages)
      console.log("response for image and prompt = ", response)
  }

  const mockThumbnails = [
    'https://fastly.picsum.photos/id/12/2500/1667.jpg?hmac=Pe3284luVre9ZqNzv1jMFpLihFI6lwq7TPgMSsNXw2w',
    'https://fastly.picsum.photos/id/8/5000/3333.jpg?hmac=OeG5ufhPYQBd6Rx1TAldAuF92lhCzAhKQKttGfawWuA'
  ];
  
  // Upload mock thumbnails to Cloudinary (in real scenario, you'd upload AI-generated images)
  const uploadPromises = mockThumbnails.map(async (url, index) => {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        url,
        {
          folder: 'ytthumbs/generated_thumbnails',
          public_id: `generated_${Date.now()}_${index}`,
          transformation: [
            { width: 1280, height: 720, crop: 'fill' },
            { quality: 'auto:good' }
          ]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
    });
  });
  
  const results = await Promise.all(uploadPromises);
  return results.map(result => ({
    url: result.secure_url,
    public_id: result.public_id,
    variant: `Style ${results.indexOf(result) + 1}`
  }));
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const prompt = formData.get('prompt');
    const imageFiles = formData.getAll('images');
    let uploadedImages = [];
    
    // Upload user reference images first
    if (imageFiles && imageFiles.length > 0) {
      const uploadPromises = imageFiles.map(async (file) => {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        return new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              resource_type: 'image',
              folder: 'ytthumbs/user_uploads',
              transformation: [
                { width: 1280, height: 780, crop: 'limit' },
                { quality: 'auto:good' }
              ]
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          ).end(buffer);
        });
      });
      
      const uploadResults = await Promise.all(uploadPromises);
      uploadedImages = uploadResults.map(result => ({
        url: result.secure_url,
        public_id: result.public_id,
        width: result.width,
        height: result.height
      }));
    }
    
    // Generate thumbnails using AI
    const generatedThumbnails = await generateThumbnailWithAI(prompt, uploadedImages);
    
    return NextResponse.json({
      success: true,
      message: `Generated ${generatedThumbnails.length} thumbnails based on your prompt${uploadedImages.length > 0 ? ' and reference images' : ''}!`,
      uploadedImages,
      thumbnails: generatedThumbnails,
      generationId: Date.now().toString()
    });
    
  } catch (error) {
    console.error('Generation error:', error);
    return NextResponse.json(
      { error: 'Thumbnail generation failed', details: error.message }, 
      { status: 500 }
    );
  }
}