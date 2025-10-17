import React, { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { motion } from 'framer-motion';
import { DependencyData } from '../../services/apiService';
import { useTheme } from '../../hooks/useTheme';

interface D3BarChartProps {
  data: DependencyData[];
  dependency: string;
  month: string;
  year: string;
  loading: boolean;
}

const D3BarChart: React.FC<D3BarChartProps> = ({ 
  data, 
  dependency, 
  month, 
  year, 
  loading 
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const { isDark } = useTheme();

  // Configuración del gráfico responsivo
  const margin = useMemo(() => ({ top: 60, right: 60, bottom: 150, left: 80 }), []);
  const baseWidth = 1200; // Ancho base del SVG
  const width = baseWidth - margin.left - margin.right;
  const height = 600 - margin.bottom - margin.top;

  // Procesar datos
  const processedData = useMemo(() => {
    return data
      .filter(d => d.category && d.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Mostrar solo top 10
  }, [data]);

  // Colores adaptativos al tema
  const textColor = isDark ? "rgba(255,255,255,0.9)" : "rgba(30,41,59,0.9)"; // slate-800 para modo claro
  const titleColor = isDark ? "rgba(255,255,255,0.9)" : "rgba(15,23,42,0.95)"; // slate-900 para modo claro
  const axisColor = isDark ? "rgba(255,255,255,0.8)" : "rgba(51,65,85,0.8)"; // slate-700 para modo claro

  useEffect(() => {
    if (!svgRef.current || loading || processedData.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Limpiar gráfico anterior

    // Crear contenedor principal
    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Escalas
    const xScale = d3.scaleBand()
      .domain(processedData.map(d => d.category))
      .range([0, width])
      .padding(0.2);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(processedData, d => d.value) || 0])
      .range([height, 0]);

    // Escala de colores moderna
    const modernColors = [
      "#667eea", "#f093fb", "#4facfe", "#43e97b", "#fcb69f",
      "#a8edea", "#ff9a9e", "#fad0c4", "#ffecd2", "#764ba2"
    ];
    
    const colorScale = d3.scaleOrdinal()
      .domain(processedData.map(d => d.category))
      .range(modernColors);

    // Crear tooltip
    const tooltip = d3.select("body")
      .append("div")
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background", "rgba(0, 0, 0, 0.8)")
      .style("color", "white")
      .style("padding", "12px")
      .style("border-radius", "8px")
      .style("font-size", "14px")
      .style("box-shadow", "0 4px 12px rgba(0,0,0,0.3)")
      .style("z-index", "1000");

    // Barras verticales
    const bars = g.selectAll(".bar")
      .data(processedData)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", d => xScale(d.category) || 0)
      .attr("y", height) // Comenzar desde abajo para animación
      .attr("width", xScale.bandwidth())
      .attr("height", 0) // Comenzar con altura 0 para animación
      .attr("fill", d => colorScale(d.category) as string)
      .attr("rx", 8)
      .attr("ry", 8)
      .style("cursor", "pointer")
      .style("filter", "drop-shadow(0 4px 8px rgba(0,0,0,0.2))");

    // Animación de entrada de barras
    bars.transition()
      .duration(1200)
      .delay((_, i) => i * 150)
      .ease(d3.easeCubicOut)
      .attr("y", d => yScale(d.value))
      .attr("height", d => height - yScale(d.value));

    // Eventos de interacción para barras
    bars
      .on("mouseover", function(_, d) {
        d3.select(this)
          .transition()
          .duration(300)
          .style("transform", "scale(1.05)")
          .style("filter", "drop-shadow(0 8px 16px rgba(0,0,0,0.4))")
          .attr("rx", 12)
          .attr("ry", 12);

        tooltip
          .style("visibility", "visible")
          .html(`
            <div style="text-align: center;">
              <div style="font-size: 16px; margin-bottom: 8px;">${d.category}</div>
              <div style="font-size: 24px; font-weight: bold; color: #4facfe;">${d.value.toLocaleString()}</div>
              <div style="font-size: 12px; margin-top: 4px; opacity: 0.8;">${dependency}</div>
            </div>
          `);
      })
      .on("mousemove", function(event) {
        tooltip
          .style("top", (event.pageY - 80) + "px")
          .style("left", (event.pageX - 60) + "px");
      })
      .on("mouseout", function() {
        d3.select(this)
          .transition()
          .duration(300)
          .style("transform", "scale(1)")
          .style("filter", "drop-shadow(0 4px 8px rgba(0,0,0,0.2))")
          .attr("rx", 8)
          .attr("ry", 8);

        tooltip.style("visibility", "hidden");
      });

    // Labels de valores en las barras
    g.selectAll(".value-label")
      .data(processedData)
      .enter()
      .append("text")
      .attr("class", "value-label")
      .attr("x", d => (xScale(d.category) || 0) + xScale.bandwidth() / 2)
      .attr("y", d => yScale(d.value) - 10)
      .attr("text-anchor", "middle")
      .style("font-size", "13px")
      .style("font-weight", "bold")
      .style("fill", textColor)
      .style("opacity", 0)
      .text(d => d.value.toLocaleString());

    // Animación de labels
    g.selectAll(".value-label")
      .transition()
      .duration(800)
      .delay((_, i) => i * 100 + 400)
      .style("opacity", 1);

    // Eje X (categorías) - en la parte inferior
    const xAxis = d3.axisBottom(xScale)
      .tickFormat(d => {
        // Con más espacio, podemos mostrar más texto
        return d.length > 20 ? d.substring(0, 20) + "..." : d;
      });

    g.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${height})`)
      .call(xAxis)
      .selectAll("text")
      .style("fill", axisColor)
      .style("font-size", "12px")
      .style("font-weight", "500")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end");

    // Eje Y (valores) - en la parte izquierda
    const yAxis = d3.axisLeft(yScale)
      .ticks(8)
      .tickFormat(d => d3.format(".0f")(d as number));

    g.append("g")
      .attr("class", "y-axis")
      .call(yAxis)
      .selectAll("text")
      .style("fill", axisColor)
      .style("font-size", "12px");

    // Título del gráfico
    svg.append("text")
      .attr("x", baseWidth / 2)
      .attr("y", 25)
      .attr("text-anchor", "middle")
      .style("font-size", "18px")
      .style("font-weight", "bold")
      .style("fill", titleColor)
      .text(`${dependency} - ${month} ${year}`);

    // Label del eje Y
    svg.append("text")
      .attr("x", baseWidth / 2)
      .attr("y", margin.top - 10)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .style("fill", axisColor)
      .text("Cantidad de Casos");

    // Grid lines horizontales
    g.selectAll(".grid-line")
      .data(yScale.ticks(8))
      .enter()
      .append("line")
      .attr("class", "grid-line")
      .attr("x1", 0)
      .attr("x2", width)
      .attr("y1", d => yScale(d))
      .attr("y2", d => yScale(d))
      .style("stroke", "rgba(255,255,255,0.1)")
      .style("stroke-dasharray", "2,2");

    // Limpiar tooltip al desmontar
    return () => {
      tooltip.remove();
    };

  }, [processedData, dependency, month, year, loading, width, height, margin, baseWidth, textColor, titleColor, axisColor]);

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
        <p className="ml-4 text-slate-300">Cargando datos...</p>
      </div>
    );
  }

  if (processedData.length === 0) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="text-center">
          <div className="text-slate-400 text-6xl mb-4">📊</div>
          <p className="text-slate-300 text-lg font-medium">No hay datos disponibles</p>
          <p className="text-slate-400 text-sm mt-2">
            Verifica que existan datos para el período seleccionado
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="w-full bg-transparent rounded-lg chart-container"
      style={{ 
        margin: 0, 
        padding: 0, 
        border: 'none',
        outline: 'none'
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <svg
        ref={svgRef}
        width="100%"
        height={600}
        style={{ 
          background: 'transparent',
          display: 'block',
          border: 'none',
          outline: 'none'
        }}
        viewBox={`0 0 ${baseWidth} 600`}
        preserveAspectRatio="xMidYMid meet"
      />
    </motion.div>
  );
};

export default D3BarChart;