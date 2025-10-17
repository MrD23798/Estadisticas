import React, { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { motion } from 'framer-motion';

export interface EvolutionData {
  period: string;
  value: number;
  year: string;
  month: string;
}

interface D3LineChartProps {
  data: EvolutionData[];
  dependency: string;
  startPeriod: string;
  endPeriod: string;
  year: string;
  objectType?: string;
  loading: boolean;
}

const D3LineChart: React.FC<D3LineChartProps> = ({ 
  data, 
  dependency, 
  startPeriod,
  endPeriod,
  year,
  objectType = 'TODOS',
  loading 
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  // Configuración del gráfico
  const margin = useMemo(() => ({ top: 80, right: 150, bottom: 100, left: 100 }), []);
  const width = 1100 - margin.left - margin.right;
  const height = 500 - margin.bottom - margin.top;

  // Procesar datos para D3
  const processedData = useMemo(() => {
    console.log('🔍 D3LineChart - Datos recibidos:', data);
    
    // Mapeo de nombres de meses a números
    const monthMap: { [key: string]: number } = {
      'Enero': 1, 'Febrero': 2, 'Marzo': 3, 'Abril': 4,
      'Mayo': 5, 'Junio': 6, 'Julio': 7, 'Agosto': 8,
      'Septiembre': 9, 'Octubre': 10, 'Noviembre': 11, 'Diciembre': 12
    };
    
    const filtered = data
      .filter(d => {
        const hasValidValue = d.value !== undefined && d.value !== null && !isNaN(d.value);
        
        // Validar año (puede ser string o número)
        const yearNum = typeof d.year === 'string' ? parseInt(d.year) : d.year;
        const hasValidYear = !isNaN(yearNum) && yearNum > 2000 && yearNum < 2030;
        
        // Validar mes (puede ser nombre o número)
        let monthNum: number;
        if (typeof d.month === 'string') {
          monthNum = monthMap[d.month] || 0;
        } else {
          monthNum = d.month || 0;
        }
        const hasValidMonth = monthNum >= 1 && monthNum <= 12;
        
        const hasValidDate = hasValidYear && hasValidMonth;
        
        if (!hasValidValue) console.log('❌ Valor inválido:', d);
        if (!hasValidDate) console.log('❌ Fecha inválida:', d, { year: yearNum, month: monthNum });
        
        return hasValidValue && hasValidDate;
      })
      .map(d => {
        // Normalizar los datos
        const yearNum = typeof d.year === 'string' ? parseInt(d.year) : d.year;
        const monthNum = typeof d.month === 'string' ? monthMap[d.month] : d.month;
        
        return {
          ...d,
          year: yearNum,
          month: monthNum
        };
      })
      .sort((a, b) => {
        const aDate = new Date(a.year, a.month - 1);
        const bDate = new Date(b.year, b.month - 1);
        return aDate.getTime() - bDate.getTime();
      });

    console.log('✅ D3LineChart - Datos procesados:', filtered);
    return filtered;
  }, [data]);

  useEffect(() => {
    if (!svgRef.current || loading || processedData.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Limpiar gráfico anterior

    // Crear contenedor principal
    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Crear escalas de tiempo
    const timeParser = d3.timeParse("%Y-%m");
    const dataWithDates = processedData.map(d => ({
      ...d,
      date: timeParser(`${d.year}-${d.month.toString().padStart(2, '0')}`)
    }));

    // Escalas
    const xScale = d3.scaleTime()
      .domain(d3.extent(dataWithDates, d => d.date) as [Date, Date])
      .range([0, width])
      .nice();

    const maxValue = d3.max(dataWithDates, d => d.value) || 0;
    const yScale = d3.scaleLinear()
      .domain([0, maxValue * 1.1]) // Añadir 10% de margen superior
      .range([height, 0])
      .nice();

    // Crear generador de línea
    const line = d3.line<typeof dataWithDates[0]>()
      .x(d => xScale(d.date!))
      .y(d => yScale(d.value))
      .curve(d3.curveMonotoneX);

    // Crear área bajo la curva
    const area = d3.area<typeof dataWithDates[0]>()
      .x(d => xScale(d.date!))
      .y0(height)
      .y1(d => yScale(d.value))
      .curve(d3.curveMonotoneX);

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

    // Añadir área con gradiente
    const gradient = svg.append("defs")
      .append("linearGradient")
      .attr("id", "area-gradient")
      .attr("gradientUnits", "userSpaceOnUse")
      .attr("x1", 0).attr("y1", height)
      .attr("x2", 0).attr("y2", 0);

    gradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#3b82f6")
      .attr("stop-opacity", 0.1);

    gradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#3b82f6")
      .attr("stop-opacity", 0.4);

    // Dibujar área
    const areaPath = g.append("path")
      .datum(dataWithDates)
      .attr("fill", "url(#area-gradient)")
      .attr("d", area);

    // Animación del área
    const areaLength = (areaPath.node() as SVGPathElement).getTotalLength();
    areaPath
      .attr("stroke-dasharray", areaLength + " " + areaLength)
      .attr("stroke-dashoffset", areaLength)
      .transition()
      .duration(1500)
      .ease(d3.easeLinear)
      .attr("stroke-dashoffset", 0);

    // Dibujar línea principal
    const linePath = g.append("path")
      .datum(dataWithDates)
      .attr("fill", "none")
      .attr("stroke", "#3b82f6")
      .attr("stroke-width", 4)
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .style("filter", "drop-shadow(0 2px 4px rgba(59,130,246,0.3))")
      .attr("d", line);

    // Animación de la línea
    const lineLength = (linePath.node() as SVGPathElement).getTotalLength();
    linePath
      .attr("stroke-dasharray", lineLength + " " + lineLength)
      .attr("stroke-dashoffset", lineLength)
      .transition()
      .duration(2000)
      .ease(d3.easeLinear)
      .attr("stroke-dashoffset", 0);

    // Añadir puntos de datos
    const circles = g.selectAll(".dot")
      .data(dataWithDates)
      .enter().append("circle")
      .attr("class", "dot")
      .attr("cx", d => xScale(d.date!))
      .attr("cy", d => yScale(d.value))
      .attr("r", 0) // Comenzar invisible para animación
      .attr("fill", "#3b82f6")
      .attr("stroke", "white")
      .attr("stroke-width", 3)
      .style("cursor", "pointer")
      .style("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.3))");

    // Animación de puntos
    circles
      .transition()
      .duration(600)
      .delay((_, i) => 2000 + i * 150)
      .attr("r", 8);

    // Interacciones de los puntos
    circles
      .on("mouseover", function(_, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("r", 12)
          .attr("fill", "#ff6b35")
          .style("filter", "drop-shadow(0 4px 8px rgba(255,107,53,0.4))");

        tooltip
          .style("visibility", "visible")
          .html(`
            <strong>${d.month}/${d.year}</strong><br/>
            Cantidad: <span style="color: #3b82f6; font-weight: bold;">${d.value}</span><br/>
            Dependencia: ${dependency}<br/>
            Tipo: ${objectType}
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
          .attr("r", 8)
          .attr("fill", "#3b82f6")
          .style("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.3))");

        tooltip.style("visibility", "hidden");
      });

    // Añadir labels de valores
    g.selectAll(".value-label")
      .data(dataWithDates)
      .enter().append("text")
      .attr("class", "value-label")
      .attr("x", d => xScale(d.date!))
      .attr("y", d => yScale(d.value) - 10)
      .attr("text-anchor", "middle")
      .style("font-size", "11px")
      .style("font-weight", "bold")
      .style("fill", "white")
      .style("opacity", 0)
      .text(d => d.value);

    // Animación de labels
    g.selectAll(".value-label")
      .transition()
      .duration(600)
      .delay((_, i) => 2500 + i * 100)
      .style("opacity", 1);

    // Eje X (tiempo)
    const xAxis = d3.axisBottom(xScale)
      .ticks(Math.min(dataWithDates.length, 8))
      .tickFormat((domainValue) => {
        const date = domainValue as Date;
        return d3.timeFormat("%b %Y")(date);
      });

    g.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${height})`)
      .call(xAxis)
      .selectAll("text")
      .style("fill", "rgba(255,255,255,0.8)")
      .style("font-size", "12px")
      .style("text-anchor", "end")
      .attr("transform", "rotate(-35)");

    // Eje Y
    const yAxis = d3.axisLeft(yScale)
      .ticks(6)
      .tickFormat(d3.format("d"));

    g.append("g")
      .attr("class", "y-axis")
      .call(yAxis)
      .selectAll("text")
      .style("fill", "rgba(255,255,255,0.8)")
      .style("font-size", "12px");

    // Título del gráfico
    svg.append("text")
      .attr("x", (width + margin.left) / 2)
      .attr("y", 35)
      .attr("text-anchor", "middle")
      .style("font-size", "20px")
      .style("font-weight", "bold")
      .style("fill", "rgba(255,255,255,0.9)")
      .style("filter", "drop-shadow(0 1px 2px rgba(0,0,0,0.3))")
      .text(`Evolución - ${dependency.length > 40 ? dependency.substring(0, 40) + "..." : dependency}`);

    // Subtítulo
    svg.append("text")
      .attr("x", (width + margin.left) / 2)
      .attr("y", 60)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .style("fill", "rgba(255,255,255,0.7)")
      .text(`${startPeriod} a ${endPeriod} ${year} - ${objectType}`);

    // Label del eje Y
    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 20)
      .attr("x", -(height + margin.top + margin.bottom) / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .style("fill", "rgba(255,255,255,0.8)")
      .text("Cantidad de Casos");

    // Grid lines horizontales
    g.selectAll(".grid-line")
      .data(yScale.ticks(6))
      .enter()
      .append("line")
      .attr("class", "grid-line")
      .attr("x1", 0)
      .attr("x2", width)
      .attr("y1", d => yScale(d))
      .attr("y2", d => yScale(d))
      .style("stroke", "rgba(255,255,255,0.1)")
      .style("stroke-dasharray", "2,2");

    // Estadísticas en el panel lateral
    const statsPanel = svg.append("g")
      .attr("class", "stats-panel")
      .attr("transform", `translate(${width + margin.left + 30}, ${margin.top + 40})`);

    const stats = [
      { label: "Máximo", value: d3.max(dataWithDates, d => d.value) || 0, color: "#3b82f6" },
      { label: "Mínimo", value: d3.min(dataWithDates, d => d.value) || 0, color: "#10b981" },
      { label: "Promedio", value: Math.round(d3.mean(dataWithDates, d => d.value) || 0), color: "#8b5cf6" },
      { label: "Total", value: d3.sum(dataWithDates, d => d.value), color: "#f59e0b" }
    ];

    const statItems = statsPanel.selectAll(".stat-item")
      .data(stats)
      .enter()
      .append("g")
      .attr("class", "stat-item")
      .attr("transform", (_, i) => `translate(0, ${i * 50})`);

    // Fondo de estadísticas con gradiente
    statItems.append("rect")
      .attr("width", 100)
      .attr("height", 42)
      .attr("fill", "rgba(0,0,0,0.4)")
      .attr("stroke", (_, i) => stats[i].color)
      .attr("stroke-width", 2)
      .attr("rx", 8)
      .style("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.2))");

    // Labels de estadísticas
    statItems.append("text")
      .attr("x", 50)
      .attr("y", 15)
      .attr("text-anchor", "middle")
      .style("font-size", "11px")
      .style("font-weight", "500")
      .style("fill", "rgba(255,255,255,0.8)")
      .text(d => d.label);

    // Valores de estadísticas
    statItems.append("text")
      .attr("x", 50)
      .attr("y", 32)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .style("fill", d => d.color)
      .text(d => d.value);

    // Limpiar tooltip al desmontar
    return () => {
      tooltip.remove();
    };

  }, [processedData, dependency, startPeriod, endPeriod, year, objectType, loading, width, height, margin]);

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
        <p className="ml-4 text-slate-300">Cargando evolución...</p>
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
    >
      <div className="w-full overflow-x-auto">
        <svg
          ref={svgRef}
          width={width + margin.left + margin.right}
          height={height + margin.top + margin.bottom}
          style={{ background: 'transparent', minWidth: '1250px' }}
        />
      </div>
    </motion.div>
  );
};

export default D3LineChart;