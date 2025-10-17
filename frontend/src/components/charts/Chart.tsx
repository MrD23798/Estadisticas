import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import * as d3 from 'd3';
import { Box, BarChart3 } from 'lucide-react';
import Chart3DView from './Chart3DView';

interface ChartData {
  objectType: string;
  count: number;
}

interface ChartProps {
  data: ChartData[];
}

const Chart: React.FC<ChartProps> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [is3D, setIs3D] = useState(false);

  console.log('Chart component renderizado, is3D:', is3D);
  console.log('Chart data:', data);

  useEffect(() => {
    if (!svgRef.current || !data || data.length === 0) return;

    // Limpiar SVG anterior
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current);
    const width = 800;
    const height = 400;
    const margin = { top: 20, right: 30, bottom: 80, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Crear grupo principal
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Escalas
    const xScale = d3.scaleBand()
      .domain(data.map(d => d.objectType))
      .range([0, innerWidth])
      .padding(0.1);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.count) || 0])
      .range([innerHeight, 0]);

    // Crear barras
    const bars = g.selectAll('.bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => xScale(d.objectType) || 0)
      .attr('width', xScale.bandwidth())
      .attr('y', innerHeight)
      .attr('height', 0)
      .attr('fill', '#3b82f6')
      .attr('rx', 4);

    // Animación de las barras
    bars.transition()
      .duration(1000)
      .ease(d3.easeElastic)
      .attr('y', d => yScale(d.count))
      .attr('height', d => innerHeight - yScale(d.count));

    // Agregar etiquetas de valores
    const labels = g.selectAll('.label')
      .data(data)
      .enter()
      .append('text')
      .attr('class', 'label')
      .attr('x', d => (xScale(d.objectType) || 0) + xScale.bandwidth() / 2)
      .attr('y', innerHeight)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .attr('fill', '#374151')
      .text(d => d.count);

    // Animación de las etiquetas
    labels.transition()
      .duration(1000)
      .delay(500)
      .attr('y', d => yScale(d.count) - 5);

    // Eje X
    const xAxis = d3.axisBottom(xScale);
    g.append('g')
      .attr('transform', `translate(0, ${innerHeight})`)
      .call(xAxis)
      .selectAll('text')
      .style('text-anchor', 'end')
      .attr('dx', '-.8em')
      .attr('dy', '.15em')
      .attr('transform', 'rotate(-45)')
      .style('font-size', '12px');

    // Eje Y
    const yAxis = d3.axisLeft(yScale);
    g.append('g')
      .call(yAxis)
      .style('font-size', '12px');

    // Título del eje Y
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - margin.left)
      .attr('x', 0 - (innerHeight / 2))
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .text('Cantidad');

    // Interactividad
    bars
      .on('mouseover', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('fill', '#1d4ed8');
      })
      .on('mouseout', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('fill', '#3b82f6');
      });

  }, [data]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
      className="w-full max-w-4xl mx-auto p-6"
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mb-6"
      >
        <h3 className="text-xl font-bold text-gray-800 mb-2">
          Gráfico de Barras
        </h3>
        <p className="text-sm text-gray-600">
          Distribución de datos por categoría
        </p>
        
        {/* BOTÓN DE PRUEBA FUERA DEL CONTENEDOR */}
        <button
          onClick={() => {
            console.log('🟢 BOTÓN DE PRUEBA CLICKEADO!');
            setIs3D(!is3D);
          }}
          style={{
            background: 'lime',
            border: '3px solid purple',
            padding: '20px',
            fontSize: '18px',
            fontWeight: 'bold',
            borderRadius: '10px',
            marginTop: '10px'
          }}
        >
          🧪 BOTÓN DE PRUEBA - CLICK AQUÍ ({is3D ? "2D" : "3D"})
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="bg-white rounded-lg shadow-lg p-4 relative"
      >
        {/* Botón de alternancia 2D/3D - SUPER VISIBLE */}
        <motion.button
          onClick={() => {
            console.log('🔴 BOTÓN 3D CLICKEADO! Cambiando de', is3D, 'a', !is3D);
            setIs3D(!is3D);
          }}
          className="absolute top-2 right-2 z-[9999] p-6 rounded-xl transition-all duration-300"
          style={{ 
            background: 'red',
            border: '5px solid black',
            boxShadow: '0 8px 16px rgba(0, 0, 0, 0.8)',
            width: '120px',
            height: '120px',
            fontSize: '16px'
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          title={is3D ? "Cambiar a vista 2D" : "Cambiar a vista 3D"}
        >
          <div className="flex flex-col items-center justify-center h-full">
            {is3D ? (
              <BarChart3 className="w-12 h-12 text-white mb-2" />
            ) : (
              <Box className="w-12 h-12 text-white mb-2" />
            )}
            <span className="text-white text-lg font-bold">
              {is3D ? "2D" : "3D"}
            </span>
          </div>
        </motion.button>

        {/* Vista condicional 2D/3D */}
        <motion.div
          key={is3D ? '3d' : '2d'}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.5 }}
        >
          {is3D ? (
            <>
              {console.log('Renderizando Chart3DView')}
              <Chart3DView data={data} width={800} height={400} />
            </>
          ) : (
            <>
              {console.log('Renderizando SVG 2D')}
              <svg
                ref={svgRef}
                width={800}
                height={400}
                className="w-full h-auto"
                style={{
                  background: '#ffffff',
                  borderRadius: '8px',
                }}
              />
            </>
          )}
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default Chart;