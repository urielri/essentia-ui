# Git: ramas, commits, PRs y versiones

Leé esta guía antes de crear una rama, commitear, abrir un PR o cambiar la versión de un paquete.

## Ramas

- **`main`** es la rama estable y **`develop`** la de integración. Ninguna de las dos recibe commits directos.
- **Las ramas de trabajo salen de `develop`** y se llaman `<tipo>/<descripcion-en-kebab-case>`, en inglés (`feat/glass-shader-refinement`, `refactor/3-layer-split`). El `<tipo>` es el mismo que el de los commits.
- **Flujo:** rama de trabajo → PR a `develop` → PR de `develop` a `main`.
- **El PR de `develop` a `main` es un release:** revisá qué incluye antes de pedir el merge. Si cierra una fase, ahí van los bumps de versión (ver [Versiones y CHANGELOG](#versiones-y-changelog)).
- **Historial:** hasta el PR 4 el repo trabajó trunk-based contra `main`. Desde que se creó `develop` (sincronizada con `main`), se usa este flujo de PRs.
- **Nunca** hagas force push a `main` ni a `develop`. En tu propia rama, solo si nadie más trabaja sobre ella.

## Commits

Formato [Conventional Commits](https://www.conventionalcommits.org/es/), como el historial reciente:

```text
<tipo>(<área>): <descripción>

<cuerpo opcional: por qué se hizo el cambio>
```

- **Descripción:** en inglés, imperativo, minúscula y sin punto final (`fix(styles): re-render Text when troika sync completes`).
- **Tipos:** `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `style`, `build`, `ci` y `chore`.
- **Área:** el workspace afectado, sin prefijo: `core`, `styles`, `ui`, `web-svelte`, `telar`. Se omite si el cambio es transversal.
- **Cambios incompatibles:** `!` después del área (`feat(styles)!: …`) y explicación en el cuerpo.
- **Fases:** si el cambio cierra o avanza una fase del roadmap, citala en la descripción o en el cuerpo (`— Fase 4`).
- **Un cambio lógico por commit.** Nada de `wip` ni "cambios menores": si hace falta, reescribí el historial de tu rama antes del PR.
- **No mezcles formato con lógica.**

## Pull requests

- **Título:** mismo formato que un commit, o un resumen corto si el PR agrupa varios commits.
- **Descripción en español,** con estas secciones:
  - **Resumen:** qué cambia y por qué, un punto por commit relevante (con su `tipo(área)`);
  - **Verificación:** comandos de la Definition of Done que corriste y su resultado (tests que pasan, diagnósticos de `svelte-check`, demos revisadas en el navegador);
  - **Pendiente (fuera de este PR):** lo que encontraste y no resolviste.
- **Capturas** si cambia algo visual.
- **Base del PR:** `develop`. Solo el PR de release apunta a `main`.
- **Un tema por PR,** chico y revisable. Los refactors y reformateos van en PRs separados.
- **Merge:** con merge commit, como hasta ahora.

## Versiones y CHANGELOG

- **Changesets está configurado pero no se usa todavía:** los bumps son manuales. No corras `changeset version` ni `changeset publish` sin que el usuario lo pida.
- **Cada paquete Essentia** (`essentia-core`, `essentia-styles`, `essentia-ui`) tiene su `CHANGELOG.md`, escrito a mano en español con estilo Keep a Changelog (`@repo/telar` todavía no tiene, y el de `apps/telar` es un resto de Changesets):
  - las entradas nuevas van en `## [Unreleased]`, agrupadas en `### Added`, `### Changed`, `### Fixed` o `### Removed`;
  - cada entrada empieza con el elemento en negrita (`**`<Text>`**`) y explica el porqué si no es obvio;
  - al cerrar una versión, `[Unreleased]` pasa a `## [x.y.z] — <título>`.
- **SemVer en 0.x:**
  - primitiva, componente o API nueva → minor;
  - corrección sin cambio de API → patch;
  - un paquete que no cambió no se bumpea.
- **El bump se hace al cerrar una fase o un hito,** antes del PR de release a `main`, y se refleja en el roadmap de [`packages/core/README.md`](../../packages/core/README.md).
