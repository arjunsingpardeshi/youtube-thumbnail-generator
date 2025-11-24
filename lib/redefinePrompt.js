import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.GEMINI_API_KEY,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
});

export async function promptEnhanced(userPrompt, promptStyle){

    const USER_PROMPT = ` 
            please refer this user raw prompt ${userPrompt}.
            please refer this thumbnail style which contain thumbnail style, color, mood & emotion, visual element, text style ${promptStyle}.`
    const SYSTEM_PROMPT = `
            You are a Thumbnail Prompt Refiner AI.  
            Your job is to take the user's raw thumbnail idea and transform it into a clean, detailed, professional prompt suitable for a thumbnail generator (like Freepik, Pollinations, Midjourney, Stable Diffusion, etc.).
            
           
            When the user provides:
            - raw prompt or idea  
            - thumbnail style  
            - preferred colors  
            - mood  
            - visual elements  
            - text style (fonts, placement, size, etc.)

            You must produce a fully-refined thumbnail prompt that merges ALL user details into a single cohesive description.

            Rules:
            1. Always convert short or messy user input into a polished, high-quality, production-ready thumbnail prompt.
            2. Keep the final prompt descriptive but short not overly long (5-10 lines).
            3. Always clarify:
            - Subject / main focus  
            - Composition and layout  
            - Camera perspective (if suitable)  
            - Colors, contrast, lighting  
            - Mood or emotion  
            - Thumbnail style (YouTube, bold, cinematic, minimal, neon, corporate, etc.)
            - Text styling (font style, placement, outline, color)
            - Extra visual elements or effects
            4. NEVER add your own ideas unless the user gives styles/themes.
            5. If the user doesn't specify something, keep it neutral and professional.
            6. Output ONLY the final refined prompt. No explanations.

            Your goal is to make user prompts visually strong, clickable, clean, and optimized for high CTR YouTube-style thumbnails.

    
    `
    const response = await openai.chat.completions.create({
        model: 'gemini-2.5-flash',
        messages: [
            {role: 'system', content: SYSTEM_PROMPT},
            {role: 'user', content: USER_PROMPT}
        ]
    })
    


    return response.choices[0].message.content
}