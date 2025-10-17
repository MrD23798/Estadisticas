import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as d3 from 'd3';
import { motion } from 'framer-motion';

export interface EvolutionData {
  period: string;
  value: number;
  year: string;
  month: string;
}

interface Point3D {
  x: number;
  y: number;
  z: number;
}

interface Point2D {
  x: number;
  y: number;
}

interface EvolutionLine3DProps {
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

const EvolutionLine3D: React.FC<EvolutionLine3DProps> = ({
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
  const svgRef = useRef<SVGSVGElement>(null);
  const [rotation, setRotation] = useState({ alpha: 0.3, beta: 0.8 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [animationPhase, setAnimationPhase] = useState(0);

  const config = useMemo(() => ({
    margin: { top: 80, right: 200, bottom: 100, left: 100 },
    pointRadius: 8,
    lineWidth: 4,
    depth: 300,
    spacing: 50
  }), []);

  // Proyección 3D a 2D
  const project3DTo2D = useCallback((point: Point3D, alpha: number, beta: number): Point2D => {
    const cosA = Math.cos(alpha);
    const sinA = Math.sin(alpha);
    const cosB = Math.cos(beta);
    const sinB = Math.sin(beta);

    // Rotación en Y
    const x1 = point.x * cosA + point.z * sinA;
    const z1 = -point.x * sinA + point.z * cosA;
    
    // Rotación en X
    const y2 = point.y * cosB - z1 * sinB;
    const z2 = point.y * sinB + z1 * cosB;

    // Proyección perspectiva
    const perspective = 1000;
    const distance = perspective + z2;
    
    return {
      x: (x1 * perspective) / distance,
      y: (y2 * perspective) / distance
    };
  }, []);

  // Procesar datos para 3D
  const processedData = useMemo(() => {
    console.log('🔍 EvolutionLine3D - Datos recibidos:', data);
    
    const monthMap: { [key: string]: number } = {
      'Enero': 1, 'Febrero': 2, 'Marzo': 3, 'Abril': 4,
      'Mayo': 5, 'Junio': 6, 'Julio': 7, 'Agosto': 8,
      'Septiembre': 9, 'Octubre': 10, 'Noviembre': 11, 'Diciembre': 12
    };
    
    const filtered = data
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

    if (filtered.length === 0) return [];

    // Crear posiciones 3D para los puntos
    const maxValue = d3.max(filtered, d => d.value) || 1;
    const minValue = d3.min(filtered, d => d.value) || 0;
    
    return filtered.map((d, i) => ({
      id: `point-${i}`,
      value: d.value,
      period: d.period,
      year: d.year,
      month: d.month,
      date: d.date,
      position3D: {
        x: (i - (filtered.length - 1) / 2) * config.spacing, // Centrar en X
        y: -((d.value - minValue) / (maxValue - minValue)) * 200 + 100, // Invertir Y para SVG
        z: Math.sin(i * 0.3) * 50 // Dar profundidad ondulada
      }
    }));
  }, [data, config.spacing]);

  // Animación de entrada
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationPhase(1);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Renderizado principal
  useEffect(() => {
    if (!svgRef.current || loading || processedData.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Crear contenedor principal
    const g = svg
      .append("g")
      .attr("transform", `translate(${width/2},${height/2})`);

    // Proyectar todos los puntos
    const projectedPoints = processedData.map(d => ({
      ...d,
      projected: project3DTo2D(d.position3D, rotation.alpha, rotation.beta)
    }));

    // Crear generador de línea curva suave
    const line = d3.line<typeof projectedPoints[0]>()
      .x(d => d.projected.x)
      .y(d => d.projected.y)
      .curve(d3.curveCardinal.tension(0.3));

    // Dibujar línea principal
    const mainLine = g.append("path")
      .datum(projectedPoints)
      .attr("d", line)
      .attr("fill", "none")
      .attr("stroke", "#3b82f6")
      .attr("stroke-width", config.lineWidth)
      .attr("stroke-linecap", "round")
      .attr("stroke-linejoin", "round")
      .style("filter", "drop-shadow(0 2px 8px rgba(59,130,246,0.4))");

    // Animación de la línea
    if (animationPhase >= 1) {
      const lineLength = (mainLine.node() as SVGPathElement).getTotalLength();
      mainLine
        .attr("stroke-dasharray", lineLength + " " + lineLength)
        .attr("stroke-dashoffset", lineLength)
        .transition()
        .duration(2000)
        .ease(d3.easeLinear)
        .attr("stroke-dashoffset", 0);
    }

    // Crear tooltip
    const tooltip = d3.select("body")
      .append("div")
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background", "rgba(0, 0, 0, 0.9)")
      .style("color", "white")
      .style("padding", "12px")
      .style("border-radius", "8px")
      .style("font-size", "13px")
      .style("box-shadow", "0 4px 12px rgba(0,0,0,0.4)")
      .style("z-index", "1000");

    // Dibujar puntos de datos
    const circles = g.selectAll(".data-point")
      .data(projectedPoints)
      .enter().append("circle")
      .attr("class", "data-point")
      .attr("cx", d => d.projected.x)
      .attr("cy", d => d.projected.y)
      .attr("r", 0)
      .attr("fill", "#3b82f6")
      .attr("stroke", "white")
      .attr("stroke-width", 3)
      .style("cursor", "pointer")
      .style("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.3))");

    // Animación de puntos
    if (animationPhase >= 1) {
      circles
        .transition()
        .duration(600)
        .delay((_, i) => 2000 + i * 100)
        .attr("r", config.pointRadius);
    }

    // Interacciones de los puntos
    circles
      .on("mouseover", function(_, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("r", config.pointRadius * 1.5)
          .style("filter", "drop-shadow(0 4px 8px rgba(255,107,53,0.6))");

        tooltip
          .style("visibility", "visible")
          .html(`
            <strong>${d.month}/${d.year}</strong><br/>
            Valor: <span style="color: #3b82f6; font-weight: bold;">${d.value}</span><br/>
            Período: ${d.period}
          `);
      })
      .on("mousemove", function(event) {
        tooltip
          .style("top", (event.pageY - 10) + "px")
          .style("left", (event.pageX + 10) + "px");
      })
      .on("mouseout", function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("r", config.pointRadius)
          .style("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.3))");

        tooltip.style("visibility", "hidden");
      });

    // Título del gráfico
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", 35)
      .attr("text-anchor", "middle")
      .style("font-size", "20px")
      .style("font-weight", "bold")
      .style("fill", "rgba(255,255,255,0.9)")
      .style("filter", "drop-shadow(0 1px 2px rgba(0,0,0,0.3))")
      .text(title || `Evolución 3D - ${dependency.length > 35 ? dependency.substring(0, 35) + "..." : dependency}`);

    // Subtítulo
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", 60)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .style("fill", "rgba(255,255,255,0.7)")
      .text(`${startPeriod} a ${endPeriod} ${year} - ${objectType}`);

    return () => {
      tooltip.remove();
    };

  }, [processedData, rotation, project3DTo2D, config, width, height, dependency, loading, title, animationPhase, startPeriod, endPeriod, year, objectType]);

  // Manejo de rotación con mouse
  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (event.button === 0) {
      setIsDragging(true);
      setDragStart({ x: event.clientX, y: event.clientY });
      event.preventDefault();
    }
  }, []);

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (isDragging && dragStart) {
      const deltaX = event.clientX - dragStart.x;
      const deltaY = event.clientY - dragStart.y;
      
      setRotation(prev => ({
        alpha: prev.alpha + deltaX * 0.01,
        beta: Math.max(-Math.PI/2 + 0.1, Math.min(Math.PI/2 - 0.1, prev.beta + deltaY * 0.01))
      }));
      
      setDragStart({ x: event.clientX, y: event.clientY });
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

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
        <p className="ml-4 text-slate-300">Cargando evolución 3D...</p>
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
      className="w-full bg-transparent rounded-lg overflow-hidden cursor-move"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="w-full overflow-x-auto">
        <svg
          ref={svgRef}
          width={width}
          height={height}
          style={{ background: 'transparent', minWidth: '1200px' }}
        />
        <div className="text-center text-white p-2">
          🖱️ Arrastra para rotar la visualización 3D
        </div>
      </div>
    </motion.div>
  );
};

export default EvolutionLine3D;