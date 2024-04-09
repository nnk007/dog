import fs from "node:fs";
import fsp from "node:fs/promises";
import * as path from "node:path";
import * as url from "node:url";

import { createRequestHandler } from "@remix-run/express";
import { broadcastDevReady, installGlobals } from "@remix-run/node";
import express from "express";
import { isbot } from "isbot";
import autoprefixer from 'autoprefixer';
import postcss from 'postcss';
import tailwind from "tailwindcss";
// import morgan from "morgan";
// import compression from "compression";

// This installs globals such as "fetch", "Response", "Request" and "Headers".
installGlobals();

/** @typedef {import('@remix-run/node').ServerBuild} ServerBuild */

const BUILD_PATH = path.resolve("build/index.js");
const VERSION_PATH = path.resolve("build/version.txt");

const initialBuild = await reimportServer();
const remixHandler =
  process.env.NODE_ENV === "development"
    ? await createDevRequestHandler(initialBuild)
    : createRequestHandler({
      build: initialBuild
    });

const app = express();

app.use((req,res,next)=>{
  // should ipban abusers
  if(!isbot(req.headers["user-agent"])) next();
})

// app.use(compression());

// http://expressjs.com/en/advanced/best-practice-security.html#at-a-minimum-disable-x-powered-by-header
app.disable("x-powered-by");

// Remix fingerprints its assets so we can cache forever.
app.use(
  "/build",
  express.static("public/build", { immutable: true, maxAge: "1y" })
);

// Everything else (like favicon.ico) is cached for an hour. You may want to be
// more aggressive with this caching.
app.use(express.static("public", { maxAge: "1h" }));

//minify
// app.use(morgan("tiny"));

//handle route with express
app.use("/file",async (req,res)=>{
  let _path = new URL(req.url,`http://${req.headers.host}`).searchParams.has("path") ? new URL(req.url,`http://${req.headers.host}`).searchParams.get("path") : '/';
  const name = _path.split("/").pop();
  const __dirname = path.resolve(process.argv[1].split('/').slice(0, -1).join("/"));
  const folder = process.env["DATA_FOLDER"] ? path.resolve(process.env["DATA_FOLDER"]) : __dirname;
  if (path.join(folder, _path).length < folder.length) _path = "/";
  try {
      const stat = await fs.promises.stat(path.join(folder, _path));
      if(stat.isDirectory()) return json([]); //should zip up the folder and offer download;
      const rs = fs.createReadStream(path.join(folder, _path));
      res.setHeader("Content-Disposition","attachment; filename="+(name));
      res.setHeader("Content-Length",stat.size);
      rs.pipe(res);
  } catch(err){
      throw err;
  }
})

//delegate handling to Remix
app.all("*", remixHandler);

const port = process.env.PORT || 3000;
app.listen(port, async () => {
  console.log(`Express server listening at http://localhost:${port}`);

  if (process.env.NODE_ENV === "development") {
    broadcastDevReady(initialBuild);
  }
});

/**
 * @returns {Promise<ServerBuild>}
 */
async function reimportServer() {
  const stat = fs.statSync(BUILD_PATH);

  // convert build path to URL for Windows compatibility with dynamic `import`
  const BUILD_URL = url.pathToFileURL(BUILD_PATH).href;

  // use a timestamp query parameter to bust the import cache
  return import(BUILD_URL + "?t=" + stat.mtimeMs);
}

async function buildStyles() {
    console.log(`[PostCSS] Build`);
    const css = await fsp.readFile('app/tailwind.css', "utf-8");
    const result =  await postcss([autoprefixer, tailwind]).process(css, { from: 'app/tailwind.css', to: 'public/style.css' });
    await fsp.writeFile('public/style.css', result.css);
    console.log("[PostCSS] Saved");
    if (result.map) {
        await fsp.writeFile('public/style.css.map', result.map.toString());
        console.log("Saved map");
    }
}

/**
 * @param {ServerBuild} initialBuild
 * @returns {Promise<import('@remix-run/express').RequestHandler>}
 */
async function createDevRequestHandler(initialBuild) {
  let build = initialBuild;
  async function handleServerUpdate() {
    console.log("[UPDATE]")
    //0.
    await buildStyles();
    // 1. re-import the server build
    build = await reimportServer();
    // 2. tell Remix that this app server is now up-to-date and ready
    broadcastDevReady(build);
  }
  const chokidar = await import("chokidar");
  chokidar
    .watch(VERSION_PATH, { ignoreInitial: true })
    .on("add", handleServerUpdate)
    .on("change", handleServerUpdate);

  // wrap request handler to make sure its recreated with the latest build for every request
  return async (req, res, next) => {
    try {
      return createRequestHandler({
        build,
        mode: "development",
      })(req, res, next);
    } catch (error) {
      next(error);
    }
  };
}
