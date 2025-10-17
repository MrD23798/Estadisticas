import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import * as d3 from 'd3';

// Tipos para el componente de cubos 3D
interface Point3D {
  x: number;
  y: number;
  z: number;
}

interface CubeFace {
  face: string;
  vertices: Point3D[];
  projected: Point3D[];
  centroid: Point3D;
  cubeId: string;
  path: string;
  cube: CubeData;
}

interface CubeData {
  id: string;
  height: number;
  faces: CubeFace[];
  dependency: string;
  total: number;
}

interface StatisticsData {
  Dependencia: string;
  Codigo: string;
  CodObjeto: string;
  Naturaleza: string;
  Objeto: string;
  Período: string;
  Cantidad: number;
  'Objeto-Desc - Tipo_Expte': string;
}

// Adaptador para convertir DependencyData a StatisticsData
interface DependencyData {
  category: string;
  value: number;
}

interface CubeChart3DProps {
  data: StatisticsData[] | DependencyData[];
  width?: number;
  height?: number;
  title?: string;
  selectedObjectType?: string;
}

const CubeChart3D: React.FC<CubeChart3DProps> = ({ 
  data, 
  width = 960, 
  height = 500,
  title = "Visualización 3D de Estadísticas Judiciales",
  selectedObjectType = 'TODOS'
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [rotation, setRotation] = useState({ alpha: Math.PI / 6, beta: -Math.PI / 6 }); // Vista corregida con Y invertido
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Configuración del gráfico 3D - usando useMemo para evitar recreación
  const config = useMemo(() => ({
    origin: { x: width / 2, y: height / 2 },
    scale: 40, // Aumentado para hacer los cubos más grandes
    j: 6 // Aumentado para tener más espacio en el grid
  }), [width, height]);

  // Función para crear un cubo 3D
  const makeCube = useCallback((h: number, x: number, z: number): Point3D[] => {
    const size = 1.5; // Reducido para evitar superposición
    return [
      { x: x - size, y: 0, z: z + size }, // FRONT TOP LEFT (invertido)
      { x: x - size, y: -h, z: z + size }, // FRONT BOTTOM LEFT (invertido)
      { x: x + size, y: -h, z: z + size }, // FRONT BOTTOM RIGHT (invertido)
      { x: x + size, y: 0, z: z + size }, // FRONT TOP RIGHT (invertido)
      { x: x - size, y: 0, z: z - size }, // BACK  TOP LEFT (invertido)
      { x: x - size, y: -h, z: z - size }, // BACK  BOTTOM LEFT (invertido)
      { x: x + size, y: -h, z: z - size }, // BACK  BOTTOM RIGHT (invertido)
      { x: x + size, y: 0, z: z - size }, // BACK  TOP RIGHT (invertido)
    ];
  }, []);

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

  // Función para crear las caras de un cubo
  const createCubeFaces = useCallback((vertices: Point3D[], cubeId: string, cubeData: CubeData): CubeFace[] => {
    const faces = [
      { face: 'front', vertices: [vertices[0], vertices[1], vertices[2], vertices[3]] },
      { face: 'back', vertices: [vertices[4], vertices[7], vertices[6], vertices[5]] },
      { face: 'left', vertices: [vertices[4], vertices[5], vertices[1], vertices[0]] },
      { face: 'right', vertices: [vertices[3], vertices[2], vertices[6], vertices[7]] },
      { face: 'top', vertices: [vertices[0], vertices[3], vertices[7], vertices[4]] },
      { face: 'bottom', vertices: [vertices[1], vertices[5], vertices[6], vertices[2]] }
    ];

    return faces.map(face => {
      const projected = face.vertices.map(v => project3DTo2D(v, rotation.alpha, rotation.beta));
      
      // Calcular centroide para ordenamiento Z
      const centroid: Point3D = {
        x: projected.reduce((sum, p) => sum + p.x, 0) / projected.length,
        y: projected.reduce((sum, p) => sum + p.y, 0) / projected.length,
        z: projected.reduce((sum, p) => sum + p.z, 0) / projected.length
      };

      return {
        face: face.face,
        vertices: face.vertices,
        projected,
        centroid,
        cubeId,
        path: `M${projected[0].x},${projected[0].y} ${projected.map(p => `L${p.x},${p.y}`).join(' ')} Z`,
        cube: cubeData
      };
    });
  }, [project3DTo2D, rotation]);

  // Función helper para determinar si es DependencyData o StatisticsData
  const isDependencyData = (data: StatisticsData[] | DependencyData[]): data is DependencyData[] => {
    return data.length > 0 && 'category' in data[0];
  };

  // Función para normalizar los datos a un formato común
  const normalizeData = useCallback((rawData: StatisticsData[] | DependencyData[]) => {
    if (isDependencyData(rawData)) {
      // Convertir DependencyData a formato agregado
      return rawData.map((item) => ({
        dependency: item.category,
        total: item.value,
        count: 1
      }));
    } else {
      // Procesar StatisticsData
      let filteredData = rawData;
      if (selectedObjectType && selectedObjectType !== 'TODOS') {
        filteredData = rawData.filter(d => d.Objeto === selectedObjectType);
      }

      // Agrupar por dependencia y obtener totales
      const groupedData = d3.group(filteredData, d => d.Dependencia);
      return Array.from(groupedData, ([dependency, values]) => ({
        dependency,
        total: d3.sum(values, d => d.Cantidad),
        count: values.length
      }));
    }
  }, [selectedObjectType]);

  // Procesar datos y crear cubos
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const aggregatedData = normalizeData(data);

    // Tomar las primeras dependencias para crear la grilla de cubos
    const maxCubes = Math.min(aggregatedData.length, 9); // Máximo 9 cubos (3x3)
    const cubesData: CubeData[] = [];
    let cnt = 0;

    // Calcular posiciones en una grilla 3x3 con mejor espaciado
    const gridSize = Math.ceil(Math.sqrt(maxCubes));
    const spacing = 8; // Espaciado mayor para evitar superposición
    const centerOffset = (gridSize - 1) * spacing / 2;

    for (let row = 0; row < gridSize && cnt < maxCubes; row++) {
      for (let col = 0; col < gridSize && cnt < maxCubes; col++) {
        const dataPoint = aggregatedData[cnt];
        if (dataPoint) {
          // Posiciones en grilla centrada
          const x = col * spacing - centerOffset;
          const z = row * spacing - centerOffset;
          
          // Normalizar altura basada en el total de casos
          const maxTotal = d3.max(aggregatedData, d => d.total) || 1;
          const normalizedHeight = (dataPoint.total / maxTotal) * 5 + 1; // Altura entre 1 y 6
          
          const cubeData: CubeData = {
            id: `cube-${cnt}`,
            height: normalizedHeight,
            faces: [], // Se llenará después
            dependency: dataPoint.dependency,
            total: dataPoint.total
          };

          const cubeVertices = makeCube(normalizedHeight, x, z);
          const faces = createCubeFaces(cubeVertices, cubeData.id, cubeData);
          cubeData.faces = faces;
          
          cubesData.push(cubeData);
          cnt++;
        }
      }
    }

    return cubesData;
  }, [data, makeCube, createCubeFaces, normalizeData]);

  // Escalas de color
  const heightColorScale = d3.scaleSequential(d3.interpolateViridis)
    .domain(d3.extent(processedData, d => d.height) as [number, number]);

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

  // Renderizar cubos con D3
  useEffect(() => {
    if (!svgRef.current || processedData.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Crear gradientes
    const defs = svg.append("defs");
    
    processedData.forEach((cube) => {
      const gradient = defs.append("linearGradient")
        .attr("id", `gradient-${cube.id}`)
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "100%");
      
      const baseColor = heightColorScale(cube.height);
      gradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", d3.color(baseColor)?.brighter(0.5)?.toString() || baseColor);
      
      gradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", d3.color(baseColor)?.darker(0.3)?.toString() || baseColor);
    });

    // Crear grupo principal
    const cubesGroup = svg.append("g").attr("class", "cubes");

    // Aplanar todas las caras y ordenar por profundidad Z
    const allFaces = processedData.flatMap(cube => cube.faces);
    
    allFaces.sort((a, b) => b.centroid.z - a.centroid.z);

    // Renderizar caras
    cubesGroup.selectAll("path.face")
      .data(allFaces)
      .enter()
      .append("path")
      .attr("class", "face")
      .attr("d", d => d.path)
      .attr("fill", d => `url(#gradient-${d.cubeId})`)
      .attr("stroke", d => d3.color(heightColorScale(d.cube.height))?.darker(1)?.toString() || '#000')
      .attr("stroke-width", 2) // Aumentado de 1 a 2 para bordes más visibles
      .attr("fill-opacity", 0.9) // Aumentado de 0.8 a 0.9 para colores más sólidos
      .style("cursor", "pointer")
      .on("mouseover", function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("fill-opacity", 1)
          .attr("stroke-width", 3);
      })
      .on("mouseout", function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("fill-opacity", 0.9)
          .attr("stroke-width", 2);
      })
      .append("title")
      .text(d => `${d.cube.dependency}\nCasos: ${d.cube.total}\nCara: ${d.face}`);

    // Renderizar etiquetas de texto en la cara superior (números)
    const topFaces = allFaces.filter(face => face.face === 'top');
    
    cubesGroup.selectAll("text.label")
      .data(topFaces)
      .enter()
      .append("text")
      .attr("class", "label")
      .attr("x", d => d.centroid.x)
      .attr("y", d => d.centroid.y)
      .attr("text-anchor", "middle")
      .attr("dy", "-0.3em")
      .attr("font-family", "system-ui, sans-serif")
      .attr("font-weight", "bold")
      .attr("font-size", "14px")
      .attr("fill", "white")
      .attr("stroke", "black")
      .attr("stroke-width", 0.8)
      .text(d => d.cube.total.toString())
      .style("pointer-events", "none");

    // Renderizar etiquetas arriba de cada cubo (rotan con los cubos)
    const labelsGroup = svg.append("g").attr("class", "cube-top-labels");
    
    topFaces.forEach((face, index) => {
      const cubeCenter = { x: face.centroid.x, y: face.centroid.y };
      
      // Posición de la etiqueta: más alejada arriba del cubo
      const labelX = cubeCenter.x;
      const labelY = cubeCenter.y - 80; // Aumentado de 40 a 80px arriba del centro del cubo
      
      // Crear grupo para cada etiqueta
      const labelGroup = labelsGroup.append("g")
        .attr("class", `cube-label-${index}`);
      
      // Fondo de la etiqueta
      const dependencyName = face.cube.dependency;
      const lineCount = Math.ceil(dependencyName.length / 16);
      const labelWidth = Math.max(dependencyName.length * 6 + 20, 100);
      const labelHeight = Math.max(lineCount * 14 + 16, 32);
      
      labelGroup.append("rect")
        .attr("x", labelX - labelWidth / 2)
        .attr("y", labelY - labelHeight / 2)
        .attr("width", labelWidth)
        .attr("height", labelHeight)
        .attr("fill", "rgba(255, 255, 255, 0.95)")
        .attr("stroke", "#cbd5e1")
        .attr("stroke-width", 1)
        .attr("rx", 6)
        .attr("ry", 6)
        .attr("filter", "drop-shadow(0 2px 6px rgba(0,0,0,0.15))")
        .style("backdrop-filter", "blur(4px)");
      
      // Texto de la dependencia
      const textElement = labelGroup.append("text")
        .attr("x", labelX)
        .attr("y", labelY - lineCount * 7 + 8)
        .attr("text-anchor", "middle")
        .attr("font-family", "system-ui, sans-serif")
        .attr("font-weight", "600")
        .attr("font-size", "11px")
        .attr("fill", "#1e293b");
      
      // Dividir texto en líneas si es muy largo
      const words = dependencyName.split(' ');
      let line = '';
      let lineNumber = 0;
      const maxCharsPerLine = 16;
      
      words.forEach((word) => {
        const testLine = line + word + ' ';
        if (testLine.length > maxCharsPerLine && line !== '') {
          textElement.append('tspan')
            .attr('x', labelX)
            .attr('dy', lineNumber === 0 ? 0 : 14)
            .text(line.trim());
          line = word + ' ';
          lineNumber++;
        } else {
          line = testLine;
        }
      });
      
      if (line.trim() !== '') {
        textElement.append('tspan')
          .attr('x', labelX)
          .attr('dy', lineNumber === 0 ? 0 : 14)
          .text(line.trim());
      }
      
      // Badge con el número en la esquina superior derecha
      const badgeX = labelX + labelWidth / 2 - 8;
      const badgeY = labelY - labelHeight / 2 + 8;
      
      labelGroup.append("circle")
        .attr("cx", badgeX)
        .attr("cy", badgeY)
        .attr("r", 12)
        .attr("fill", "#3b82f6")
        .attr("stroke", "white")
        .attr("stroke-width", 2);
      
      labelGroup.append("text")
        .attr("x", badgeX)
        .attr("y", badgeY + 3)
        .attr("text-anchor", "middle")
        .attr("font-family", "system-ui, sans-serif")
        .attr("font-weight", "700")
        .attr("font-size", "10px")
        .attr("fill", "white")
        .text(face.cube.total.toString());
      
      // Línea conectora sutil (opcional)
      labelGroup.append("line")
        .attr("x1", labelX)
        .attr("y1", labelY + labelHeight / 2)
        .attr("x2", cubeCenter.x)
        .attr("y2", cubeCenter.y - 10)
        .attr("stroke", "#94a3b8")
        .attr("stroke-width", 1)
        .attr("opacity", 0.4);
    });

  }, [processedData, heightColorScale, height, width, project3DTo2D]);

  // Botón para regenerar datos
  const handleRegenerate = () => {
    setRotation({ alpha: Math.PI / 6, beta: -Math.PI / 6 }); // Vista isométrica final optimizada
  };

  return (
    <div className="glass-panel p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          {title}
        </h3>
        <button
          onClick={handleRegenerate}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
        >
          Reiniciar Vista
        </button>
      </div>
      
      <div className="relative w-full" style={{ height: `${height - 60}px` }}>
        <svg
          ref={svgRef}
          width={width}
          height={height - 60}
          className="w-full h-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-lg border border-slate-200 dark:border-slate-700"
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
        
        <div className="absolute bottom-4 left-4 text-sm text-slate-600 dark:text-slate-400 bg-white/90 dark:bg-slate-800/90 px-4 py-3 rounded-lg backdrop-blur-sm border border-slate-200 dark:border-slate-600">
          <p className="font-semibold">📊 {processedData.length} dependencias visualizadas</p>
          <p>🖱️ <strong>Arrastra</strong> para rotar cubos | �️ <strong>Etiquetas fijas</strong></p>
          {selectedObjectType !== 'TODOS' && (
            <p>🔍 <strong>Filtrado por:</strong> {selectedObjectType}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CubeChart3D;