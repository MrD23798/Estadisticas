import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import * as d3 from 'd3';

interface ChartData {
  objectType: string;
  count: number;
}

interface Chart3DViewProps {
  data: ChartData[];
  width?: number;
  height?: number;
}

const Chart3DView: React.FC<Chart3DViewProps> = ({ 
  data, 
  width = 800, 
  height = 400 
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const animationRef = useRef<number>();

  useEffect(() => {
    console.log('Chart3DView useEffect iniciado');
    console.log('mountRef.current:', mountRef.current);
    console.log('data:', data);
    
    if (!mountRef.current) {
      console.log('No hay mountRef.current');
      return;
    }
    
    if (!data || data.length === 0) {
      console.log('No hay datos');
      return;
    }

    console.log('Iniciando renderizado 3D...');

    // Limpiar renderizado anterior
    if (rendererRef.current && mountRef.current.contains(rendererRef.current.domElement)) {
      mountRef.current.removeChild(rendererRef.current.domElement);
    }

    try {
      // Configuración de Three.js
      console.log('Creando scene...');
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0xf0f0f0);

      console.log('Creando camera...');
      const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
      
      console.log('Creando renderer...');
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      
      renderer.setSize(width, height);
      console.log('Agregando renderer al DOM...');
      mountRef.current.appendChild(renderer.domElement);

      // Crear un cubo simple para probar
      console.log('Creando geometría de prueba...');
      const geometry = new THREE.BoxGeometry(2, 2, 2);
      const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
      const cube = new THREE.Mesh(geometry, material);
      scene.add(cube);

      // Posicionar cámara
      camera.position.z = 5;

      // Animación simple
       const animate = () => {
         animationRef.current = requestAnimationFrame(animate);
         
         // Rotar el cubo
         cube.rotation.x += 0.01;
         cube.rotation.y += 0.01;
         
         renderer.render(scene, camera);
       };

       animate();

       // Guardar referencias
       sceneRef.current = scene;
       rendererRef.current = renderer;
       cameraRef.current = camera;

       console.log('Renderizado 3D completado exitosamente!');

       // Cleanup
       return () => {
         console.log('Limpiando componente 3D...');
         if (animationRef.current) {
           cancelAnimationFrame(animationRef.current);
         }
         if (rendererRef.current && mountRef.current?.contains(rendererRef.current.domElement)) {
           mountRef.current.removeChild(rendererRef.current.domElement);
         }
         renderer.dispose();
       };

     } catch (error) {
       console.error('Error en Chart3DView:', error);
     }
  }, [data, width, height]);

  return (
    <div 
      ref={mountRef} 
      className="w-full flex flex-col justify-center items-center bg-blue-100 rounded-lg border-4 border-blue-500"
      style={{ height: `${height}px` }}
    >
      <div className="text-blue-800 font-bold text-xl mb-4">
        VISTA 3D ACTIVA - CUBO ROTANDO
      </div>
    </div>
  );
};

export default Chart3DView;