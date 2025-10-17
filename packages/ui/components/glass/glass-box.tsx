"use client";

import React, {
  FC,
  ReactNode,
  CSSProperties,
  useEffect,
  useState,
  useMemo,
} from "react";
import * as THREE from "three";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { RefractionEffect } from "./refraction-effect";
import {
  isWebGLAvailable,
  isBackdropFilterSupported,
  createRotatingCubeBackground, // Asumo que esta función crea el THREE.Mesh
} from "./functions";

// --- Hooks de Utilidad ---

// Hook para detección segura en el cliente (SSR-safe)
const useSupportCheck = () => {
  const [support, setSupport] = useState({
    webgl: false,
    cssBlur: false,
    isClient: false,
  });

  useEffect(() => {
    setSupport({
      webgl: isWebGLAvailable(),
      cssBlur: isBackdropFilterSupported(),
      isClient: true,
    });
  }, []);

  return support;
};

// Componente para animar el mesh dentro del bucle de R3F
const AnimateMesh: FC<{ mesh: THREE.Mesh }> = ({ mesh }) => {
  useFrame(({ clock }) => {
    // Llama al método update si existe, usando el tiempo de R3F
    if ((mesh as any).update) {
      (mesh as any).update(clock.getElapsedTime());
    }
  });
  return null;
};

// --- Componente de Escena R3F (Dentro del Canvas) ---

const ThreeScene: FC<{ activeMesh: THREE.Mesh }> = ({ activeMesh }) => {
  const { gl } = useThree();

  // 💡 Crear el RenderTarget para la captura del fondo
  const renderTarget = useMemo(
    () =>
      new THREE.WebGLRenderTarget(
        gl.domElement.clientWidth,
        gl.domElement.clientHeight,
      ),
    [gl],
  );

  return (
    <>
      {/* Mesh de Fondo: Objeto 3D estático o animado */}
      <primitive object={activeMesh} />

      {/* Animador: Conectado al bucle de useFrame */}
      <AnimateMesh mesh={activeMesh} />

      {/* El Efecto de Refracción: El vidrio que usará la textura capturada */}
      <RefractionEffect
        renderTarget={renderTarget}
        backgroundTexture={renderTarget.texture}
        distortion={1.0}
      />
    </>
  );
};

// --- Tipado y Componente Principal ---

type GlassBoxProps = {
  children: ReactNode;
  backgroundMesh?: THREE.Mesh;
  className?: string;
  glassStyle?: CSSProperties;
  contentStyle?: CSSProperties;
};

export const GlassBox: FC<GlassBoxProps> = ({
  children,
  backgroundMesh,
  className = "",
  glassStyle = {},
  contentStyle = {},
}) => {
  const support = useSupportCheck();

  // 💡 1. Lógica para el mesh por defecto
  const [defaultMesh, setDefaultMesh] = useState<THREE.Mesh | undefined>(
    undefined,
  );

  useEffect(() => {
    if (!backgroundMesh && support.isClient && !defaultMesh) {
      const mesh = createRotatingCubeBackground();
      setDefaultMesh(mesh);
    }
  }, [backgroundMesh, support.isClient, defaultMesh]);

  // Mesh activo (prioriza prop, sino usa el default)
  const activeMesh = backgroundMesh || defaultMesh;

  // 💡 2. Lógica de Decisión (para clases CSS)
  let finalContentClasses: string = className;

  if (support.isClient) {
    if (support.webgl && activeMesh) {
      finalContentClasses = `${className} three-js-mode`;
    } else if (support.cssBlur) {
      finalContentClasses = `${className} glass`;
    } else {
      finalContentClasses = `${className} no-blur-support`;
    }
  } else {
    // Modo SSR (para evitar el Hydration Mismatch)
    finalContentClasses = `${className} ssr-safe-mode`;
  }

  const baseContentStyle: CSSProperties = {
    position: "relative",
    zIndex: 2,
    ...contentStyle,
  };

  // 💡 3. Renderizado con R3F (solo si hay soporte y un mesh disponible)
  if (support.isClient && support.webgl && activeMesh) {
    return (
      <div style={{ position: "relative", width: "100%", height: "100%" }}>
        <Canvas
          style={{ position: "absolute", inset: 0, zIndex: 1, ...glassStyle }}
          camera={{ position: [0, 0, 2], fov: 75 }}
        >
          {/* Usamos el ! para afirmar que el mesh existe gracias a la comprobación del IF */}
          <ThreeScene activeMesh={activeMesh!} />
        </Canvas>

        <div className={finalContentClasses} style={baseContentStyle}>
          {children}
        </div>
      </div>
    );
  }

  // 💡 4. Renderizado Fallback (SSR, CSS, o No-Blur)
  return (
    <div style={{ position: "relative" }}>
      <div className={finalContentClasses} style={baseContentStyle}>
        {children}
      </div>
    </div>
  );
};
