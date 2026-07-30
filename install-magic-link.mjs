import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const appJsonPath = resolve(process.cwd(), "app.json");

try {
  const source = await readFile(appJsonPath, "utf8");
  const config = JSON.parse(source);
  config.expo ??= {};
  config.expo.scheme = "oummah";
  await writeFile(appJsonPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");
  console.log(
    "Configuration terminée : le deep link oummah:// est actif dans app.json.",
  );
} catch (error) {
  console.error("Impossible de configurer app.json automatiquement.");
  console.error(
    "Lancez cette commande depuis la racine du projet OUMMAH, là où se trouve app.json.",
  );
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
