Aquí tienes la versión definitiva del README.md para el repositorio de Essentia UI. Este documento servirá como el "Norte Tecnológico" del proyecto, detallando la visión, el stack de última generación y la arquitectura híbrida que hemos definido.

✨ Essentia UI Kit

The Liquid Glass Framework | Svelte 5 + WebGPU/WebGL 2

Essentia UI es un framework de sistemas gráficos de alto rendimiento diseñado para construir interfaces funcionales (tipo Figma o Miro) renderizadas íntegramente en la GPU.

A diferencia de las librerías tradicionales, Essentia no maqueta documentos HTML; proyecta un Sustrato de Materiales Físicos donde la refracción, la luz y la tipografía vectorial coexisten en un espacio ortográfico 1:1, manteniendo la reactividad moderna de Svelte y la accesibilidad nativa del navegador.

🏛️ Pilares del Proyecto

1. El Núcleo: World Space Layout

Sustituimos el flujo de caja (Box Model) de CSS por un motor de transformaciones matriciales.

Cámara Ortográfica 1:1: Mapeo exacto entre píxeles de pantalla y unidades de mundo.

Nesting Nativo: Gestión de jerarquías (Padre-Hijo) mediante el Scene Graph de Three.js, permitiendo que las transformaciones se hereden de forma eficiente en la GPU.

Responsive Viewport: Sistema de anclaje (Anchoring) y escalado dinámico que reacciona a los cambios de tamaño del canvas en tiempo real.

1. Estética: Liquid Glass PBR

La interfaz deja de ser plana para convertirse en una simulación de cristal y luz.

SDF Rendering: Todas las formas (rectángulos, círculos) se calculan mediante Signed Distance Fields para obtener bordes infinitamente suaves.

Refacción Dinámica: Implementación de un pipeline de renderizado por capas que captura el buffer de fondo para calcular distorsiones lumínicas reales ($IOR$).

Materiales PBR: Soporte para Normal Mapping y Environment Maps (IBL) que dotan a la UI de una profundidad física imposible de lograr con backdrop-filter.

1. Texto: MSDF v2 (Multi-channel Signed Distance Fields)

La tipografía en Essentia es vectorial y reactiva.

Nitidez Infinita: Uso de glifos MSDF para garantizar que el texto nunca se pixele, permitiendo efectos de iluminación y refracción sobre cada carácter.

Integrated Layout: El texto no es una capa superior, es un objeto físico que interactúa con las sombras y luces del entorno.

1. Accesibilidad: The Hybrid Bridge

No sacrificamos el SEO ni la accesibilidad (A11y).

Shadow Layer: Sincronización en tiempo real con un DOM invisible (HTML plano) generado vía SSR/SSG para lectores de pantalla y bots.

Ghost Inputs: Uso de elementos input reales ocultos para gestionar el foco, portapapeles y teclados virtuales, proyectando la interactividad en el motor gráfico.

🚀 Stack Tecnológico (2026 Ready)

CapaTecnologíaVersiónRolReactividadSvelte 5^5.0.0Gestión de estado mediante Runes ($state).EngineThree.js^0.174.0Core de renderizado (WebGPU/WebGL 2).AbstracciónThrelte^8.0.0Orquestación de componentes y ciclo de vida.ShadersGLSL / WGSL3.0+Cálculos PBR, SDF y Refracción.TipografíaMSDFv2Renderizado de texto vectorial en GPU.📂 Estructura del Repositorio

Plaintext

essentia-ui/

├── src/

│   ├── lib/

│   │   ├── core/           # Layout Engine, Cámara y Orchestrator

│   │   ├── shaders/        # Archivos .glsl (Liquid Glass, SDF, Noise)

│   │   ├── nodes/          # Primitivos base (EssentiaNode, TextNode)

│   │   ├── components/     # Librería de UI (Button, Panel, Input)

│   │   └── stores/         # Estados reactivos y sincronización de Uniforms

│   ├── routes/             # Vistas de ejemplo y documentación

│   └── app.html            # Entry point (Single Canvas)

🛠️ Roadmap Inicial

[ ] Fase 1: Configurar el Orchestrator con Cámara Ortográfica y useTask de Threlte.

[ ] Fase 2: Crear el SDF-Base-Shader para rectángulos con bordes redondeados.

[ ] Fase 3: Implementar el primer sistema de refracción (Liquid Glass) sobre un Environment Map.

[ ] Fase 4: Integrar el motor de texto MSDF y el sistema de Raycasting para eventos.

Essentia UI: No renderizamos interfaces, simulamos materiales inteligentes.
