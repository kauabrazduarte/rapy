import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import { Data } from "../utils/database";
import SUMMARY_PROMPT from "../constants/SUMMARY_PROMPT";

export type Message = {
  content: string;
  name: string | undefined;
  ia: boolean;
  jid: string;
}[];

export type ResponseAction = {
  summary: string;
  opinions: {
    name: string;
    opinion: number;
    jid: string;
    traits: string[];
  }[];
};

export default async function generateSummary(
  data: Data,
  messages: Message
): Promise<ResponseAction> {
  const messagesMaped: string = messages.map((message) => message.content).join("\n");

  const responseSchema = z.object({
    summary: z.string(),
    opinions: z.array(
      z.object({
        name: z.string(),
        opinion: z.number().min(0).max(100),
        jid: z.string(),
        traits: z.array(z.string()),
      })
    ),
  });

  const formatDataForPrompt = (data: Data): string => {
    let formattedData = "Resumo da conversa e opiniões dos usuários:\n\n";

    if (data.summary) {
      formattedData += `📋 RESUMO DA CONVERSA:\n${data.summary}\n\n`;
    }

    if (data.opinions && data.opinions.length > 0) {
      formattedData += `👥 OPINIÕES SOBRE OS USUÁRIOS:\n`;
      data.opinions.forEach((opinion) => {
        formattedData += `• ${opinion.name} (${opinion.jid}):\n`;

        let opnion = "NEUTRO/MISTO";
        if (opinion.opinion < 20) opnion = "ODEIO ELE";
        else if (opinion.opinion < 40) opnion = "NÃO GOSTO";
        else if (opinion.opinion < 60) opnion = "NEUTRO/MISTO";
        else if (opinion.opinion < 80) opnion = "GOSTO BASTANTE";
        else if (opinion.opinion <= 100) opnion = "APAIXONADA";

        formattedData += `  - Nível de opinião: ${opinion.opinion}/100 (${opnion})\n`;
        if (opinion.traits?.length > 0) {
          formattedData += `  - Características: ${opinion.traits.join(", ")}\n`;
        }
        formattedData += "\n";
      });
    }

    return formattedData.trim();
  };

  const contextData = formatDataForPrompt(data);

  const { object } = await generateObject({
    model: openai("gpt-4o-mini"),
    messages: [
      { role: "system", content: SUMMARY_PROMPT },
      {
        role: "assistant",
        content: `Resumo anterior: ${data.summary}\n\nOpiniões já formadas: ${contextData}`,
      },
      { role: "user", content: `Conversa:\n\n${messagesMaped}` },
    ],
    schema: responseSchema,
    temperature: 0.3,
  });

  try {
    if (!object.summary || !Array.isArray(object.opinions)) {
      throw new Error("Formato inválido");
    }

    object.opinions.forEach((op, i) => {
      if (!op.name || typeof op.opinion !== "number" || !op.jid || !Array.isArray(op.traits)) {
        throw new Error(`Opinião ${i} inválida`);
      }
    });

    return object;
  } catch (err) {
    console.error("Erro ao processar resposta:", err);
    console.error("Conteúdo:", object);
    throw new Error("Resposta da IA não é um JSON válido");
  }
}
