import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import { Data } from "../utils/database";
import PERSONALITY_PROMPT from "../constants/PERSONALITY_PROMPT";
import { encoding_for_model } from "tiktoken";
import * as fs from "fs";
import path from "path";
import getHomeDir from "../utils/getHomeDir";
import beautifulLogger from "../utils/beautifulLogger";

export type Message = {
  content: string;
  name: string | undefined;
  ia: boolean;
  jid: string;
}[];

export type ResponseAction = {
  message?: {
    reply?: string;
    text: string;
  };
  sticker?: string;
  audio?: string;
  meme?: string;
  poll?: {
    question: string;
    options: [string, string, string];
  };
  location?: {
    latitude: number;
    longitude: number;
  };
  contact?: {
    name?: string;
    cell: string;
  };
};

type ApiResponseAction = {
  type:
    | "message"
    | "sticker"
    | "audio"
    | "poll"
    | "location"
    | "meme"
    | "contact";
  message?: {
    reply?: string;
    text: string;
  };
  sticker?: string;
  audio?: string;
  meme?: string;
  poll?: {
    question: string;
    options: [string, string, string];
  };
  contact?: {
    name?: string;
    cell: string;
  };
  location?: {
    latitude: number;
    longitude: number;
  };
};

export type BotResponse = ResponseAction[];

export type GenerateResponseResult = {
  actions: BotResponse;
  cost: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    cost: number;
  };
};

const GPT4_1_PRICING = {
  input: 0.0004,
  output: 0.0016,
};

function calculateTokens(text: string): number {
  try {
    const encoder = encoding_for_model("gpt-4.1-mini");
    const tokens = encoder.encode(text);
    encoder.free();
    return tokens.length;
  } catch (error) {
    return Math.ceil(text.length / 4);
  }
}

const stickersDir = path.join(getHomeDir(), "stickers");
if (!fs.existsSync(stickersDir))
  throw new Error("Diretório de stickers não encontrado: " + stickersDir);
const stickerOptions: string[] = fs
  .readdirSync(stickersDir)
  .filter((file) => file.endsWith(".webp"));
if (stickerOptions.length === 0) stickerOptions.push("fallback.webp");

const audiosDir = path.join(getHomeDir(), "audios");
if (!fs.existsSync(audiosDir))
  throw new Error("Diretório de áudios não encontrado: " + audiosDir);
const audioOptions: string[] = fs
  .readdirSync(audiosDir)
  .filter((file) => file.endsWith(".mp3"));
if (audioOptions.length === 0) audioOptions.push("fallback.mp3");

const memesDir = path.join(getHomeDir(), "memes");
if (!fs.existsSync(memesDir))
  throw new Error("Diretório de memes não encontrado: " + memesDir);
const memeOptions: string[] = fs
  .readdirSync(memesDir)
  .filter((file) => file.endsWith(".jpg"));
if (memeOptions.length === 0) memeOptions.push("fallback.jpg");

export default async function generateResponse(
  data: Data,
  messages: Message,
): Promise<GenerateResponseResult> {
  beautifulLogger.aiGeneration("start", "Iniciando geração de resposta...");

  const uniqueMessages = messages.filter((message, index, array) => {
    return !array.some(
      (otherMessage, otherIndex) =>
        otherIndex > index &&
        otherMessage.content === message.content &&
        otherMessage.name === message.name,
    );
  });

  const messagesMaped: string = uniqueMessages
    .map((message, i) => `${i + 1} - ${message.content}`)
    .join("\n");

  beautifulLogger.aiGeneration("processing", {
    "mensagens processadas": uniqueMessages.length,
    "mensagens originais": messages.length,
    "duplicatas removidas": messages.length - uniqueMessages.length,
    "mensagem mais recente":
      uniqueMessages[uniqueMessages.length - 1]?.content || "nenhuma",
  });

  const formatDataForPrompt = (data: Data): string => {
    let formattedData = "Resumo da conversa e opiniões dos usuários:\n\n";

    if (data.summary) {
      formattedData += `📋 RESUMO DA CONVERSA:\n${data.summary}\n\n`;
    }

    if (data.opinions && data.opinions.length > 0) {
      formattedData += `👥 OPINÕES SOBRE OS USUÁRIOS:\n`;
      data.opinions.forEach((opinion) => {
        formattedData += `• ${opinion.name} (${opinion.jid}):\n`;

        let opnion = "NEUTRO/MISTO";
        if (opinion.opinion < 20) opnion = "ODEIO ELE";
        else if (opinion.opinion < 40) opnion = "NÃO GOSTO";
        else if (opinion.opinion < 60) opnion = "NEUTRO/MISTO";
        else if (opinion.opinion < 80) opnion = "GOSTO BASTANTE";
        else if (opinion.opinion <= 100) opnion = "APAIXONADA";

        formattedData += `  - Nível de opinião: ${opinion.opinion}/100 (${opnion})\n`;
        if (opinion.traits && opinion.traits.length > 0) {
          formattedData += `  - O que acho dele (Características): ${opinion.traits.join(", ")}\n`;
        }
        formattedData += "\n";
      });
    }

    return formattedData.trim();
  };

  const contextData = formatDataForPrompt(data);

  const inputMessages = [
    { role: "system" as const, content: PERSONALITY_PROMPT },
    { role: "assistant" as const, content: contextData },
    {
      role: "user" as const,
      content: `Conversa: \n\n${messagesMaped}`,
    },
  ];

  const inputText = inputMessages.map((msg) => msg.content).join("\n");
  const inputTokens = calculateTokens(inputText);

  beautifulLogger.aiGeneration("tokens", {
    "tokens de entrada": inputTokens,
    "tamanho da mensagem": inputText.length,
  });

  const responseSchema = z.object({
    actions: z
      .array(
        z.object({
          type: z.enum([
            "message",
            "sticker",
            "audio",
            "poll",
            "location",
            "meme",
            "contact",
          ]),
          message: z
            .object({
              reply: z.string().optional(),
              text: z.string(),
            })
            .optional(),
          sticker: z.enum(stickerOptions as [string, ...string[]]).optional(),
          audio: z.enum(audioOptions as [string, ...string[]]).optional(),
          meme: z.enum(memeOptions as [string, ...string[]]).optional(),
          poll: z
            .object({
              question: z.string(),
              options: z.array(z.string()).length(3),
            })
            .optional(),
          location: z
            .object({
              latitude: z.number(),
              longitude: z.number(),
            })
            .optional(),
          contact: z
            .object({
              name: z.string().optional(),
              cell: z.string(),
            })
            .optional(),
        }),
      )
      .min(1),
  });

  beautifulLogger.aiGeneration(
    "processing",
    "Enviando requisição para OpenAI...",
  );

  const { object: response } = await generateObject({
    model: openai("gpt-5-nano"),
    messages: inputMessages,
    schema: responseSchema,
    temperature: 0.8,
  });

  if (!response) {
    beautifulLogger.aiGeneration(
      "error",
      "Nenhuma resposta foi gerada pela IA",
    );
    throw new Error("Nenhuma resposta foi gerada pela IA");
  }

  // Calcular tokens de saída (aproximação para o Vercel AI SDK)
  const responseText = JSON.stringify(response);
  const outputTokens = calculateTokens(responseText);
  const totalTokens = inputTokens + outputTokens;

  // Calcular custo
  const inputCostUSD = (inputTokens / 1000) * GPT4_1_PRICING.input;
  const outputCostUSD = (outputTokens / 1000) * GPT4_1_PRICING.output;
  const totalCostUSD = inputCostUSD + outputCostUSD;
  const cost = totalCostUSD;

  beautifulLogger.aiGeneration("cost", {
    "tokens entrada": inputTokens,
    "tokens saída": outputTokens,
    "tokens total": totalTokens,
    "custo (USD)": `$${cost.toFixed(6)}`,
  });

  try {
    if (!Array.isArray(response.actions)) {
      beautifulLogger.aiGeneration(
        "error",
        "Resposta não contém array de ações válidas",
      );
      return {
        actions: [],
        cost: {
          inputTokens,
          outputTokens,
          totalTokens,
          cost,
        },
      };
    }

    beautifulLogger.aiGeneration("response", {
      "quantidade de ações": response.actions.length,
      "tipos de ação": response.actions.map((a) => a.type).join(", "),
    });

    const convertedActions: BotResponse = response.actions.map((action) => {
      const result: ResponseAction = {};

      if (action.type === "message" && action.message) {
        result.message = action.message;
      } else if (action.type === "sticker" && action.sticker) {
        result.sticker = action.sticker;
      } else if (action.type === "audio" && action.audio) {
        result.audio = action.audio;
      } else if (action.type === "poll" && action.poll) {
        result.poll = {
          question: action.poll.question,
          options: action.poll.options as [string, string, string],
        };
      } else if (action.type === "location" && action.location) {
        result.location = action.location;
      } else if (action.type === "meme" && action.meme) {
        result.meme = action.meme;
      } else if (action.type === "contact" && action.contact) {
        result.contact = action.contact;
      }

      return result;
    });

    beautifulLogger.aiGeneration("complete", {
      "ações processadas": convertedActions.length,
      "pronto para enviar": "sim",
    });

    return {
      actions: convertedActions,
      cost: {
        inputTokens,
        outputTokens,
        totalTokens,
        cost,
      },
    };
  } catch (error) {
    beautifulLogger.aiGeneration("error", {
      erro: "Falha ao processar resposta",
      "resposta recebida": JSON.stringify(response).substring(0, 100) + "...",
    });
    console.error("Erro ao processar resposta:", error);
    console.error("Resposta recebida:", response);
    throw new Error("Resposta da IA não está no formato válido");
  }
}
