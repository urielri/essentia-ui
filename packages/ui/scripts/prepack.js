const fs = require("fs");
const path = require("path");

const pkgPath = path.join(__dirname, "..", "package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));

// 1. Cambia el nombre para la publicación (essentia-ui)
pkg.name = pkg.publishName;

// 2. Cambia los puntos de entrada principales a la versión compilada (dist)
pkg.main = pkg.distEntry;
pkg.module = pkg.distEntry;
pkg.types = pkg.distTypes;

// 3. Cambia las exportaciones a la versión compilada
if (pkg.exports && pkg.exports["."]) {
  pkg.exports["."].types = pkg.distTypes;
  pkg.exports["."].import = pkg.distEntry;
  // Deja 'source' y 'default' como fallback o para no reescribir
}

console.log(
  `[Prepack] Cambiando '@repo/ui' a '${pkg.name}' y apuntando a 'dist'.`,
);
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
