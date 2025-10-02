export default function isWebServer() {
  const env = (process.env.WEB_SERVER ?? "").trim().toLowerCase();
  const webServer = env === "true" || env === "on" || env === "1";

  return webServer;
}
