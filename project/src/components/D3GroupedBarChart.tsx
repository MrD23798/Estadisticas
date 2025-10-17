import React, { useEffect, useRef, useMemo, useState } from 'react';
import * as d3 from 'd3';
import { motion } from 'framer-motion';
import { ComparisonData } from '../services/csvService';
import { useTheme } from '../hooks/useTheme';

interface D3GroupedBarChartProps {
  data: ComparisonData[];
  month: number;
  year: number;
  loading: boolean;
}

const D3GroupedBarChart: React.FC<D3GroupedBarChartProps> = ({ 
  data, 
  month, 
  year, 
  loading 
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const { isDark } = useTheme();

  // Configuración del gráfico
  const margin = useMemo(() => ({ top: 60, right: 60, bottom: 120, left: 80 }), []);
  const width = 1000 - margin.left - margin.right;
  const height = 600 - margin.bottom - margin.top;

  // Procesar datos
  const processedData = useMemo(() => {
    // Obtener dependencias y categorías únicas
    const uniqueDependencies = Array.from(new Set(data.map(item => item.dependency)));
    const uniqueCategories = Array.from(new Set(data.map(item => item.category))).slice(0, 5); // Max 5 categorías

    return {
      dependencies: uniqueDependencies,
      categories: uniqueCategories,
      data: data.filter(d => uniqueCategories.includes(d.category))
    };
  }, [data]);

  // Colores adaptativos al tema
  const textColor = isDark ? "rgba(255,255,255,0.9)" : "rgba(30,41,59,0.9)";
  const titleColor = isDark ? "rgba(255,255,255,0.9)" : "rgba(15,23,42,0.95)";
  const axisColor = isDark ? "rgba(255,255,255,0.8)" : "rgba(51,65,85,0.8)";

  useEffect(() => {
    if (!svgRef.current || loading || processedData.data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Limpiar gráfico anterior

    // Crear contenedor principal
    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Escalas
    const x0Scale = d3.scaleBand()
      .domain(processedData.dependencies)
      .range([0, width])
      .padding(0.2);

    const x1Scale = d3.scaleBand()
      .domain(processedData.categories)
      .range([0, x0Scale.bandwidth()])
      .padding(0.05);

    const maxValue = d3.max(processedData.data, d => d.value) || 0;
    const yScale = d3.scaleLinear()
      .domain([0, maxValue])
      .range([height, 0]);

    // Escala de colores para categorías
    const colorScale = d3.scaleOrdinal()
      .domain(processedData.categories)
      .range(d3.schemeSet3);

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

    // Crear grupos para cada dependencia
    const dependencyGroups = g.selectAll(".dependency-group")
      .data(processedData.dependencies)
      .enter()
      .append("g")
      .attr("class", "dependency-group")
      .attr("transform", d => `translate(${x0Scale(d)},0)`);

    // Crear barras dentro de cada grupo
    processedData.dependencies.forEach(dependency => {
      const dependencyGroup = g.select(`[transform*="${x0Scale(dependency)}"]`);
      
      const categoryData = processedData.categories.map(category => {
        const found = processedData.data.find(item => 
          item.dependency === dependency && item.category === category
        );
        return {
          category,
          value: found ? found.value : 0,
          dependency
        };
      });

      const bars = dependencyGroup.selectAll(".bar")
        .data(categoryData)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => x1Scale(d.category) || 0)
        .attr("y", height) // Comenzar desde abajo para animación
        .attr("width", x1Scale.bandwidth())
        .attr("height", 0) // Comenzar con altura 0 para animación
        .attr("fill", d => colorScale(d.category) as string)
        .attr("rx", 3)
        .style("cursor", "pointer");

      // Animación de entrada de barras
      bars.transition()
        .duration(800)
        .delay((_, i) => i * 100)
        .attr("y", d => yScale(d.value))
        .attr("height", d => height - yScale(d.value));

      // Eventos de interacción
      bars
        .on("mouseover", function(event, d) {
          d3.select(this)
            .transition()
            .duration(200)
            .attr("fill", "#ff6b35")
            .attr("rx", 5);

          tooltip
            .style("visibility", "visible")
            .html(`
              <strong>${d.dependency}</strong><br/>
              Categoría: ${d.category}<br/>
              Cantidad: ${d.value}
            `);
        })
        .on("mousemove", function(event) {
          tooltip
            .style("top", (event.pageY - 10) + "px")
            .style("left", (event.pageX + 10) + "px");
        })
        .on("mouseout", function(_, d) {
          d3.select(this)
            .transition()
            .duration(200)
            .attr("fill", colorScale(d.category) as string)
            .attr("rx", 3);

          tooltip.style("visibility", "hidden");
        });

      // Labels de valores en las barras (solo para valores > 0)
      dependencyGroup.selectAll(".value-label")
        .data(categoryData.filter(d => d.value > 0))
        .enter()
        .append("text")
        .attr("class", "value-label")
        .attr("x", d => (x1Scale(d.category) || 0) + x1Scale.bandwidth() / 2)
        .attr("y", d => yScale(d.value) - 5)
        .attr("text-anchor", "middle")
        .style("font-size", "10px")
        .style("font-weight", "bold")
        .style("fill", "white")
        .style("opacity", 0)
        .text(d => d.value);

      // Animación de labels
      dependencyGroup.selectAll(".value-label")
        .transition()
        .duration(800)
        .delay((_, i) => i * 100 + 400)
        .style("opacity", 1);
    });

    // Eje X (dependencias)
    const xAxis = d3.axisBottom(x0Scale)
      .tickFormat(d => {
        // Truncar nombres largos
        return d.length > 20 ? d.substring(0, 20) + "..." : d;
      });

    g.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${height})`)
      .call(xAxis)
      .selectAll("text")
      .style("fill", "rgba(255,255,255,0.8)")
      .style("font-size", "10px")
      .style("text-anchor", "end")
      .attr("transform", "rotate(-45)");

    // Eje Y
    const yAxis = d3.axisLeft(yScale)
      .ticks(8)
      .tickFormat(d3.format("d"));

    g.append("g")
      .attr("class", "y-axis")
      .call(yAxis)
      .selectAll("text")
      .style("fill", "rgba(255,255,255,0.8)")
      .style("font-size", "12px");

    // Título del gráfico
    svg.append("text")
      .attr("x", (width + margin.left + margin.right) / 2)
      .attr("y", 30)
      .attr("text-anchor", "middle")
      .style("font-size", "20px")
      .style("font-weight", "bold")
      .style("fill", "rgba(255,255,255,0.9)")
      .text(`Comparativa - ${month} ${year}`);

    // Label del eje Y
    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 20)
      .attr("x", -(height + margin.top + margin.bottom) / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .style("fill", "rgba(255,255,255,0.8)")
      .text("Cantidad de Casos");

    // Leyenda
    const legend = svg.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${width + margin.left - 200}, ${margin.top + 20})`);

    const legendItems = legend.selectAll(".legend-item")
      .data(processedData.categories)
      .enter()
      .append("g")
      .attr("class", "legend-item")
      .attr("transform", (_, i) => `translate(0, ${i * 20})`);

    legendItems.append("rect")
      .attr("width", 15)
      .attr("height", 15)
      .attr("fill", d => colorScale(d) as string)
      .attr("rx", 2);

    legendItems.append("text")
      .attr("x", 20)
      .attr("y", 12)
      .style("font-size", "12px")
      .style("fill", "rgba(255,255,255,0.8)")
      .text(d => d.length > 15 ? d.substring(0, 15) + "..." : d);

    // Grid lines
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

  }, [processedData, month, year, loading, width, height, margin]);

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
          className="w-16 h-16 border-4 border-t-indigo-500 border-r-transparent border-b-indigo-500 border-l-transparent rounded-full"
        />
        <p className="ml-4 text-slate-300">Cargando datos de comparación...</p>
      </div>
    );
  }

  if (processedData.data.length === 0) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="text-center">
          <div className="text-slate-400 text-6xl mb-4">📊</div>
          <p className="text-slate-300 text-lg font-medium">No hay datos de comparación disponibles</p>
          <p className="text-slate-400 text-sm mt-2">
            Selecciona dependencias y verifica que existan datos para el período
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
    >
      <div className="w-full overflow-x-auto">
        <svg
          ref={svgRef}
          width={Math.max(1000, processedData.dependencies.length * 120)}
          height={600}
          style={{ background: 'transparent', minWidth: '1000px' }}
        />
      </div>
    </motion.div>
  );
};

export default D3GroupedBarChart;