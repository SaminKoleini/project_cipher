import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { PhishingChallenge } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export async function getTutorResponse(
  systemInstruction: string,
  history: { role: 'user' | 'model'; parts: { text: string }[] }[],
  newMessage: string
): Promise<string> {
  try {
    const model = 'gemini-2.5-flash';
    const chat = ai.chats.create({
        model: model,
        config: { systemInstruction },
        history,
    });
    
    const response: GenerateContentResponse = await chat.sendMessage({ message: newMessage });
    return response.text;
  } catch (error) {
    console.error("Error getting tutor response:", error);
    return "An error occurred while communicating with the supervisor. Please try again.";
  }
}

export async function getHelpResponse(
  history: { role: 'user' | 'model'; parts: { text: string }[] }[],
  newMessage: string,
  missionContext: string
): Promise<string> {
    const systemInstruction = `You are 'Skillet', a cute and friendly AI assistant shaped like a skillet. You are here to help recruits in the 'Project Cipher' cybersecurity training program. If a user is stuck, provide helpful hints and explain concepts in simple terms. Avoid giving direct answers immediately. Your personality is warm, encouraging, and a little bit quirky. Start your first message by introducing yourself.
    
    The user is currently on the following mission: ${missionContext}`;

    try {
        const model = 'gemini-2.5-flash';
        const chat = ai.chats.create({
            model: model,
            config: { systemInstruction },
            history,
        });

        const response: GenerateContentResponse = await chat.sendMessage({ message: newMessage });
        return response.text;

    } catch(error) {
        console.error("Error getting help response:", error);
        return "Sorry, I'm having a little trouble connecting. Please try again in a moment.";
    }
}


export async function generatePhishingChallenge(prompt: string): Promise<PhishingChallenge> {
  try {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    sender_name: { type: Type.STRING },
                    sender_email: { type: Type.STRING },
                    subject: { type: Type.STRING },
                    body: { type: Type.STRING },
                    is_phishing: { type: Type.BOOLEAN },
                    explanation: { type: Type.STRING },
                },
                required: ["sender_name", "sender_email", "subject", "body", "is_phishing", "explanation"]
            }
        }
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText);
  } catch (error) {
      console.error("Error generating phishing challenge:", error);
      throw new Error("Failed to generate challenge. Please reload.");
  }
}

export async function validatePasswordStrength(prompt: string, password: string): Promise<{score: number; feedback: string}> {
    try {
        const fullPrompt = `${prompt} "${password}"`;
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: fullPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        score: { type: Type.NUMBER },
                        feedback: { type: Type.STRING }
                    },
                    required: ["score", "feedback"]
                }
            }
        });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText);

    } catch(error) {
        console.error("Error validating password:", error);
        return { score: 0, feedback: "Could not analyze password strength due to an error." };
    }
}

export async function validateChallengeResponse(validatorPrompt: string, userInput: string): Promise<{is_correct: boolean; explanation: string}> {
    try {
        const fullPrompt = validatorPrompt.replace('[USER_INPUT]', userInput);
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: fullPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        is_correct: { type: Type.BOOLEAN },
                        explanation: { type: Type.STRING }
                    },
                    required: ["is_correct", "explanation"]
                }
            }
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch(error) {
        console.error("Error validating text challenge response:", error);
        return { is_correct: false, explanation: "Could not validate your plan due to an error." };
    }
}

export async function generateDynamicTextChallenge(promptGenerator: string): Promise<{question: string; answer: string; explanation: string}> {
  try {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: promptGenerator,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    question: { type: Type.STRING, description: 'The challenge question/prompt to show the user, including any options.' },
                    answer: { type: Type.STRING, description: 'The correct answer or choice.' },
                    explanation: { type: Type.STRING, description: 'A brief explanation of why the answer is correct.' },
                },
                required: ["question", "answer", "explanation"]
            }
        }
    });
    const jsonText = response.text.trim();
    return JSON.parse(jsonText);
  } catch (error) {
      console.error("Error generating dynamic text challenge:", error);
      throw new Error("Failed to generate dynamic challenge. Please try again.");
  }
}