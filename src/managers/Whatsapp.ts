import {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  WASocket,
  WAMessageContent,
  proto,
  WAPresence,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import qrcode from "qrcode-terminal";
import { LoggerConfig } from "../utils/logger";
import debounce from "../utils/debounce";
import fs from "fs";
import path from "path";
import getHomeDir from "../utils/getHomeDir";

export type MessageHandler = (
  sessionId: string,
  msg: proto.IWebMessageInfo,
  type: "text" | "image" | "audio" | "document",
  senderInfo?: {
    jid: string;
    name?: string;
  },
) => void;

const OFFLINE_DELAY_MS = 60_000;

export default class Whatsapp {
  private sock: WASocket | undefined;
  private onMessage?: MessageHandler;
  private presence: WAPresence = "available";

  async init() {
    const { state, saveCreds } = await useMultiFileAuthState("auth");
    this.sock = makeWASocket({
      auth: state,
      logger: LoggerConfig.forBaileys(
        process.env.NODE_ENV === "production" ? "error" : "warn",
      ),
    });

    this.sock.ev.on("creds.update", saveCreds);

    this.sock.ev.on("connection.update", (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        qrcode.generate(qr, { small: true }, (qrCode) => {
          console.log("Escaneie o QR code abaixo para conectar:");
          console.log(qrCode);
        });
      }

      if (connection === "close") {
        const shouldReconnect =
          (lastDisconnect?.error as Boom)?.output?.statusCode !==
          DisconnectReason.loggedOut;
        if (shouldReconnect) {
          this.init();
        } else {
          console.log("Desconectado. Faça login novamente.");
          fs.rmSync(path.join(getHomeDir(), "auth"), {
            recursive: true,
            force: true,
          });
        }
      } else if (connection === "open") {
        console.log("✅ Conectado ao WhatsApp");
        this.debaunceOffline();
      }
    });

    this.sock!.ev.on("messages.upsert", async ({ messages, type }) => {
      if (type !== "notify") return;
      for (const msg of messages) {
        const sessionId = msg.key.remoteJid;

        const content = msg.message as WAMessageContent;
        if (!content || !sessionId) return;

        if (!sessionId.endsWith("@g.us")) return;

        let senderInfo: { jid: string; name?: string } | undefined;

        if (msg.key.participant) {
          senderInfo = {
            jid: msg.key.participant,
            name: msg.pushName || undefined,
          };
        }

        this.debaunceOffline();

        if (this.presence === "unavailable") {
          await this.sock!.sendPresenceUpdate("available");
          this.presence = "available";
        }

        if (content.conversation || content.extendedTextMessage) {
          this.onMessage?.(sessionId, msg, "text", senderInfo);
        } else if (content.imageMessage) {
          this.onMessage?.(sessionId, msg, "image", senderInfo);
        } else if (content.audioMessage) {
          this.onMessage?.(sessionId, msg, "audio", senderInfo);
        } else if (content.documentMessage) {
          this.onMessage?.(sessionId, msg, "document", senderInfo);
        }
      }
    });

    await new Promise((resolve) => {
      this.sock!.ev.on("connection.update", (update) => {
        if (update.connection === "open") {
          resolve(undefined);
        }
      });
    });
  }

  registerMessageHandler(handler: MessageHandler) {
    this.onMessage = handler;
  }

  private debaunceOffline() {
    debounce(
      async () => {
        try {
          await this.sock!.sendPresenceUpdate("unavailable");
          this.presence = "unavailable";
        } catch {}
      },
      OFFLINE_DELAY_MS,
      "debounce-offline",
    );
  }

  async sendText(jid: string, text: string) {
    if (!this.sock) throw new Error("Não conectado");
    await this.sock.sendMessage(jid, { text });
  }

  async sendTextReply(jid: string, replyTo: string, text: string) {
    if (!this.sock) throw new Error("Não conectado");
    await this.sock.sendMessage(
      jid,
      { text },
      {
        quoted: {
          key: { id: replyTo, remoteJid: jid },
          message: {},
        },
      },
    );
  }

  async sendSticker(jid: string, filePath: string) {
    if (!this.sock) throw new Error("Não conectado");
    await this.sock.sendMessage(jid, { sticker: { url: filePath } });
  }

  async sendContact(jid: string, cell: string, name?: string) {
    if (!this.sock) throw new Error("Não conectado");
    const vcard =
      "BEGIN:VCARD\n" +
      "VERSION:3.0\n" +
      `FN:${name}\n` +
      `TEL;TYPE=CELL:${cell.replace(/\D/g, "")}\n` +
      "END:VCARD";

    await this.sock!.sendMessage(jid, {
      contacts: {
        displayName: name,
        contacts: [{ vcard }],
      },
    });
  }

  async createPoll(
    jid: string,
    name: string,
    options: string[],
    selectableCount: number = 1,
  ) {
    if (!this.sock) throw new Error("Não conectado");
    await this.sock.sendMessage(jid, {
      poll: { name, values: options, selectableCount },
    });
  }

  async sendLocation(jid: string, latitude: number, longitude: number) {
    if (!this.sock) throw new Error("Não conectado");
    await this.sock.sendMessage(jid, {
      location: { degreesLatitude: latitude, degreesLongitude: longitude },
    });
  }

  async sendImage(jid: string, filePath: string) {
    if (!this.sock) throw new Error("Não conectado");

    try {
      const imageBuffer = fs.readFileSync(filePath);
      await this.sock.sendMessage(jid, {
        image: imageBuffer,
        mimetype: "image/jpeg",
      });
    } catch (error) {
      console.error("Erro ao enviar imagem:", error);
      throw error;
    }
  }

  async sendAudio(jid: string, filePath: string) {
    if (!this.sock) throw new Error("Não conectado");

    try {
      const audioBuffer = fs.readFileSync(filePath);
      await this.sock.sendMessage(jid, {
        audio: audioBuffer,
        ptt: true,
        mimetype: "audio/mpeg",
      });
    } catch (error) {
      console.error("Erro ao enviar áudio:", error);
      throw error;
    }
  }

  private async updatePresence(to: string, presence: WAPresence) {
    if (!this.sock) throw new Error("Não conectado");
    await this.sock.sendPresenceUpdate(presence, to);
  }

  async setOnline(to: string) {
    await this.updatePresence(to, "available");
  }

  async setOffline(to: string) {
    await this.updatePresence(to, "unavailable");
  }

  async setTyping(to: string) {
    await this.updatePresence(to, "composing");
  }

  async pauseTyping(to: string) {
    await this.updatePresence(to, "paused");
  }
}
