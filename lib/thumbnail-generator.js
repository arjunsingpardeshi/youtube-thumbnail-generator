import openai from './openai-client.js';

export class ThumbnailGenerator {
  static enhancePrompt(userPrompt) {
    const stylePrompts = {
      professional: "clean, professional, high-quality",
      gaming: "vibrant, energetic, gaming aesthetic with neon effects",
      tutorial: "educational, clear, instructional with arrows and text elements",
      reaction: "emotional, expressive, reaction-style with surprised expressions",
      minimalist: "clean, simple, minimalist design with bold typography"
    };

    return ` 
    Requirements: eye-catching, high contrast, readable text, optimized for small screens, 
    professional YouTube thumbnail quality, vibrant colors, clear focal point.`;
  }

  // Generate using prompt + multiple reference images (primary method)
  static async generateWithVision(prompt, referenceImages = [], options = {}) {
    try {
      const { style = "professional", count = 2 } = options;
      const enhancedPrompt = this.enhancePrompt(prompt, style);

      const completion = await openai.chat.completions.create({
        model: "google/gemini-2.5-flash-image-preview:free",
        messages: [
          {
            role: "system",
            content: `You are a YouTube Thumbnail Generator Agent.  
                Your task is to generate high-quality YouTube thumbnails based on:  
                1. User-provided image(s) as reference material.  
                2. A user-provided prompt (describing style, theme, text, or mood).  

                Guidelines:
                - Always create thumbnails in 1280 x 720 pixels with a 16:9 aspect ratio.  
                - Output in PNG format (optimized for YouTube).  
                - Enhance the given image(s) to make them eye-catching and high-contrast.  
                - Use bold, large, and readable text if the user specifies text.  
                - Follow the YouTube style: high contrast, vibrant colors, clear focal point.  
                - Ensure text does not cover important subject areas (like faces).  
                - If multiple images are provided, combine them in a compelling layout.  
                - Apply the requested stylistic themes and mood.  
                - Generate ${count} different variations if possible.

                Output:
                - Always return newly generated image(s) as YouTube thumbnail(s).  
                - Dimensions: 1280 x 720  
                - File format: PNG`
          },
          {
            role: "user",
            content: [
              { type: "text", text: enhancedPrompt },
              ...referenceImages.map(img => ({
                type: "image_url",
                image_url: { url: `data:image/jpeg;base64,${img.base64}` }
              }))
            ]
          }
        ],
      });

      const message = completion.choices[0].message;

      // Extract generated images
      const images = (message.content || []).filter(c => c.type === "image_url");

      return {
        description: message.content.find(c => c.type === "text")?.text || "Generated thumbnails based on your images and prompt",
        thumbnails: images.map((img, i) => ({
          url: img.image_url.url,
          variant: `Option ${i + 1}`,
          description: `Generated thumbnail variant ${i + 1} for: ${prompt}`
        }))
      };

    } catch (error) {
      console.error('Vision generation error:', error);
      throw new Error(`Failed to generate thumbnail with vision: ${error.message}`);
    }
  }

  // Generate using single image + prompt (fallback method)
  static async generateFromImageAndPrompt(image, prompt,) {
    try {
      const enhancedPrompt = this.enhancePrompt(prompt);

      const completion = await openai.chat.completions.create({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "system",
            content: `You are a YouTube Thumbnail Generator Agent.  
            Create a high-quality YouTube thumbnail (1280x720, PNG format) based on the provided image and user prompt.
            Make it eye-catching with high contrast, vibrant colors, and clear focal points.`
          },
          {
            role: "user",
            content: [
              { type: "text", text: enhancedPrompt },
              { type: "image_url", image_url: { url: image } }
            ]
          }
        ],
      });

      const message = completion.choices[0].message;
      const images = (message.content || []).filter(c => c.type === "image_url");

      return {
        thumbnail: images[0]?.image_url.url || null,
        prompt,
        style,
        success: !!images.length,
        description: message.content.find(c => c.type === "text")?.text || "Generated thumbnail"
      };

    } catch (error) {
      console.error('Single image generation error:', error);
      throw new Error(`Failed to generate thumbnail: ${error.message}`);
    }
  }

  // Generate thumbnails from text prompt only (no reference images)
  static async generateFromPrompt(prompt, options = {}) {
    try {
      const { style = "professional", count = 2 } = options;
      const enhancedPrompt = this.enhancePrompt(prompt, style);

      const completion = await openai.chat.completions.create({
        model: "google/gemini-2.5-flash-image-preview:free",
        messages: [
          {
            role: "system",
            content: `You are a YouTube Thumbnail Generator Agent.  
            Create high-quality YouTube thumbnails (1280x720, PNG format) based solely on text prompts.
            Generate ${count} different variations with eye-catching designs, high contrast, and vibrant colors.`
          },
          {
            role: "user",
            content: enhancedPrompt
          }
        ],
      });

      const message = completion.choices[0].message;
      const images = (message.content || []).filter(c => c.type === "image_url");

      return images.map((img, i) => ({
        url: img.image_url.url,
        variant: `Option ${i + 1}`,
        description: `Generated thumbnail variant ${i + 1} for: ${prompt}`
      }));

    } catch (error) {
      console.error('Text-only generation error:', error);
      throw new Error(`Failed to generate thumbnail from prompt: ${error.message}`);
    }
  }
}