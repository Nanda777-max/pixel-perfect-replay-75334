import fs from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";

/**
 * Lists every image inside public/images and public/artwork as `virtual:public-images`, so
 * photos dropped into a folder (for example public/images/travel/thailand/) are discovered
 * without editing code. In development the list refreshes when files are added or removed;
 * a production build captures the list at build time.
 */
export function publicImages(): Plugin {
  const id = "virtual:public-images";
  const resolved = "\0" + id;
  const image = /\.(jpe?g|png|webp|avif|gif)$/i;
  let publicDir = path.join(process.cwd(), "public");
  const folders = () => ["images", "artwork"].map((f) => path.join(publicDir, f));
  const walk = (dir: string): string[] =>
    fs.existsSync(dir)
      ? fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
          const full = path.join(dir, entry.name);
          return entry.isDirectory() ? walk(full) : image.test(entry.name) ? [full] : [];
        })
      : [];
  return {
    name: "mindscape-public-images",
    configResolved(config) {
      if (config.publicDir) publicDir = config.publicDir;
    },
    resolveId(source) {
      return source === id ? resolved : undefined;
    },
    load(source) {
      if (source !== resolved) return;
      const files = folders()
        .flatMap(walk)
        .map((file) => "/" + path.relative(publicDir, file).split(path.sep).join("/"))
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
      return `export const publicImages = ${JSON.stringify(files)};`;
    },
    configureServer(server) {
      server.watcher.add(folders());
      const refresh = (file: string) => {
        if (!image.test(file) || !folders().some((dir) => path.resolve(file).startsWith(dir))) return;
        for (const environment of Object.values(server.environments)) {
          const mod = environment.moduleGraph.getModuleById(resolved);
          if (mod) environment.moduleGraph.invalidateModule(mod);
        }
        server.ws.send({ type: "full-reload" });
      };
      server.watcher.on("add", refresh);
      server.watcher.on("unlink", refresh);
    },
  };
}
