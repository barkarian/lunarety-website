import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { WebsiteService } from "@/lib/api/generated/services/WebsiteService";
import "@/lib/api/config";

const WEBSITE_API_KEY = process.env.WEBSITE_API_KEY!;

interface PropertyContext {
  name: string;
  description?: string;
  shortDescription?: string;
  address?: string;
  city?: string;
  country?: string;
  amenities?: string[];
  rooms?: Array<{
    name: string;
    description?: string;
    maxGuests?: number;
    bedType?: string;
  }>;
}

export async function POST(req: Request) {
  try {
    // Extract messages and propertyContext from request body
    const { messages, propertyContext }: { messages: UIMessage[]; propertyContext: PropertyContext } = 
      await req.json();

    // Fetch website config to get OpenRouter API key
    const { website } = await WebsiteService.validateWebsite(WEBSITE_API_KEY);

    // Check if AI is supported
    if (!website.ai?.supportsAi) {
      return new Response("AI features are not enabled for this website", {
        status: 403,
      });
    }

    // Get OpenRouter API key from website config
    const openrouterApiKey = website.ai.websiteOpenrouterApiKey;

    if (!openrouterApiKey) {
      return new Response("OpenRouter API key not configured", {
        status: 500,
      });
    }

    // Create OpenRouter instance
    const openrouter = createOpenRouter({
      apiKey: openrouterApiKey,
    });

    // Build system prompt with property context
    const systemPrompt = buildSystemPrompt(propertyContext);

    // Stream text response following AI SDK best practices
    const result = streamText({
      model: openrouter.chat("google/gemini-2.5-flash-lite"),
      system: systemPrompt,
      // Convert UIMessage[] to ModelMessage[] as per docs
      messages: convertToModelMessages(messages),
    });

    // Return UIMessageStream response for proper streaming with useChat hook
    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(
      error instanceof Error ? error.message : "An error occurred",
      { status: 500 }
    );
  }
}

function buildSystemPrompt(property: PropertyContext): string {
  if (!property) {
    return "You are a helpful assistant for a vacation property. Answer questions helpfully.";
  }

  const roomsInfo = property.rooms
    ?.map(
      (room) =>
        `- ${room.name}: ${room.description || "No description"} (Max guests: ${room.maxGuests || "N/A"}, Bed: ${room.bedType || "N/A"})`
    )
    .join("\n");

  const amenitiesInfo = property.amenities?.join(", ") || "Not specified";
  const location = [property.address, property.city, property.country]
    .filter(Boolean)
    .join(", ");

  return `You are a helpful and friendly assistant for the property "${property.name}". 
Your role is to answer questions about this property and help potential guests learn more about their stay.

## Property Information:
- **Name**: ${property.name}
- **Location**: ${location || "Not specified"}
- **Description**: ${property.shortDescription || property.description || "No description available"}

## Amenities:
${amenitiesInfo}

## Available Rooms:
${roomsInfo || "Room information not available"}

## Guidelines:
1. Be helpful, friendly, and professional
2. Only provide information about this specific property
3. If asked about something you don't have information about, politely say so and suggest contacting the property directly
4. Keep responses concise but informative
5. If asked about booking, encourage the user to use the booking form on the page
6. Do not make up information - stick to what you know about the property
7. Respond in the same language the user writes in`;
}
