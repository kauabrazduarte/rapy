import http, { IncomingMessage, ServerResponse } from "http";

export default function webserver() {
  const PORT: number = 3000;

  const requestHandler = (req: IncomingMessage, res: ServerResponse): void => {
    if (req.method === "GET" && req.url === "/") {
      res.setHeader("Content-Type", "application/json");
      res.writeHead(200);

      const responsePayload = {
        status: "alive",
        message: "Rapy está pronto novamente!",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      };

      res.end(JSON.stringify(responsePayload));
    } else {
      res.setHeader("Content-Type", "application/json");
      res.writeHead(404);
      res.end(JSON.stringify({ error: "Endpoint não encontrado" }));
    }
  };

  const server = http.createServer(requestHandler);

  server.listen(PORT, () => {
    console.log(`Servidor HTTP TypeScript nativo rodando na porta ${PORT}`);
  });
}
