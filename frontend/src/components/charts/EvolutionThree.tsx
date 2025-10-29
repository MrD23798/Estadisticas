import React, { useRef, useMemo, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { 
  OrbitControls, 
  Line, 
  Sphere, 
  Html,
  Environment,
  Lightformer
} from '@react-three/drei';
import * as THREE from 'three';
import { motion } from 'framer-motion';

export interface EvolutionData {
  period: string;
  value: number;
  year: string;
  month: string;
}

interface ProcessedData {
  value: number;
  period: string;
  year: number;
  month: number;
  date: Date;
}

interface HoverInfo {
  value: number;
  period: string;
  year: number;
  month: number;
  position: [number, number, number];
}

interface EvolutionThreeProps {
  data: EvolutionData[];
  dependency: string;
  startPeriod: string;
  endPeriod: string;
  year: string;
  objectType?: string;
  loading: boolean;
  width?: number;
  height?: number;
  title?: string;
}

// Componente para una esfera de punto de datos
const DataPoint: React.FC<{
  position: [number, number, number];
  value: number;
  period: string;
  year: number;
  month: number;
  color: string;
  onHover: (info: HoverInfo) => void;
  onLeave: () => void;
}> = ({ position, value, period, year, month, color, onHover, onLeave }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current && hovered) {
      meshRef.current.rotation.y += 0.02;
      meshRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 3) * 0.1);
    }
  });

  const handlePointerOver = () => {
    setHovered(true);
    onHover({ value, period, year, month, position });
  };

  const handlePointerOut = () => {
    setHovered(false);
    onLeave();
  };

  return (
    <>
      <Sphere
        ref={meshRef}
        position={position}
        args={[0.15, 16, 16]}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <meshStandardMaterial 
          color={hovered ? '#ff6b35' : color}
          emissive={hovered ? '#ff3300' : '#000000'}
          emissiveIntensity={hovered ? 0.3 : 0}
          roughness={0.3}
          metalness={0.7}
        />
      </Sphere>
      
      {/* Número del punto */}
      <Html position={[position[0], position[1] + 0.4, position[2]]} center>
        <div className="text-slate-800 dark:text-white text-xs font-bold bg-white dark:bg-black bg-opacity-90 dark:bg-opacity-50 px-2 py-1 rounded shadow-lg border border-slate-200 dark:border-slate-600">
          {value}
        </div>
      </Html>
    </>
  );
};

// Componente para la curva evolutiva con área degradada y animación
const EvolutionCurve: React.FC<{
  points: THREE.Vector3[];
  animated: boolean;
}> = ({ points, animated }) => {
  const areaRef = useRef<THREE.Mesh>(null);
  const [progress, setProgress] = useState(0);

  // Animación de progreso de la línea
  useEffect(() => {
    if (animated) {
      const duration = 2000; // 2 segundos
      const startTime = Date.now();
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const newProgress = Math.min(elapsed / duration, 1);
        setProgress(newProgress);
        
        if (newProgress < 1) {
          requestAnimationFrame(animate);
        }
      };
      
      animate();
    }
  }, [animated]);

  // Crear geometría del área degradada
  const areaGeometry = useMemo(() => {
    if (points.length < 2) return null;

    // Ordenar puntos por X para el área
    const sortedPoints = [...points].sort((a, b) => a.x - b.x);
    const baseY = -2.5; // Base del área que coincide con el eje X
    
    // Crear una geometría más simple para el degradado
    const shape = new THREE.Shape();
    
    // Comenzar desde el primer punto en la base
    shape.moveTo(sortedPoints[0].x, baseY);
    
    // Dibujar línea hasta el primer punto de datos
    shape.lineTo(sortedPoints[0].x, sortedPoints[0].y);
    
    // Dibujar la curva de los datos
    for (let i = 1; i < sortedPoints.length; i++) {
      shape.lineTo(sortedPoints[i].x, sortedPoints[i].y);
    }
    
    // Cerrar la forma bajando al último punto de la base
    shape.lineTo(sortedPoints[sortedPoints.length - 1].x, baseY);
    shape.lineTo(sortedPoints[0].x, baseY);
    
    const geometry = new THREE.ShapeGeometry(shape);
    return geometry;
  }, [points]);

  // Crear puntos animados para la línea
  const animatedPoints = useMemo(() => {
    if (!animated || progress === 0) return [];
    
    const targetCount = Math.floor(points.length * progress);
    return points.slice(0, Math.max(1, targetCount));
  }, [points, progress, animated]);

  return (
    <group>
      {/* Área con azul intermedio */}
      {areaGeometry && (
        <mesh ref={areaRef} geometry={areaGeometry}>
          <meshBasicMaterial
            color="#93c5fd"
            transparent
            opacity={0.6}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
      
      {/* Línea principal animada */}
      {animatedPoints.length > 1 && (
        <Line
          points={animatedPoints}
          color="#3b82f6"
          lineWidth={4}
          dashed={false}
        />
      )}
      
      {/* Punto de progreso */}
      {animated && progress < 1 && animatedPoints.length > 0 && (
        <mesh position={animatedPoints[animatedPoints.length - 1]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      )}
    </group>
  );
};

// Componente para ejes cartesianos
const CartesianAxes: React.FC<{
  xRange: [number, number];
  yRange: [number, number];
  dataPoints: Array<{position: [number, number, number], period: string, month: number, year: number}>;
}> = ({ xRange, yRange, dataPoints }) => {
  return (
    <group>
      {/* Eje X */}
      <Line
        points={[[xRange[0], yRange[0], 0], [xRange[1], yRange[0], 0]]}
        color="#666666"
        lineWidth={2}
      />
      
      {/* Eje Y */}
      <Line
        points={[[xRange[0], yRange[0], 0], [xRange[0], yRange[1], 0]]}
        color="#666666"
        lineWidth={2}
      />
      
      {/* Etiquetas de meses en el eje X */}
      {dataPoints.map((point, index) => {
        const monthNames = ['En', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const monthName = monthNames[point.month - 1] || '';
        
        return (
          <group key={`month-${index}`}>
            {/* Línea vertical para cada mes */}
            <Line
              points={[[point.position[0], yRange[0], 0], [point.position[0], yRange[0] - 0.2, 0]]}
              color="#888888"
              lineWidth={1}
            />
            
            {/* Etiqueta del mes */}
            <Html position={[point.position[0], yRange[0] - 0.5, 0]} center>
              <div className="text-slate-600 dark:text-slate-400 text-xs font-medium transform -rotate-45 origin-center">
                {monthName}
              </div>
            </Html>
          </group>
        );
      })}
      
      {/* Marcas en el eje Y */}
      {Array.from({ length: 5 }, (_, i) => {
        const y = yRange[0] + (yRange[1] - yRange[0]) * (i / 4);
        return (
          <Line
            key={`y-tick-${i}`}
            points={[[xRange[0], y, 0], [xRange[0] - 0.1, y, 0]]}
            color="#888888"
            lineWidth={1}
          />
        );
      })}
    </group>
  );
};

// Componente para mostrar estadísticas 3D flotantes
const Statistics3D: React.FC<{
  data: ProcessedData[];
}> = ({ data }) => {
  // Calcular estadísticas
  const stats = useMemo(() => {
    if (data.length === 0) return { max: 0, min: 0, avg: 0, total: 0 };
    
    const values = data.map(d => d.value);
    const max = Math.max(...values);
    const min = Math.min(...values);
    const total = values.reduce((a, b) => a + b, 0);
    const avg = Math.round(total / values.length);
    
    return { max, min, avg, total };
  }, [data]);

  const StatBox: React.FC<{
    position: [number, number, number];
    color: string;
    emissiveColor: string;
    value: number;
    label: string;
  }> = ({ position, color, emissiveColor, value, label }) => (
    <group position={position}>
      {/* Caja principal */}
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[1.5, 1, 0.3]} />
        <meshStandardMaterial
          color={color}
          emissive={emissiveColor}
          emissiveIntensity={0.2}
          roughness={0.1}
          metalness={0.8}
          transparent
          opacity={0.9}
        />
      </mesh>
      
      {/* Brillo interior */}
      <mesh position={[0, 0.5, 0.1]}>
        <boxGeometry args={[1.3, 0.8, 0.1]} />
        <meshBasicMaterial
          color={emissiveColor}
          transparent
          opacity={0.3}
        />
      </mesh>

      {/* Tooltip HTML */}
      <Html 
        position={[0, 1.2, 0]} 
        center
        occlude
        transform
        sprite
      >
        <div className="bg-black bg-opacity-90 text-white p-2 rounded-lg shadow-xl border" 
             style={{ borderColor: color, minWidth: '120px' }}>
          <div className="text-xs font-bold text-center" style={{ color: color }}>
            {label}
          </div>
          <div className="text-lg font-bold text-center text-white">
            {value.toLocaleString()}
          </div>
        </div>
      </Html>
    </group>
  );

  return (
    <group position={[0, 4, -2]}>
      {/* Máximo */}
      <StatBox
        position={[-4.5, 0, 0]}
        color="#3b82f6"
        emissiveColor="#1e40af"
        value={stats.max}
        label="Máximo"
      />

      {/* Mínimo */}
      <StatBox
        position={[-1.5, 0, 0]}
        color="#10b981"
        emissiveColor="#059669"
        value={stats.min}
        label="Mínimo"
      />

      {/* Promedio */}
      <StatBox
        position={[1.5, 0, 0]}
        color="#8b5cf6"
        emissiveColor="#7c3aed"
        value={stats.avg}
        label="Promedio"
      />

      {/* Total */}
      <StatBox
        position={[4.5, 0, 0]}
        color="#f59e0b"
        emissiveColor="#d97706"
        value={stats.total}
        label="Total"
      />
    </group>
  );
};

// Componente principal de la escena 3D
const Scene: React.FC<{
  processedData: ProcessedData[];
  dependency: string;
  startPeriod: string;
  endPeriod: string;
  year: string;
  objectType: string;
  title?: string;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
}> = ({ processedData, dependency, startPeriod, endPeriod, year, objectType, title }) => {
  const [hoveredInfo, setHoveredInfo] = useState<HoverInfo | null>(null);
  const [animated, setAnimated] = useState(false);

  // Generar puntos 3D
  const points3D = useMemo(() => {
    if (processedData.length === 0) return [];

    const maxValue = Math.max(...processedData.map(d => d.value));
    const minValue = Math.min(...processedData.map(d => d.value));
    
    const colorScale = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];
    
    return processedData.map((d, i) => {
      const x = (i - (processedData.length - 1) / 2) * 1.5; // Espaciado horizontal
      const y = ((d.value - minValue) / (maxValue - minValue)) * 4 - 2; // Altura basada en valor
      const z = 0; // Línea recta sin variación en profundidad
      
      return {
        position: [x, y, z] as [number, number, number],
        ...d,
        color: colorScale[i % colorScale.length]
      };
    });
  }, [processedData]);

  // Activar animación después de un delay
  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  const curvePoints = useMemo(() => {
    return points3D.map(p => new THREE.Vector3(...p.position));
  }, [points3D]);

  // Calcular rangos para los ejes cartesianos
  const axesRanges = useMemo(() => {
    if (points3D.length === 0) return { xRange: [-5, 5], yRange: [-2, 2] };
    
    const xValues = points3D.map(p => p.position[0]);
    const yValues = points3D.map(p => p.position[1]);
    
    const xMin = Math.min(...xValues) - 1;
    const xMax = Math.max(...xValues) + 1;
    const yMin = -2.5;
    const yMax = Math.max(...yValues) + 1;
    
    return {
      xRange: [xMin, xMax] as [number, number],
      yRange: [yMin, yMax] as [number, number]
    };
  }, [points3D]);

  return (
    <>
      {/* Iluminación */}
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <spotLight
        position={[0, 15, 0]}
        angle={0.3}
        penumbra={1}
        intensity={1}
        castShadow
      />

      {/* Ejes cartesianos */}
      <CartesianAxes 
        xRange={axesRanges.xRange as [number, number]} 
        yRange={axesRanges.yRange as [number, number]}
        dataPoints={points3D}
      />

      {/* Curva evolutiva */}
      {curvePoints.length > 1 && animated && (
        <EvolutionCurve points={curvePoints} animated={animated} />
      )}

      {/* Puntos de datos */}
      {points3D.map((point, index) => (
        <DataPoint
          key={index}
          position={point.position}
          value={point.value}
          period={point.period}
          year={point.year}
          month={point.month}
          color={point.color}
          onHover={setHoveredInfo}
          onLeave={() => setHoveredInfo(null)}
        />
      ))}

      {/* Estadísticas 3D flotantes */}
      <Statistics3D data={processedData} />

      {/* Títulos removidos temporalmente por incompatibilidad con Text */}

      {/* Tooltip flotante */}
      {hoveredInfo && (
        <Html position={hoveredInfo.position} center>
          <div className="bg-black bg-opacity-90 text-white p-3 rounded-lg shadow-xl border border-blue-500">
            <div className="text-sm font-bold">{hoveredInfo.month}/{hoveredInfo.year}</div>
            <div className="text-blue-400 font-bold">Valor: {hoveredInfo.value}</div>
            <div className="text-xs text-gray-300">{hoveredInfo.period}</div>
          </div>
        </Html>
      )}

      {/* Controles de cámara */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={5}
        maxDistance={20}
        autoRotate={false}
        autoRotateSpeed={0.5}
      />
    </>
  );
};

// Componente de carga
const LoadingScene: React.FC = () => (
  <>
    <ambientLight intensity={0.4} />
    <pointLight position={[10, 10, 10]} />
    
    <Sphere position={[0, 0, 0]} args={[1, 32, 32]}>
      <meshStandardMaterial color="#3b82f6" wireframe />
    </Sphere>
    
    {/* Texto removido temporalmente por incompatibilidad */}
    
    <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={2} />
  </>
);

const EvolutionThree: React.FC<EvolutionThreeProps> = ({
  data,
  dependency,
  startPeriod,
  endPeriod,
  year,
  objectType = 'TODOS',
  loading,
  width = 1200,
  height = 600,
  title
}) => {
  // Procesar datos para 3D
  const processedData = useMemo(() => {
    console.log('🔍 EvolutionThree - Datos recibidos:', data);
    
    const monthMap: { [key: string]: number } = {
      'Enero': 1, 'Febrero': 2, 'Marzo': 3, 'Abril': 4,
      'Mayo': 5, 'Junio': 6, 'Julio': 7, 'Agosto': 8,
      'Septiembre': 9, 'Octubre': 10, 'Noviembre': 11, 'Diciembre': 12
    };
    
    return data
      .filter(d => {
        const hasValidValue = d.value !== undefined && d.value !== null && !isNaN(d.value);
        const yearNum = typeof d.year === 'string' ? parseInt(d.year) : d.year;
        const hasValidYear = !isNaN(yearNum) && yearNum > 2000 && yearNum < 2030;
        
        let monthNum: number;
        if (typeof d.month === 'string') {
          monthNum = monthMap[d.month] || 0;
        } else {
          monthNum = d.month || 0;
        }
        const hasValidMonth = monthNum >= 1 && monthNum <= 12;
        
        return hasValidValue && hasValidYear && hasValidMonth;
      })
      .map(d => {
        const yearNum = typeof d.year === 'string' ? parseInt(d.year) : d.year;
        const monthNum = typeof d.month === 'string' ? monthMap[d.month] : d.month;
        
        return {
          ...d,
          year: yearNum,
          month: monthNum,
          date: new Date(yearNum, monthNum - 1)
        };
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [data]);

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <motion.div
          animate={{ 
            rotate: 360,
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            rotate: { duration: 1.5, repeat: Infinity, ease: "linear" },
            scale: { duration: 1, repeat: Infinity, ease: "easeInOut" }
          }}
          className="w-16 h-16 border-4 border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent rounded-full"
        />
        <p className="ml-4 text-slate-300">Cargando evolución 3D con Three.js...</p>
      </div>
    );
  }

  if (processedData.length === 0) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="text-center">
          <div className="text-slate-400 text-6xl mb-4">📈</div>
          <p className="text-slate-300 text-lg font-medium">No hay datos de evolución disponibles</p>
          <p className="text-slate-400 text-sm mt-2">
            Verifica que existan datos para el período y dependencia seleccionados
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="w-full bg-transparent rounded-lg overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{ width, height }}
    >
      <Canvas
        camera={{ position: [8, 5, 8], fov: 60 }}
        style={{ width: '100%', height: '100%', background: 'transparent' }}
        shadows
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={<LoadingScene />}> 
          <Scene 
            processedData={processedData}
            dependency={dependency}
            startPeriod={startPeriod}
            endPeriod={endPeriod}
            year={year}
            objectType={objectType}
            title={title}
          />
          {/* Reemplazamos el preset remoto por un entorno procedimental local para evitar 429 */}
          <Environment background={false} resolution={256}> 
            <Lightformer intensity={1.2} color="#ffffff" position={[0, 5, -10]} scale={10} />
            <Lightformer intensity={0.7} color="#ffddaa" position={[-5, 2, 2]} scale={5} />
            <Lightformer intensity={0.7} color="#aaccff" position={[5, 2, -2]} scale={5} />
          </Environment>
        </Suspense>
      </Canvas>
      
      <div className="text-center text-white p-2 text-xs bg-black bg-opacity-50">
        🎮 Arrastra para rotar • 🔍 Rueda para zoom • 🖱️ Pasa el cursor sobre los puntos
      </div>
    </motion.div>
  );
};

export default EvolutionThree;