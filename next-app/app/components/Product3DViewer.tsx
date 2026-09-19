"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";

export type Product3DViewerProps = {
  productName: string;
  modelUrl?: string;
  posterUrl?: string;
  autoRotate?: boolean;
  rotationSpeed?: number;
  scale?: number;
  positionX?: number;
  positionY?: number;
  positionZ?: number;
  cameraDistance?: number;
  lightingIntensity?: number;
  accentColor?: string;
  height?: number | string;
  enableShadow?: boolean;
  enableAnimation?: boolean;
};

export default function Product3DViewer({
  productName,
  modelUrl,
  posterUrl,
  autoRotate = true,
  rotationSpeed = 0.5,
  scale = 1,
  positionX = 0,
  positionY = 0,
  positionZ = 0,
  cameraDistance = 5,
  lightingIntensity = 1.2,
  accentColor = "#D4AF37",
  height = 420,
  enableShadow = true,
  enableAnimation = true,
}: Product3DViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [hasWebGL, setHasWebGL] = useState(true);
  const [loadedModel, setLoadedModel] = useState<THREE.Group | null>(null);
  const animFrameRef = useRef<number>(0);

  const cleanup = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (mountRef.current) {
      const canvas = mountRef.current.querySelector("canvas");
      if (canvas) mountRef.current.removeChild(canvas);
    }
  }, []);

  useEffect(() => {
    if (!modelUrl || !modelUrl.trim()) {
      setIsLoading(false);
      return;
    }

    const mount = mountRef.current;
    if (!mount) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const h = typeof height === "number" ? height : 420;

    // Three.js Scene
    const scene = new THREE.Scene();
    const width = mount.clientWidth || 400;
    const camera = new THREE.PerspectiveCamera(42, width / h, 0.1, 1000);
    camera.position.set(0, 0, cameraDistance);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(width, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.shadowMap.enabled = enableShadow;
      if (enableShadow) renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.2;
      mount.appendChild(renderer.domElement);
    } catch {
      setHasWebGL(false);
      setIsLoading(false);
      return;
    }

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6 * lightingIntensity);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfffaed, 2.0 * lightingIntensity);
    keyLight.position.set(5, 8, 6);
    keyLight.castShadow = enableShadow;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(new THREE.Color(accentColor), 1.2 * lightingIntensity);
    fillLight.position.set(-6, -2, 4);
    scene.add(fillLight);

    const rimLight = new THREE.PointLight(0x7e22ce, 1.5 * lightingIntensity, 20);
    rimLight.position.set(0, -4, -4);
    scene.add(rimLight);

    // Viewport Visibility Observer
    let isVisible = true;
    let activeAnimate: (() => void) | null = null;
    let observer: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          const visible = entry ? entry.isIntersecting : true;
          if (visible && !isVisible) {
            isVisible = true;
            if (activeAnimate) activeAnimate();
          } else if (!visible && isVisible) {
            isVisible = false;
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
          }
        },
        { threshold: 0.05 }
      );
      observer.observe(mount);
    }

    // Load GLB/GLTF model
    let cancelled = false;

    const loadModel = async () => {
      try {
        const { GLTFLoader } = await import("three/addons/loaders/GLTFLoader.js");
        if (cancelled) return;

        const loader = new GLTFLoader();
        loader.load(
          modelUrl,
          (gltf) => {
            if (cancelled) {
              // Dispose if cancelled during load
              gltf.scene.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                  child.geometry?.dispose();
                  if (Array.isArray(child.material)) {
                    child.material.forEach((m) => m.dispose());
                  } else {
                    child.material?.dispose();
                  }
                }
              });
              return;
            }

            const model = gltf.scene;

            // Normalize model size
            const box = new THREE.Box3().setFromObject(model);
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const normalizedScale = 2.5 / maxDim;

            model.scale.setScalar(normalizedScale * scale);
            model.position.set(positionX, positionY, positionZ);

            // Center model
            const center = box.getCenter(new THREE.Vector3());
            model.position.sub(center.multiplyScalar(normalizedScale * scale));
            model.position.y += positionY;

            if (enableShadow) {
              model.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                  child.castShadow = true;
                  child.receiveShadow = true;
                }
              });
            }

            scene.add(model);
            setLoadedModel(model);
            setIsLoading(false);

            // Animation loop
            let time = 0;
            const animate = () => {
              if (cancelled || !isVisible) return;
              animFrameRef.current = requestAnimationFrame(animate);
              if (autoRotate && !prefersReducedMotion && enableAnimation) {
                time += 0.01 * rotationSpeed;
                model.rotation.y = time;
              }
              renderer.render(scene, camera);
            };
            activeAnimate = animate;
            animate();
          },
          undefined,
          (err) => {
            if (!cancelled) {
              console.error("Failed to load 3D model:", err);
              setError("Failed to load 3D model. The file may be invalid or unavailable.");
              setIsLoading(false);
            }
          }
        );
      } catch (err) {
        if (!cancelled) {
          console.error("GLTFLoader import failed:", err);
          setError("3D model loading is not supported in this browser.");
          setIsLoading(false);
        }
      }
    };

    loadModel();

    return () => {
      cancelled = true;
      if (observer) observer.disconnect();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry?.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else {
            child.material?.dispose();
          }
        }
      });
      renderer?.dispose();
      if (mount && renderer?.domElement && mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [modelUrl, autoRotate, rotationSpeed, scale, positionX, positionY, positionZ, cameraDistance, lightingIntensity, accentColor, height, enableShadow, enableAnimation]);

  // No model URL — render nothing
  if (!modelUrl || !modelUrl.trim()) return null;

  if (!hasWebGL) {
    return posterUrl ? (
      <div style={{ height: typeof height === "number" ? height : 420, display: "grid", placeItems: "center", background: "#f3efe8", borderRadius: 8 }}>
        <img src={posterUrl} alt={productName} style={{ maxWidth: "80%", maxHeight: "80%", objectFit: "contain" }} />
      </div>
    ) : null;
  }

  return (
    <div
      ref={mountRef}
      style={{
        height: typeof height === "number" ? height : 420,
        position: "relative",
        background: "linear-gradient(135deg, #f8f6f3 0%, #f0ece6 100%)",
        borderRadius: 8,
        overflow: "hidden",
      }}
    >
      {isLoading && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            background: "rgba(248,246,243,0.9)",
            zIndex: 2,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              border: "3px solid var(--line)",
              borderTopColor: "var(--purple)",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <span style={{ fontSize: 12, color: "var(--muted)" }}>Loading 3D model…</span>
        </div>
      )}
      {error && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#f8f6f3",
            zIndex: 2,
          }}
        >
          <div style={{ textAlign: "center", padding: 20 }}>
            <p style={{ fontSize: 13, color: "#b34141", marginBottom: 8 }}>{error}</p>
            {posterUrl && (
              <img src={posterUrl} alt={productName} style={{ maxWidth: 200, maxHeight: 200, objectFit: "contain", marginTop: 12 }} />
            )}
          </div>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
