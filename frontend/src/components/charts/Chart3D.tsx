import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import * as THREE from 'three';

interface DataPoint {
  x: number;
  y: number;
  z: number;
  value: number;
  label: string;
}

interface Chart3DProps {
  data: DataPoint[];
  width?: number;
  height?: number;
}

const Chart3D: React.FC<Chart3DProps> = ({ 
  data, 
  width = 800, 
  height = 600 
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();

  useEffect(() => {
    if (!mountRef.current) return;

    // Configuración de Three.js
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    mountRef.current.appendChild(renderer.domElement);

    // Escalas D3
    const xScale = d3.scaleLinear()
      .domain(d3.extent(data, d => d.x) as [number, number])
      .range([-10, 10]);
    
    const yScale = d3.scaleLinear()
      .domain(d3.extent(data, d => d.y) as [number, number])
      .range([-10, 10]);
    
    const zScale = d3.scaleLinear()
      .domain(d3.extent(data, d => d.z) as [number, number])
      .range([-10, 10]);

    const colorScale = d3.scaleSequential(d3.interpolateViridis)
      .domain(d3.extent(data, d => d.value) as [number, number]);

    // Crear puntos 3D
    data.forEach(point => {
      const geometry = new THREE.SphereGeometry(0.2, 16, 16);
      const material = new THREE.MeshBasicMaterial({ 
        color: colorScale(point.value) 
      });
      const sphere = new THREE.Mesh(geometry, material);
      
      sphere.position.set(
        xScale(point.x),
        yScale(point.y),
        zScale(point.z)
      );
      
      scene.add(sphere);
    });

    // Ejes de coordenadas
    const axesHelper = new THREE.AxesHelper(15);
    scene.add(axesHelper);

    // Posición de la cámara
    camera.position.set(20, 20, 20);
    camera.lookAt(0, 0, 0);

    // Controles de órbita (opcional)
    const animate = () => {
      requestAnimationFrame(animate);
      
      // Rotación automática suave
      scene.rotation.y += 0.005;
      
      renderer.render(scene, camera);
    };

    animate();

    // Guardar referencias
    sceneRef.current = scene;
    rendererRef.current = renderer;
    cameraRef.current = camera;

    // Cleanup
    return () => {
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [data, width, height]);

  return (
    <div className="glass-panel p-4">
      <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
        Visualización 3D
      </h3>
      <div 
        ref={mountRef} 
        className="w-full flex justify-center"
        style={{ height: `${height}px` }}
      />
      <div className="mt-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
        <p>• Rotación automática activada</p>
        <p>• Colores basados en valores de datos</p>
        <p>• Ejes X, Y, Z representados</p>
      </div>
    </div>
  );
};

export default Chart3D;