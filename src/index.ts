import "dotenv/config";
import Whatsapp from "./managers/Whatsapp";
import rapy from "./rapy";
import isWebServer from "./utils/isWebServer";
import webserver from "./utils/webserver";

async function main() {
  if (isWebServer()) {
    console.log("Webserver requerido, iniciando servidor...");
    webserver();
  }

  const whatsapp = new Whatsapp();
  await rapy(whatsapp);
}

main();
