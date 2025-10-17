import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as d3 from 'd3';
import { motion } from 'framer-motion';

export interface EvolutionData {
  period: string;
  value: number;
  year: string;
  month: string;
}

interface ProcessedBarData {
  id: string;
  height: number;
  period: string;
  value: number;
  position: Point3D;
  color: string;
  vertices: Point3D[];
}

interface Point3D {
  x: number;
  y: number;
  z: number;
}

interface EvolutionChart3DProps {
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

const EvolutionChart3D: React.FC<EvolutionChart3DProps> = ({
  data,
  dependency,
  startPeriod,
  endPeriod,
  year,
  objectType = 'TODOS',
  loading,
  width = 1200,
  height = 600,
  title = "Evolución Temporal 3D"
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [rotation, setRotation] = useState({ alpha: Math.PI / 8, beta: -Math.PI / 4 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Configuración del gráfico 3D
  const config = useMemo(() => ({
    origin: { x: width / 2, y: height / 2 },
    scale: 50,
    barWidth: 30,
    barDepth: 20,
    maxHeight: 200
  }), [width, height]);

  // Función para proyectar coordenadas 3D a 2D
  const project3DTo2D = useCallback((point: Point3D, alpha: number, beta: number): Point3D => {
    // Rotaciones
    const cosA = Math.cos(alpha);
    const sinA = Math.sin(alpha);
    const cosB = Math.cos(beta);
    const sinB = Math.sin(beta);

    // Aplicar rotación Y (beta)
    const x1 = point.x * cosB + point.z * sinB;
    const z1 = -point.x * sinB + point.z * cosB;

    // Aplicar rotación X (alpha)
    const y2 = point.y * cosA - z1 * sinA;
    const z2 = point.y * sinA + z1 * cosA;

    return {
      x: config.origin.x + config.scale * x1,
      y: config.origin.y + config.scale * y2,
      z: z2
    };
  }, [config]);

  // Función para crear una barra 3D
  const createBar = useCallback((height: number, x: number, z: number): Point3D[] => {
    const w = config.barWidth / config.scale;
    const d = config.barDepth / config.scale;
    
    return [
      // Base (y = 0)
      { x: x - w/2, y: 0, z: z - d/2 }, // 0 - front left bottom
      { x: x + w/2, y: 0, z: z - d/2 }, // 1 - front right bottom
      { x: x + w/2, y: 0, z: z + d/2 }, // 2 - back right bottom
      { x: x - w/2, y: 0, z: z + d/2 }, // 3 - back left bottom
      // Top (y = height)
      { x: x - w/2, y: -height, z: z - d/2 }, // 4 - front left top
      { x: x + w/2, y: -height, z: z - d/2 }, // 5 - front right top
      { x: x + w/2, y: -height, z: z + d/2 }, // 6 - back right top
      { x: x - w/2, y: -height, z: z + d/2 }, // 7 - back left top
    ];
  }, [config]);

  // Procesar datos para crear las barras 3D
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    // Ordenar datos por período
    const sortedData = [...data].sort((a, b) => {
      const periodA = parseInt(a.period);
      const periodB = parseInt(b.period);
      return periodA - periodB;
    });

    const maxValue = d3.max(sortedData, d => d.value) || 1;
    const barSpacing = 4;

    return sortedData.map((item, index) => {
      const normalizedHeight = (item.value / maxValue) * (config.maxHeight / config.scale);
      const x = (index - sortedData.length / 2) * barSpacing;
      const z = 0;

      const vertices = createBar(normalizedHeight, x, z);
      
      // Color basado en el valor (gradiente temporal)
      const colorScale = d3.scaleSequential(d3.interpolateViridis)
        .domain([0, sortedData.length - 1]);

      return {
        id: `bar-${index}`,
        height: normalizedHeight,
        period: item.period,
        value: item.value,
        position: { x, y: -normalizedHeight / 2, z },
        color: colorScale(index),
        vertices
      };
    });
  }, [data, config, createBar]);

  // Manejadores de eventos del mouse
  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: event.clientX, y: event.clientY });
  }, []);

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (isDragging) {
      const deltaX = event.clientX - dragStart.x;
      const deltaY = event.clientY - dragStart.y;
      
      setRotation(prev => ({
        beta: prev.beta + deltaX * (Math.PI / 230),
        alpha: prev.alpha - deltaY * (Math.PI / 230)
      }));
      
      setDragStart({ x: event.clientX, y: event.clientY });
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Función memoizada para renderizar una cara de la barra
  const renderBarFace = useCallback((vertices: Point3D[], faceIndices: number[], color: string, opacity = 1) => {
    const projectedVertices = faceIndices.map(i => 
      project3DTo2D(vertices[i], rotation.alpha, rotation.beta)
    );
    
    const path = `M${projectedVertices[0].x},${projectedVertices[0].y} ${
      projectedVertices.slice(1).map(p => `L${p.x},${p.y}`).join(' ')
    } Z`;

    return { path, color, opacity };
  }, [rotation.alpha, rotation.beta, project3DTo2D]);

  // Renderizar con D3
  useEffect(() => {
    if (!svgRef.current || processedData.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Crear todas las caras de todas las barras
    const allFaces: Array<{
      path: string;
      color: string;
      opacity: number;
      z: number;
      barIndex: number;
      faceName: string;
      barData: ProcessedBarData;
    }> = [];

    processedData.forEach((bar, barIndex) => {
      const { vertices, color } = bar;

      // Definir las caras de la barra (cada cara es un conjunto de 4 vértices)
      const faces = [
        { indices: [0, 1, 5, 4], name: 'front' },
        { indices: [1, 2, 6, 5], name: 'right' },
        { indices: [2, 3, 7, 6], name: 'back' },
        { indices: [3, 0, 4, 7], name: 'left' },
        { indices: [4, 5, 6, 7], name: 'top' },
        { indices: [0, 3, 2, 1], name: 'bottom' }
      ];

      faces.forEach(face => {
        const faceData = renderBarFace(
          vertices, 
          face.indices, 
          color, 
          face.name === 'top' ? 1 : 0.7
        );
        
        // Calcular Z promedio para ordenamiento
        const avgZ = face.indices.reduce((sum, idx) => {
          const projected = project3DTo2D(vertices[idx], rotation.alpha, rotation.beta);
          return sum + projected.z;
        }, 0) / face.indices.length;

        allFaces.push({
          ...faceData,
          z: avgZ,
          barIndex,
          faceName: face.name,
          barData: bar
        });
      });
    });

    // Ordenar caras por profundidad Z (de atrás hacia adelante)
    allFaces.sort((a, b) => b.z - a.z);

    // Renderizar caras
    svg.selectAll("path.bar-face")
      .data(allFaces)
      .enter()
      .append("path")
      .attr("class", "bar-face")
      .attr("d", d => d.path)
      .attr("fill", d => d.color)
      .attr("opacity", d => d.opacity)
      .attr("stroke", "#333")
      .attr("stroke-width", 0.5)
      .style("cursor", "pointer")
      .on("mouseover", function(event, d) {
        d3.select(this).attr("opacity", 1);
        
        // Tooltip
        const tooltip = d3.select("body").append("div")
          .attr("class", "tooltip")
          .style("position", "absolute")
          .style("background", "rgba(0,0,0,0.8)")
          .style("color", "white")
          .style("padding", "8px")
          .style("border-radius", "4px")
          .style("font-size", "12px")
          .style("pointer-events", "none")
          .style("opacity", 0);

        tooltip.transition().duration(200).style("opacity", 1);
        tooltip.html(`
          <strong>Período:</strong> ${d.barData.period}<br/>
          <strong>Valor:</strong> ${d.barData.value.toLocaleString()}<br/>
          <strong>Cara:</strong> ${d.faceName}
        `)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", function(_, d) {
        d3.select(this).attr("opacity", d.opacity);
        d3.selectAll(".tooltip").remove();
      });

    // Agregar etiquetas para los períodos
    const labelGroup = svg.append("g").attr("class", "period-labels");
    
    processedData.forEach((bar) => {
      const labelPos = project3DTo2D(
        { x: bar.position.x, y: 0.5, z: bar.position.z }, 
        rotation.alpha, 
        rotation.beta
      );

      labelGroup.append("text")
        .attr("x", labelPos.x)
        .attr("y", labelPos.y)
        .attr("text-anchor", "middle")
        .attr("font-size", "10px")
        .attr("font-weight", "bold")
        .attr("fill", "#333")
        .text(bar.period);

      // Valor en la parte superior
      const valuePos = project3DTo2D(
        { x: bar.position.x, y: -bar.height - 0.5, z: bar.position.z }, 
        rotation.alpha, 
        rotation.beta
      );

      labelGroup.append("text")
        .attr("x", valuePos.x)
        .attr("y", valuePos.y)
        .attr("text-anchor", "middle")
        .attr("font-size", "9px")
        .attr("font-weight", "bold")
        .attr("fill", "#666")
        .text(bar.value.toLocaleString());
    });

  }, [processedData, rotation, project3DTo2D, renderBarFace]);

  // Función para reiniciar vista
  const resetView = () => {
    setRotation({ alpha: Math.PI / 8, beta: -Math.PI / 4 });
  };

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
        <p className="ml-4 text-slate-300">Cargando evolución temporal...</p>
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
            Selecciona un rango de períodos válido
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-xl font-bold text-gray-800 dark:text-slate-200 mb-2">
          {title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-slate-400">
          {dependency} - {startPeriod} a {endPeriod} de {year}
          {objectType !== 'TODOS' && ` - ${objectType}`}
        </p>
      </div>

      {/* Botón reiniciar vista */}
      <div className="absolute top-6 right-6 z-20">
        <button
          onClick={resetView}
          className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-all duration-300"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Reiniciar Vista
        </button>
      </div>

      {/* Gráfico 3D */}
      <div className="relative w-full" style={{ height: `${height}px` }}>
        <svg
          ref={svgRef}
          width={width}
          height={height}
          className="w-full h-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-lg border border-slate-200 dark:border-slate-700"
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
        
        {/* Información del gráfico */}
        <div className="absolute bottom-2 left-2 text-xs text-slate-600 dark:text-slate-400 bg-white/90 dark:bg-slate-800/90 px-2 py-1 rounded backdrop-blur-sm border border-slate-200 dark:border-slate-600">
          <p className="font-medium">📊 {processedData.length} períodos | 🖱️ Arrastra para rotar</p>
        </div>

        {/* Indicador 3D */}
        <div className="absolute bottom-2 right-2 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-1 rounded">
          3D
        </div>
      </div>
    </div>
  );
};

export default EvolutionChart3D;