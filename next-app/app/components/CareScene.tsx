"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function CareScene() {
  const mount = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const host = mount.current;
    if (!host || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, host.clientWidth / host.clientHeight, .1, 100); camera.position.z = 7;
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true }); renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5)); renderer.setSize(host.clientWidth, host.clientHeight); host.appendChild(renderer.domElement);
    const gold = new THREE.MeshStandardMaterial({ color: 0xd9ad64, metalness: .7, roughness: .26, transparent: true, opacity: .78 });
    const violet = new THREE.MeshStandardMaterial({ color: 0x8f618e, metalness: .3, roughness: .15, transparent: true, opacity: .55 });
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(1.05, 32, 32), gold); sphere.position.set(1.65, 1.3, -.8); scene.add(sphere);
    const gem = new THREE.Mesh(new THREE.IcosahedronGeometry(.62, 1), violet); gem.position.set(-2.2, -1.3, 0); scene.add(gem);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.9, .07, 14, 60), gold); ring.rotation.x = 1.18; ring.position.set(-1.9, .35, -.8); scene.add(ring);
    scene.add(new THREE.AmbientLight(0xffffff, 1.3)); const light = new THREE.PointLight(0xffd68c, 18, 20); light.position.set(2, 3, 3); scene.add(light);
    const clock = new THREE.Clock(); let frame = 0; const render = () => { const t = clock.getElapsedTime(); sphere.position.y = 1.3 + Math.sin(t * .8) * .16; sphere.rotation.y = t * .3; gem.rotation.set(t * .32, t * .2, 0); ring.rotation.z = t * .18; renderer.render(scene, camera); frame = requestAnimationFrame(render); }; render();
    const resize = () => { camera.aspect = host.clientWidth / host.clientHeight; camera.updateProjectionMatrix(); renderer.setSize(host.clientWidth, host.clientHeight); }; window.addEventListener("resize", resize);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("resize", resize); renderer.dispose(); host.removeChild(renderer.domElement); };
  }, []);
  return <div className="care-scene" aria-hidden="true" ref={mount} />;
}
