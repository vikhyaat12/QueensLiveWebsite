"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export type Hero3DProductVisualProps = {
  productName?: string;
  subtitle?: string;
  verticalLabel?: string;
  scale?: number;
  autoRotate?: boolean;
  rotationSpeed?: number;
  mouseInteraction?: boolean;
  lightingIntensity?: number;
  accentColor?: string;
  bgEffect?: "studio" | "purple" | "transparent";
  customImageUrl?: string;
  customModelUrl?: string;
  isInteractive?: boolean;
  height?: number | string;
  showInfoPlate?: boolean;
};

// Helper to generate the authentic Liko-Q pharmaceutical label texture
function createLikoQLabelTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // White clean background
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Left Column: Dosage & Clinical Info
  ctx.fillStyle = "#555555";
  ctx.font = "bold 13px sans-serif";
  ctx.fillText("COMPOSITION & DOSAGE:", 40, 70);
  ctx.font = "11px sans-serif";
  ctx.fillText("Each 5ml contains:", 40, 95);
  ctx.fillText("• Lycopene 10% USP: 2000 mcg", 40, 115);
  ctx.fillText("• Vitamin A (as Palmitate): 2500 IU", 40, 135);
  ctx.fillText("• Vitamin E Acetate: 10 IU", 40, 155);
  ctx.fillText("• Vitamin C: 50 mg", 40, 175);
  ctx.fillText("• Zinc Gluconate: 3 mg", 40, 195);
  ctx.fillText("• Selenium (as Sodium Selenite): 35 mcg", 40, 215);
  ctx.fillText("Dosage: As directed by Physician.", 40, 245);
  ctx.fillText("Store below 25°C in dry place.", 40, 265);
  ctx.fillText("SHAKE WELL BEFORE USE", 40, 285);
  ctx.fillText("Mfg. Lic. No.: M/812/2022", 40, 310);

  // Center Main Front Panel (from x: 340 to 680)
  // 1. Red 200ml Pill Badge
  ctx.fillStyle = "#C62828";
  ctx.beginPath();
  ctx.roundRect(470, 30, 84, 28, 14);
  ctx.fill();
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 14px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("200ml", 512, 49);

  // 2. Category Title
  ctx.fillStyle = "#1E293B";
  ctx.font = "600 20px sans-serif";
  ctx.fillText("Lycopene, Vitamins", 512, 95);
  ctx.fillText("& Minerals", 512, 120);

  // 3. Brand Logo: Liko Q
  ctx.textAlign = "left";
  ctx.font = "bold 46px sans-serif";
  ctx.fillStyle = "#0284C7"; // Cyan/Blue Liko
  ctx.fillText("Liko", 405, 175);
  ctx.fillStyle = "#EA580C"; // Orange Q
  ctx.fillText("Q", 515, 175);

  ctx.fillStyle = "#64748B";
  ctx.font = "bold 12px sans-serif";
  ctx.fillText("Suspension", 460, 195);

  // 4. Red Banner with Tomato/Orange Icon
  ctx.fillStyle = "#B91C1C";
  ctx.fillRect(360, 210, 304, 150);

  // Tomato circle emblem
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.arc(512, 260, 32, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#DC2626";
  ctx.beginPath();
  ctx.arc(512, 260, 28, 0, Math.PI * 2);
  ctx.fill();

  // Highlight on tomato
  ctx.fillStyle = "#FCA5A5";
  ctx.beginPath();
  ctx.arc(504, 252, 8, 0, Math.PI * 2);
  ctx.fill();

  // Leaf on top
  ctx.fillStyle = "#16A34A";
  ctx.beginPath();
  ctx.ellipse(512, 230, 10, 4, Math.PI / 4, 0, Math.PI * 2);
  ctx.fill();

  // Banner text
  ctx.textAlign = "center";
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 16px sans-serif";
  ctx.fillText("DELICIOUS", 512, 316);
  ctx.fillStyle = "#FEF08A";
  ctx.font = "bold 18px sans-serif";
  ctx.fillText("ORANGE", 512, 336);
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 12px sans-serif";
  ctx.fillText("FLAVOUR", 512, 352);

  // Queen's Crown Logo at Bottom Right of front
  ctx.textAlign = "right";
  ctx.fillStyle = "#D4AF37";
  ctx.font = "bold 20px serif";
  ctx.fillText("👑 Queen's", 660, 395);
  ctx.font = "9px sans-serif";
  ctx.fillStyle = "#64748B";
  ctx.fillText("QUEENS CARE LABORATORIES", 660, 410);

  // Right Column: Nutritional Information
  ctx.textAlign = "left";
  ctx.fillStyle = "#555555";
  ctx.font = "bold 12px sans-serif";
  ctx.fillText("NUTRITIONAL VALUE", 720, 70);
  ctx.font = "11px sans-serif";
  ctx.fillText("Energy: 18.4 Kcal", 720, 95);
  ctx.fillText("Carbohydrate: 4.6 g", 720, 115);
  ctx.fillText("Sugar: 3.8 g", 720, 135);
  ctx.fillText("Protein: 0.0 g", 720, 155);
  ctx.fillText("Fat: 0.0 g", 720, 175);

  ctx.strokeStyle = "#E2E8F0";
  ctx.strokeRect(715, 50, 270, 150);

  ctx.fillText("Batch No.: QCL-LQ-2601", 720, 230);
  ctx.fillText("Mfg Date: JAN 2026", 720, 250);
  ctx.fillText("Exp Date: DEC 2028", 720, 270);
  ctx.fillText("M.R.P. ₹: 165.00", 720, 290);
  ctx.fillText("(Inclusive of all taxes)", 720, 310);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.minFilter = THREE.LinearFilter;
  return texture;
}

function disposeMaterial(mat: THREE.Material) {
  mat.dispose();
  for (const key of Object.keys(mat)) {
    const val = (mat as unknown as Record<string, unknown>)[key];
    if (val && typeof val === "object" && "isTexture" in val && typeof (val as THREE.Texture).dispose === "function") {
      (val as THREE.Texture).dispose();
    }
  }
}

function disposeObject(obj: THREE.Object3D) {
  obj.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      if (mesh.geometry) {
        mesh.geometry.dispose();
      }
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(disposeMaterial);
        } else {
          disposeMaterial(mesh.material);
        }
      }
    }
  });
}

export default function Hero3DProductVisual({
  productName = "LIKO-Q™",
  subtitle = "Lycopene, Vitamins & Minerals Suspension",
  verticalLabel = "PHARMACEUTICAL RIGOR · 200ML",
  scale = 1.0,
  autoRotate = true,
  rotationSpeed = 1.0,
  mouseInteraction = true,
  lightingIntensity = 1.6,
  accentColor = "#D4AF37",
  bgEffect = "studio",
  customImageUrl = "/uploads/liko-q-suspension.png",
  customModelUrl = "",
  height = 480,
  showInfoPlate = false,
}: Hero3DProductVisualProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hasWebGL, setHasWebGL] = useState(true);
  const [isInteracting, setIsInteracting] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const isImageMode = Boolean(customImageUrl && !customModelUrl);

  useEffect(() => {
    if (isImageMode) return;
    const mount = mountRef.current;
    if (!mount) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Three.js Scene Setup
    const scene = new THREE.Scene();
    const width = mount.clientWidth || 420;
    const h = typeof height === "number" ? height : 480;

    const camera = new THREE.PerspectiveCamera(38, width / h, 0.1, 1000);
    camera.position.set(0, 0.4, 7.8);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(width, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      mount.appendChild(renderer.domElement);
    } catch {
      setHasWebGL(false);
      return;
    }

    // Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9 * lightingIntensity);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfffaed, 2.2 * lightingIntensity);
    keyLight.position.set(5, 8, 6);
    scene.add(keyLight);

    const fillWarmLight = new THREE.DirectionalLight(0xf97316, 1.4 * lightingIntensity);
    fillWarmLight.position.set(-6, -1, 4);
    scene.add(fillWarmLight);

    const rimLight = new THREE.PointLight(0xd946ef, 1.8 * lightingIntensity, 20);
    rimLight.position.set(0, -4, -3);
    scene.add(rimLight);

    // Product Group
    const productGroup = new THREE.Group();
    const s = Number(scale) || 1.0;
    productGroup.scale.set(s * 0.95, s * 0.95, s * 0.95);
    productGroup.position.y = -0.3;
    scene.add(productGroup);

    const buildProceduralBottle = () => {
      // ─── 1. AMBER PHARMACEUTICAL SYRUP BOTTLE GLASS ───
      const bottleGlassMaterial = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color("#6E1609"), // Deep pharmaceutical ruby/amber
        transmission: 0.62,
        opacity: 0.94,
        transparent: true,
        roughness: 0.08,
        metalness: 0.12,
        ior: 1.52,
        reflectivity: 0.95,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
      });

      // Lower Main Cylinder
      const lowerBodyGeo = new THREE.CylinderGeometry(1.22, 1.25, 2.3, 40);
      const lowerBodyMesh = new THREE.Mesh(lowerBodyGeo, bottleGlassMaterial);
      lowerBodyMesh.position.y = -0.45;
      lowerBodyMesh.castShadow = true;
      productGroup.add(lowerBodyMesh);

      // Base Chamfer
      const baseGeo = new THREE.CylinderGeometry(1.25, 1.18, 0.25, 40);
      const baseMesh = new THREE.Mesh(baseGeo, bottleGlassMaterial);
      baseMesh.position.y = -1.65;
      productGroup.add(baseMesh);

      // Tapered Conical Shoulder
      const shoulderGeo = new THREE.CylinderGeometry(0.68, 1.22, 1.35, 40);
      const shoulderMesh = new THREE.Mesh(shoulderGeo, bottleGlassMaterial);
      shoulderMesh.position.y = 1.32;
      productGroup.add(shoulderMesh);

      // Neck
      const neckGeo = new THREE.CylinderGeometry(0.58, 0.68, 0.85, 40);
      const neckMesh = new THREE.Mesh(neckGeo, bottleGlassMaterial);
      neckMesh.position.y = 2.38;
      productGroup.add(neckMesh);

      // ─── 2. INTERNAL ORANGE SUSPENSION LIQUID ───
      const liquidMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color("#C2410C"),
        roughness: 0.2,
        metalness: 0.1,
        transparent: true,
        opacity: 0.88,
      });
      const liquidGeo = new THREE.CylinderGeometry(1.18, 1.2, 2.1, 32);
      const liquidMesh = new THREE.Mesh(liquidGeo, liquidMaterial);
      liquidMesh.position.y = -0.5;
      productGroup.add(liquidMesh);

      const liquidShoulderGeo = new THREE.CylinderGeometry(0.64, 1.18, 1.2, 32);
      const liquidShoulderMesh = new THREE.Mesh(liquidShoulderGeo, liquidMaterial);
      liquidShoulderMesh.position.y = 1.15;
      productGroup.add(liquidShoulderMesh);

      // ─── 3. WHITE PHARMACEUTICAL WRAP LABEL ───
      const labelTexture = createLikoQLabelTexture();
      const labelGeo = new THREE.CylinderGeometry(1.24, 1.24, 1.95, 48, 1, true, -Math.PI / 1.05, Math.PI * 1.9);
      const labelMaterial = new THREE.MeshStandardMaterial({
        map: labelTexture,
        roughness: 0.35,
        metalness: 0.05,
        side: THREE.DoubleSide,
      });
      const labelMesh = new THREE.Mesh(labelGeo, labelMaterial);
      labelMesh.position.y = -0.45;
      productGroup.add(labelMesh);

      // ─── 4. PINK / MAGENTA SCREW CAP ───
      const capMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color("#D81B60"), // Vivid pharmaceutical pink/magenta cap
        roughness: 0.3,
        metalness: 0.2,
      });
      const capGeo = new THREE.CylinderGeometry(0.66, 0.66, 0.72, 36);
      const capMesh = new THREE.Mesh(capGeo, capMaterial);
      capMesh.position.y = 2.88;
      productGroup.add(capMesh);

      // Cap Ridges
      const ridgeGeo = new THREE.TorusGeometry(0.67, 0.03, 16, 36);
      const ridge1 = new THREE.Mesh(ridgeGeo, capMaterial);
      ridge1.rotation.x = Math.PI / 2;
      ridge1.position.y = 2.7;
      productGroup.add(ridge1);

      const ridge2 = new THREE.Mesh(ridgeGeo, capMaterial);
      ridge2.rotation.x = Math.PI / 2;
      ridge2.position.y = 3.05;
      productGroup.add(ridge2);

      // ─── 5. TRANSLUCENT MEASURING CUP (DOSING CAP) ───
      const cupMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transmission: 0.82,
        opacity: 0.85,
        transparent: true,
        roughness: 0.25,
        ior: 1.45,
        clearcoat: 0.8,
      });
      const cupGeo = new THREE.CylinderGeometry(0.72, 0.69, 0.88, 36);
      const cupMesh = new THREE.Mesh(cupGeo, cupMaterial);
      cupMesh.position.y = 3.02;
      productGroup.add(cupMesh);

      const cupRimGeo = new THREE.TorusGeometry(0.72, 0.04, 16, 36);
      const cupRimMesh = new THREE.Mesh(cupRimGeo, cupMaterial);
      cupRimMesh.rotation.x = Math.PI / 2;
      cupRimMesh.position.y = 3.44;
      productGroup.add(cupRimMesh);

      // ─── 6. SIGNATURE FLOATING GOLD HALO RING ───
      const haloGeo = new THREE.TorusGeometry(1.85, 0.024, 16, 64);
      const haloMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(accentColor),
        metalness: 0.95,
        roughness: 0.1,
        emissive: new THREE.Color(accentColor),
        emissiveIntensity: 0.25,
      });
      const halo = new THREE.Mesh(haloGeo, haloMat);
      halo.rotation.x = Math.PI / 2.3;
      halo.position.y = -0.4;
      productGroup.add(halo);

      // ─── 7. FLOATING AMBIENT ORBS ───
      const orb1Geo = new THREE.SphereGeometry(0.35, 16, 16);
      const orb1Mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color("#EA580C"), // Orange Lycopene sphere
        metalness: 0.6,
        roughness: 0.2,
        transparent: true,
        opacity: 0.85,
      });
      const orb1 = new THREE.Mesh(orb1Geo, orb1Mat);
      orb1.position.set(1.9, 1.8, -0.6);
      productGroup.add(orb1);

      const orb2Geo = new THREE.SphereGeometry(0.26, 16, 16);
      const orb2Mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(accentColor),
        metalness: 0.85,
        roughness: 0.15,
        transparent: true,
        opacity: 0.75,
      });
      const orb2 = new THREE.Mesh(orb2Geo, orb2Mat);
      orb2.position.set(-1.8, -1.1, 0.5);
      productGroup.add(orb2);

      return { haloMesh: halo, orb1Mesh: orb1, orb2Mesh: orb2 };
    };

    let isDisposed = false;
    let haloMesh: THREE.Mesh | null = null;
    let orb1Mesh: THREE.Mesh | null = null;
    let orb2Mesh: THREE.Mesh | null = null;

    if (customModelUrl && customModelUrl.trim()) {
      const loader = new GLTFLoader();
      loader.load(
        customModelUrl.trim(),
        (gltf) => {
          if (isDisposed) {
            disposeObject(gltf.scene);
            return;
          }
          const model = gltf.scene;
          const box = new THREE.Box3().setFromObject(model);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z) || 1.0;
          const fitScale = 3.2 / maxDim;
          model.scale.setScalar(fitScale);
          model.position.sub(center.multiplyScalar(fitScale));
          model.position.y = -0.3;

          model.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });

          productGroup.add(model);
        },
        undefined,
        (error) => {
          console.warn("[Hero3DProductVisual] Custom 3D model failed to load, falling back to procedural visual:", error);
          if (!isDisposed) {
            const meshes = buildProceduralBottle();
            haloMesh = meshes.haloMesh;
            orb1Mesh = meshes.orb1Mesh;
            orb2Mesh = meshes.orb2Mesh;
          }
        }
      );
    } else {
      const meshes = buildProceduralBottle();
      haloMesh = meshes.haloMesh;
      orb1Mesh = meshes.orb1Mesh;
      orb2Mesh = meshes.orb2Mesh;
    }

    // Mouse Interaction
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let targetRotationX = 0;
    let targetRotationY = 0;

    const onMouseDown = (e: MouseEvent) => {
      if (!mouseInteraction) return;
      isDragging = true;
      setIsInteracting(true);
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging || !mouseInteraction) return;
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      targetRotationY += deltaX * 0.01;
      targetRotationX += deltaY * 0.006;
      targetRotationX = Math.max(-0.35, Math.min(0.35, targetRotationX));

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
      setTimeout(() => setIsInteracting(false), 800);
    };

    // Touch Support
    const onTouchStart = (e: TouchEvent) => {
      if (!mouseInteraction || e.touches.length !== 1) return;
      isDragging = true;
      setIsInteracting(true);
      previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging || !mouseInteraction || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - previousMousePosition.x;
      const deltaY = e.touches[0].clientY - previousMousePosition.y;

      targetRotationY += deltaX * 0.012;
      targetRotationX += deltaY * 0.008;
      targetRotationX = Math.max(-0.35, Math.min(0.35, targetRotationX));

      previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    const domElement = renderer.domElement;
    domElement.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    domElement.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onMouseUp);

    const handleResize = () => {
      if (!mount) return;
      const newW = mount.clientWidth;
      camera.aspect = newW / h;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, h);
    };
    window.addEventListener("resize", handleResize);

    // Animation Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      if (autoRotate && !isDragging && !prefersReducedMotion) {
        targetRotationY += 0.005 * (Number(rotationSpeed) || 1.0);
      }

      productGroup.rotation.y += (targetRotationY - productGroup.rotation.y) * 0.08;
      productGroup.rotation.x += (targetRotationX - productGroup.rotation.x) * 0.08;

      if (!prefersReducedMotion) {
        productGroup.position.y = -0.3 + Math.sin(t * 1.5) * 0.07;
        if (haloMesh) haloMesh.rotation.z = t * 0.22;
        if (orb1Mesh) orb1Mesh.position.y = 1.8 + Math.sin(t * 1.7) * 0.12;
        if (orb2Mesh) orb2Mesh.position.y = -1.1 + Math.cos(t * 1.4) * 0.09;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      isDisposed = true;
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      domElement.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      domElement.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onMouseUp);

      disposeObject(scene);

      if (mount && renderer.domElement && mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [accentColor, autoRotate, bgEffect, customModelUrl, height, lightingIntensity, mouseInteraction, rotationSpeed, scale]);

  const bgStyle =
    bgEffect === "purple"
      ? "linear-gradient(135deg, rgba(42, 15, 58, 0.95) 0%, rgba(20, 6, 28, 0.95) 100%)"
      : bgEffect === "studio"
      ? "radial-gradient(circle at 50% 50%, rgba(250, 248, 245, 0.85) 0%, rgba(235, 228, 218, 0.55) 100%)"
      : "transparent";

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height,
        background: bgStyle,
        borderRadius: 8,
        overflow: "visible",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      aria-label={`Product Presentation: ${productName}`}
    >
      {isImageMode ? (
        <div
          onMouseMove={(e) => {
            if (!mouseInteraction) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
            const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
            setMousePos({ x, y });
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => {
            setIsHovered(false);
            setMousePos({ x: 0, y: 0 });
          }}
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            perspective: 1000,
          }}
        >
          <img
            src={customImageUrl}
            alt={productName}
            style={{
              maxHeight: typeof height === "number" ? height : 440,
              maxWidth: "100%",
              objectFit: "contain",
              transform: `perspective(1000px) rotateY(${mousePos.x * 12}deg) rotateX(${-mousePos.y * 10}deg) scale(${isHovered ? 1.03 : 1})`,
              transition: isHovered ? "transform 0.1s ease-out" : "transform 0.4s ease-out",
              filter: "drop-shadow(0 16px 32px rgba(42, 15, 58, 0.15))",
            }}
          />
        </div>
      ) : hasWebGL ? (
        <div
          ref={mountRef}
          style={{ width: "100%", height: "100%", cursor: isInteracting ? "grabbing" : "grab" }}
        />
      ) : customImageUrl ? (
        <img
          src={customImageUrl}
          alt={productName}
          style={{ maxHeight: "80%", objectFit: "contain" }}
        />
      ) : null}

      {/* Floating Clinical Product Label Overlay - only when requested */}
      {showInfoPlate && (
        <div
          style={{
            position: "absolute",
            bottom: 16,
            left: 16,
            background: "rgba(255, 255, 255, 0.92)",
            backdropFilter: "blur(8px)",
            border: "1px solid var(--line)",
            padding: "8px 16px",
            borderRadius: 4,
            pointerEvents: "none",
            boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
          }}
        >
          <span
            style={{
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: ".14em",
              textTransform: "uppercase",
              color: "#D4AF37",
              display: "block",
            }}
          >
            QUEENS CARE PHARMACEUTICALS
          </span>
          <b style={{ fontSize: 15, color: "#2A0F3A", fontFamily: "var(--font-display)", letterSpacing: ".02em" }}>
            {productName}
          </b>
          {subtitle && (
            <span style={{ fontSize: 11, color: "var(--muted)", display: "block", marginTop: 2 }}>
              {subtitle}
            </span>
          )}
        </div>
      )}

      {showInfoPlate && verticalLabel && (
        <p
          className="vertical-label"
          style={{
            position: "absolute",
            right: 16,
            top: "50%",
            transform: "translateY(-50%) rotate(90deg)",
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: ".22em",
            color: "var(--muted)",
            margin: 0,
            pointerEvents: "none",
          }}
        >
          {verticalLabel}
        </p>
      )}
    </div>
  );
}
