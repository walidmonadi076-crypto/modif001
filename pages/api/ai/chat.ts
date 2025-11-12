
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';
import type { NextRequest } from 'next/server';
import type { ChatMessage } from '../../../types';

// The API key is sourced from environment variables for security.
const apiKey = process.env.API_KEY;
if (!apiKey) {
    // This error is thrown on server start-up if the key is missing.
    throw new Error('API_KEY environment variable not set');
}

const ai = new GoogleGenAI({ apiKey });

// This function is not exported as part of the default handler, so it won't be a separate API route.
// It's a helper to create a ReadableStream for the response.
// FIX: Rewrote to use `for await...of` which is the standard way to handle async iterables and fixes the `.next()` error.
function iteratorToStream(iterator: AsyncIterable<GenerateContentResponse>) {
    const encoder = new TextEncoder();
    return new ReadableStream({
        async start(controller) {
            for await (const chunk of iterator) {
                const text = chunk.text;
                if (typeof text === 'string') {
                    controller.enqueue(encoder.encode(text));
                }
            }
            controller.close();
        },
    });
}

// FIX: Updated handler for Edge runtime. It now uses NextRequest and returns a Response.
export default async function handler(req: NextRequest) {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
            status: 405,
            headers: { 'Allow': 'POST', 'Content-Type': 'application/json' },
        });
    }

    try {
        const { history, message } = await req.json() as { history: ChatMessage[]; message: string };

        if (!message) {
             return new Response(JSON.stringify({ error: 'Message is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const chat = ai.chats.create({
            model: 'gemini-2.5-flash',
            history: history?.map(msg => ({
                role: msg.role,
                parts: [{ text: msg.content }],
            })) ?? [],
            config: {
                systemInstruction: "You are a friendly and knowledgeable gaming assistant for G2gaming, a website that offers free downloadable games, gaming guides, and gear. Your goal is to help users with their gaming-related questions. Be concise, helpful, and engaging. You can answer questions about specific games, suggest games based on user preferences, provide gameplay tips, or discuss gaming hardware. Do not answer questions outside the scope of gaming. Format your responses using simple markdown (bold, italics, lists, and code blocks)."
            }
        });

        const streamResult = await chat.sendMessageStream({ message });
        
        // Using WHATWG Streams, compatible with Vercel Edge Functions
        const stream = iteratorToStream(streamResult);
        
        // Pipe the stream to the response
        return new Response(stream, {
            status: 200,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });

    } catch (error) {
        console.error('Error in AI chat API:', error);
        return new Response(JSON.stringify({ error: 'An error occurred while processing your request.' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

// Required for Vercel Edge Functions
export const config = {
    runtime: 'edge',
};
