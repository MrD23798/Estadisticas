import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import * as d3 from 'd3';

interface ComparisonData {
  objectType: string;
  count: number;
}

interface ComparisonProps {
  dataA: ComparisonData[];
  dataB: ComparisonData[];
  labelA: string;
  labelB: string;
}

const Comparison: React.FC<ComparisonProps> = ({ dataA, dataB, labelA, labelB }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !dataA || !dataB || dataA.length === 0 || dataB.length === 0) return;

    // Limpiar SVG anterior
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current);
    const width = 800;
    const height = 400;
    const margin = { top: 40, right: 30, bottom: 80, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Crear grupo principal
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Combinar datos para obtener todas las categorías
    const allCategories = Array.from(new Set([
      ...dataA.map(d => d.objectType),
      ...dataB.map(d => d.objectType)
    ]));

    // Preparar datos para comparación
    const comparisonData = allCategories.map(category => {
      const valueA = dataA.find(d => d.objectType === category)?.count || 0;
      const valueB = dataB.find(d => d.objectType === category)?.count || 0;
      return {
        category,
        valueA,
        valueB
      };
    });

    // Escalas
    const xScale = d3.scaleBand()
      .domain(allCategories)
      .range([0, innerWidth])
      .padding(0.2);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(comparisonData, d => Math.max(d.valueA, d.valueB)) || 0])
      .range([innerHeight, 0]);

    // Crear grupos para cada categoría
    const categoryGroups = g.selectAll('.category-group')
      .data(comparisonData)
      .enter()
      .append('g')
      .attr('class', 'category-group')
      .attr('transform', d => `translate(${xScale(d.category)}, 0)`);

    // Barras para dataset A
    const barsA = categoryGroups.append('rect')
      .attr('class', 'bar-a')
      .attr('x', 0)
      .attr('width', xScale.bandwidth() / 2 - 2)
      .attr('y', innerHeight)
      .attr('height', 0)
      .attr('fill', '#3b82f6')
      .attr('rx', 3);

    // Barras para dataset B
    const barsB = categoryGroups.append('rect')
      .attr('class', 'bar-b')
      .attr('x', xScale.bandwidth() / 2 + 2)
      .attr('width', xScale.bandwidth() / 2 - 2)
      .attr('y', innerHeight)
      .attr('height', 0)
      .attr('fill', '#ef4444')
      .attr('rx', 3);

    // Animación de las barras A
    barsA.transition()
      .duration(1000)
      .ease(d3.easeElastic)
      .attr('y', d => yScale(d.valueA))
      .attr('height', d => innerHeight - yScale(d.valueA));

    // Animación de las barras B
    barsB.transition()
      .duration(1000)
      .delay(200)
      .ease(d3.easeElastic)
      .attr('y', d => yScale(d.valueB))
      .attr('height', d => innerHeight - yScale(d.valueB));

    // Etiquetas para dataset A
    const labelsA = categoryGroups.append('text')
      .attr('class', 'label-a')
      .attr('x', xScale.bandwidth() / 4)
      .attr('y', innerHeight)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .attr('fill', '#3b82f6')
      .text(d => d.valueA);

    // Etiquetas para dataset B
    const labelsB = categoryGroups.append('text')
      .attr('class', 'label-b')
      .attr('x', (xScale.bandwidth() / 4) * 3)
      .attr('y', innerHeight)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .attr('fill', '#ef4444')
      .text(d => d.valueB);

    // Animación de las etiquetas A
    labelsA.transition()
      .duration(1000)
      .delay(800)
      .attr('y', d => yScale(d.valueA) - 5);

    // Animación de las etiquetas B
    labelsB.transition()
      .duration(1000)
      .delay(1000)
      .attr('y', d => yScale(d.valueB) - 5);

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
      .style('font-size', '11px');

    // Eje Y
    const yAxis = d3.axisLeft(yScale);
    g.append('g')
      .call(yAxis)
      .style('font-size', '11px');

    // Título del eje Y
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - margin.left)
      .attr('x', 0 - (innerHeight / 2))
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .text('Cantidad');

    // Leyenda
    const legend = svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${width - 150}, 20)`);

    // Elemento de leyenda A
    const legendA = legend.append('g')
      .attr('transform', 'translate(0, 0)');

    legendA.append('rect')
      .attr('width', 15)
      .attr('height', 15)
      .attr('fill', '#3b82f6')
      .attr('rx', 2);

    legendA.append('text')
      .attr('x', 20)
      .attr('y', 12)
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .text(labelA);

    // Elemento de leyenda B
    const legendB = legend.append('g')
      .attr('transform', 'translate(0, 25)');

    legendB.append('rect')
      .attr('width', 15)
      .attr('height', 15)
      .attr('fill', '#ef4444')
      .attr('rx', 2);

    legendB.append('text')
      .attr('x', 20)
      .attr('y', 12)
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .text(labelB);

    // Interactividad
    barsA
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

    barsB
      .on('mouseover', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('fill', '#dc2626');
      })
      .on('mouseout', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('fill', '#ef4444');
      });

  }, [dataA, dataB, labelA, labelB]);

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
          Gráfico de Comparación
        </h3>
        <p className="text-sm text-gray-600">
          Comparación entre {labelA} y {labelB}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="bg-white rounded-lg shadow-lg p-4"
      >
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
      </motion.div>
    </motion.div>
  );
};

export default Comparison;