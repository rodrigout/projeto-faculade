import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { cn } from '@/lib/utils';

interface PileSurface3DProps {
  fill: number;
  seed: number;
  scanning?: boolean;
  className?: string;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  pointsData?: any[]; // optional real points
  compact?: boolean;
}

export function PileSurface3D({
  fill,
  seed,
  scanning,
  className,
  lengthCm = 32.0,
  widthCm = 15.63,
  heightCm = 16.0,
  pointsData = [],
  compact = false
}: PileSurface3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  
  // Memoize the point cloud generation so it doesn't bounce around on re-renders
  const { pts, count, maxDZ } = React.useMemo(() => {
    let computedPts = pointsData;
    
    // Generate synthetic points if none provided
    if (!computedPts || computedPts.length === 0) {
      computedPts = [];
      const numPoints = 1800;
      const cx = lengthCm / 2;
      const cy = widthCm / 2;

      // Use a simple seeded randomizer instead of Math.random to make it 100% deterministic
      let currentSeed = seed || 1;
      const random = () => {
        const x = Math.sin(currentSeed++) * 10000;
        return x - Math.floor(x);
      };

      for (let i = 0; i < numPoints; i++) {
        const x = (random() - 0.5) * lengthCm * 0.8 + cx;
        const y = (random() - 0.5) * widthCm * 0.8 + cy;

        const dx = (x - cx) * 2.1;
        const dy = (y - cy) * 3.2;
        const base = Math.exp(-(dx * dx + dy * dy) * 1.6);
        const ridge = 0.18 * Math.exp(-Math.pow((y - cy) * 4, 2)) * (1 - Math.abs(x / lengthCm - 0.5) * 1.4);
        const noise = 0.06 * Math.sin(x * 2.3 + seed) * Math.cos(y * 1.7 - seed);
        
        let z = Math.max(0, (base + ridge + noise) * fill * heightCm);
        if (z < 0.05) continue;
        
        // Map to Three coordinates where Y is up
        computedPts.push({ x: x - cx, y: y - cy, z: z, dz: z });
      }
    }

    let maxZ = 0.01;
    let minZ = 999.0;
    computedPts.forEach((p: any) => {
      const dz = p.dz !== undefined ? p.dz : (p.z > 0 ? p.z : Math.abs(p.z));
      if (dz > maxZ) maxZ = dz;
      if (dz < minZ) minZ = dz;
    });

    return { pts: computedPts, count: computedPts.length, maxDZ: maxZ, minDZ: minZ };
  }, [fill, seed, lengthCm, widthCm, heightCm, pointsData]); // Stable dependencies

  useEffect(() => {
    if (!mountRef.current) return;

    const container = mountRef.current;
    const w = container.clientWidth;
    const h = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = null; // transpareng

    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1500);
    camera.position.set(38, 30, 48);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'default'
    });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.target.set(0, 3, 0);
    controls.maxPolarAngle = Math.PI / 2 + 0.08;
    controls.minDistance = 5;
    controls.maxDistance = 300;

    // Grid
    const grid = new THREE.GridHelper(60, 30, 0x0284c7, 0x1e293b);
    grid.position.y = 0;
    scene.add(grid);

    const axes = new THREE.AxesHelper(10);
    scene.add(axes);

    // Box wireframe
    const boxGeo = new THREE.BoxGeometry(lengthCm, heightCm, widthCm);
    const wireframe = new THREE.WireframeGeometry(boxGeo);
    const line = new THREE.LineSegments(wireframe);
    const lineMat = line.material as THREE.LineBasicMaterial;
    lineMat.color.setHex(0x0ea5e9);
    lineMat.transparent = true;
    lineMat.opacity = 0.22;
    line.position.set(0, heightCm / 2, 0);
    scene.add(line);

    const geometry = new THREE.BufferGeometry();
    const positions: number[] = [];
    const colors: number[] = [];

    // Use memoized pts
    const minDZ = pts.length > 0 ? pts.reduce((min: number, p: any) => Math.min(min, p.dz !== undefined ? p.dz : (p.z > 0 ? p.z : Math.abs(p.z))), 999) : 0;

    pts.forEach((p: any) => {
      const px = p.x;
      const py = p.dz !== undefined ? p.dz : (p.z > 0 ? p.z : 0.0);
      const pz = p.y;
      positions.push(px, py, pz);

      const g = Math.min(1.0, Math.max(0.0, (py - minDZ) / (maxDZ - minDZ || 1.0)));
      const color = new THREE.Color();
      color.setHSL(0.55 - g * 0.53, 0.95, 0.50 + g * 0.15);
      colors.push(color.r, color.g, color.b);
    });

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.6,
      vertexColors: true,
      transparent: true,
      opacity: 0.95
    });

    const pointCloud = new THREE.Points(geometry, material);
    scene.add(pointCloud);

    // Animation Loop
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      const rw = container.clientWidth;
      const rh = container.clientHeight;
      camera.aspect = rw / rh;
      camera.updateProjectionMatrix();
      renderer.setSize(rw, rh);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
      container.removeChild(renderer.domElement);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [lengthCm, widthCm, heightCm, pts]); // depends on memoized pts

  return (
    <div className={cn("gap-3", compact ? "flex flex-col h-full" : "grid lg:grid-cols-[1fr_260px]", className)}>
      <div className={cn("relative overflow-hidden rounded-md border border-border bg-[#080e1a] flex-1 w-full", compact ? "min-h-[360px]" : "min-h-[400px]", scanning && "scan-overlay")}>
        <div ref={mountRef} className="absolute inset-0" />
        <div className="pointer-events-none absolute left-3 top-3 eyebrow text-primary bg-background/80 px-2 py-1 rounded backdrop-blur">
          {compact ? "3D" : "Gêmeo Digital 3D · LiDAR"}
        </div>
        {!compact && (
          <div className="pointer-events-none absolute bottom-3 right-3 metric text-[10px] text-muted-foreground bg-background/80 px-2 py-1 rounded backdrop-blur">
            {lengthCm.toFixed(2)} m × {widthCm.toFixed(2)} m · {count.toLocaleString()} pts
          </div>
        )}
      </div>

      {!compact && (
        <div className="flex flex-col gap-3">
          <div className="relative flex-1 rounded-md border border-border bg-background p-3 flex flex-col justify-center text-center">
            <div className="eyebrow mb-1 text-primary">Cume do Monte (Pico)</div>
            <div className="metric text-3xl font-bold">{maxDZ.toFixed(2)} <span className="text-sm">m</span></div>
          </div>
          <div className="rounded-md border border-border bg-background p-3">
            <div className="eyebrow mb-2">Escala de elevação</div>
            <div className="h-3 w-full rounded-sm" style={{
              background: "linear-gradient(90deg, hsl(198, 95%, 50%), hsl(150, 95%, 50%), hsl(60, 95%, 50%), hsl(7, 95%, 50%))",
            }} />
            <div className="mt-2 flex justify-between metric text-[10px] text-muted-foreground">
              <span>0 m</span>
              <span>{(maxDZ / 2).toFixed(1)} m</span>
              <span>{maxDZ.toFixed(1)} m</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
