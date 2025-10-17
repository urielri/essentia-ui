// packages/ui/components/glass/refraction-effect.tsx
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useRef, FC, useMemo } from "react";
// Asegúrate de que estas importaciones sean correctas
import { vertexShader, fragmentShader } from "./glass-shaders";

interface RefractionEffectProps {
  backgroundTexture: THREE.Texture;
  renderTarget: THREE.WebGLRenderTarget;
  distortion: number;
}

export const RefractionEffect: FC<RefractionEffectProps> = ({
  backgroundTexture,
  renderTarget,
  distortion,
}) => {
  // El mesh de vidrio debe ser un plano gigante para cubrir siempre la vista
  const meshRef = useRef<THREE.Mesh>(null!);

  // El material se crea una sola vez
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          tBackground: { value: backgroundTexture },
          iTime: { value: 0.0 },
          uDistortion: { value: distortion },
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        transparent: true,
        dithering: true,
      }),
    [backgroundTexture, distortion],
  );

  // Bucle de renderizado para capturar el fondo
  useFrame(({ gl, scene, camera, clock }) => {
    const mat = meshRef.current.material as THREE.ShaderMaterial;

    // 1. Actualizar tiempo
    if (!mat.uniforms.iTime) return;
    mat.uniforms.iTime.value = clock.getElapsedTime();

    // 2. Captura: Renderizar la escena (fondo) al RenderTarget
    meshRef.current.visible = false;
    gl.setRenderTarget(renderTarget); // Usamos el RenderTarget completo
    gl.render(scene, camera);

    // 3. Restaurar: Renderizar el vidrio a la pantalla principal
    meshRef.current.visible = true;
    gl.setRenderTarget(null);
  });

  return (
    // Un plano muy grande (100x100) para asegurar que siempre cubra el viewport
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <planeGeometry args={[100, 100]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
};
