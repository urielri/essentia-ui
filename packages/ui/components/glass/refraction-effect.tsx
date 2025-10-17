import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useRef, FC, useMemo } from "react";
import { vertexShader, fragmentShader } from "./glass-shaders";

interface RefractionEffectProps {
  backgroundTexture: THREE.Texture;
  distortion: number;

  renderTarget: THREE.WebGLRenderTarget;
}

export const RefractionEffect: FC<RefractionEffectProps> = ({
  backgroundTexture,
  distortion,
  renderTarget,
}) => {
  const meshRef = useRef<THREE.Mesh>(null!);

  // 1. Crear el ShaderMaterial (dependencias actualizadas)
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          tBackground: { value: backgroundTexture },
          iTime: { value: 0.0 },
          uDistortion: { value: distortion },
        },
        // ... (resto del material)
      }),
    [backgroundTexture, distortion],
  );

  // 2. Lógica de animación: useFrame
  useFrame(({ gl, scene, camera, clock }) => {
    const material = meshRef.current.material as THREE.ShaderMaterial;

    if (!material.uniforms.iTime) return;
    material.uniforms.iTime.value = clock.getElapsedTime();

    // A) 💡 CORRECCIÓN: Usar el objeto renderTarget COMPLETO
    meshRef.current.visible = false;
    gl.setRenderTarget(renderTarget); // ¡Aquí está la corrección!
    gl.render(scene, camera);

    // B) Restaurar y renderizar el vidrio
    meshRef.current.visible = true;
    gl.setRenderTarget(null);
  }); // Usar un plano gigante para asegurar que siempre cubra la vista
  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <planeGeometry args={[100, 100]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
};
