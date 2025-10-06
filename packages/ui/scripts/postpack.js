const fs = require("fs");
const path = require("path");

const pkgPath = path.join(__dirname, "..", "package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));

// 1. Revierte el nombre al interno (@repo/ui)
pkg.name = "@repo/ui";

// 2. Revierte los puntos de entrada principales a la versión fuente
pkg.main = pkg.sourceEntry;
pkg.module = pkg.sourceEntry;
pkg.types = pkg.sourceEntry;

// 3. Revierte las exportaciones a la versión fuente
if (pkg.exports && pkg.exports["."]) {
  pkg.exports["."].types = pkg.sourceEntry;
  pkg.exports["."].import = pkg.sourceEntry;
  // Deja 'source' y 'default' como estaban
}

console.log(
  `[Postpack] Revirtiendo nombre y puntos de entrada a '@repo/ui' (código fuente).`,
);
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
