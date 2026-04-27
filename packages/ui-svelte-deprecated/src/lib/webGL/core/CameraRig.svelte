<script lang="ts">
  import { T, useTask, useThrelte } from "@threlte/core";
  import { Vector3 } from "three";
  import { useEngine } from "./state.svelte";
  import type { ViewsMap } from "../types";

  // Props: El usuario define las vistas disponibles
  interface Props {
    views: ViewsMap;
    defaultView?: string;
    speed?: number; // Velocidad de transición (0.01 - 0.2)
  }

  let { views, defaultView = "home", speed = 0.05 }: Props = $props();

  // Accedemos al estado global
  const engine = useEngine();

  // Accedemos a la cámara actual de Threlte
  const { camera } = useThrelte();

  // Posición y target actuales (para interpolar)
  const currentPosition = new Vector3();
  const currentTarget = new Vector3();

  // Posición y target objetivo (hacia donde nos movemos)
  const targetPosition = new Vector3();
  const targetLookAt = new Vector3();

  // Inicializamos con la vista por defecto
  $effect(() => {
    const initialView = views[defaultView];
    if (initialView) {
      currentPosition.set(...initialView.position);
      currentTarget.set(...initialView.target);
      targetPosition.set(...initialView.position);
      targetLookAt.set(...initialView.target);
    }
  });

  // Reaccionamos a cambios de vista desde el estado global
  $effect(() => {
    const view = views[engine.currentView];
    if (view) {
      targetPosition.set(...view.position);
      targetLookAt.set(...view.target);
      engine.isTransitioning = true;
    }
  });

  // Loop de actualización: Interpolamos suavemente
  useTask(() => {
    // Lerp de posición
    currentPosition.lerp(targetPosition, speed);
    currentTarget.lerp(targetLookAt, speed);

    // Aplicamos a la cámara real
    $camera.position.copy(currentPosition);
    $camera.lookAt(currentTarget);

    // Detectamos si terminó la transición
    const positionDone = currentPosition.distanceTo(targetPosition) < 0.01;
    const targetDone = currentTarget.distanceTo(targetLookAt) < 0.01;

    if (positionDone && targetDone && engine.isTransitioning) {
      engine.isTransitioning = false;
    }
  });
</script>

<!-- Cámara base -->
<T.PerspectiveCamera
  makeDefault
  position={[0, 0, 10]}
  fov={50}
  near={0.1}
  far={1000}
/>
