'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function Particles() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;

    const W = ref.current.clientWidth;
    const H = ref.current.clientHeight;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x000000, 10, 200);

    const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 1000);
    camera.position.set(0, 0, 60);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 1);
    ref.current.appendChild(renderer.domElement);

    // Particles
    const count = 80; // 10x more
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 160;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 90;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 160;

      sizes[i] = Math.random() * 0.5 + 0.2; // small sizes
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // Round particles using PointsMaterial
    const mat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.5,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const points = new THREE.Points(geo, mat);
    scene.add(points);

    // Resize handler
    const onResize = () => {
      if (!ref.current) return;
      const w = ref.current.clientWidth;
      const h = ref.current.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', onResize);

    // Animate
    let raf = 0;
    const clock = new THREE.Clock();
    const animate = () => {
      const t = clock.getElapsedTime();

      // Move particles slightly for “twinkling” effect
      for (let i = 0; i < count; i++) {
        positions[i * 3 + 0] += Math.sin(t * 0.7 + i) * 0.02;
        positions[i * 3 + 1] += Math.cos(t * 0.7 + i) * 0.02;
      }
      geo.attributes.position.needsUpdate = true;

      // Rotate scene subtly for depth
      points.rotation.y = t * 0.01;
      points.rotation.x = Math.sin(t * 0.2) * 0.005;

      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      scene.remove(points);
      geo.dispose();
      mat.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={ref} className="absolute inset-0 -z-10" aria-hidden />;
}
