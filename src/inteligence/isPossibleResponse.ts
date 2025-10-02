import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import POSSIBLE_RESPONSE_PROMPT from "../constants/POSSIBLE_RESPONSE_PROMPT";
import { Data } from "../utils/database";
import { Message } from "./generateResponse";

export default async function isPossibleResponse(
  data: Data,
  messages: Message,
) {
  const messagesMaped: string = messages
    .slice(-30)
    .map((message) => message.content)
    .join("\n");

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

  const responseSchema = z.object({
    possible: z.boolean(),
    reason: z.string(),
  });

  const { object: response } = await generateObject({
    model: openai("gpt-5-nano"),
    messages: [
      { role: "system", content: POSSIBLE_RESPONSE_PROMPT },
      {
        role: "assistant",
        content: `Opiniões já formadas dos usuários: ${contextData}`,
      },
      {
        role: "user",
        content: `Conversa: \n\n${messagesMaped}`,
      },
    ],
    schema: responseSchema,
  });

  if (!response) {
    throw new Error("Nenhuma resposta foi gerada pela IA");
  }

  try {
    console.log("Resposta recebida:", response);

    if (!("possible" in response)) {
      throw new Error("Resposta não contém possible");
    }

    return response as { possible: boolean; reason: string };
  } catch (error) {
    console.error("Erro ao processar resposta:", error);
    console.error("Resposta recebida:", response);
    throw new Error("Resposta da IA não está no formato válido");
  }
}
