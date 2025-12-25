/**
 * ComplianceChart Component
 * D3.js line chart showing employee trends across occupational levels
 */

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

export default function ComplianceChart({ report }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Handle responsive resizing
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width } = entry.contentRect;
        const height = 400;
        setDimensions({ width, height });
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (!report || !svgRef.current || dimensions.width === 0) return;

    // Safety checks for report structure
    if (!report.levels || !Array.isArray(report.levels) || report.levels.length === 0) {
      console.warn('ComplianceChart: Invalid report structure or empty levels');
      return;
    }

    try {
      // Prepare data for line chart
      const levelData = report.levels.map((level, index) => ({
        name: level.level || 'Unknown',
        index: index,
        status: level.status || 'NON_COMPLIANT',
        totalEmployees: level.totalEmployees || 0,
        designated: level.designated || 0,
        currentPercentage: level.currentPercentage || 0,
        targetPercentage: level.targetPercentage || 0,
        gap: level.gap || 0,
      }));

      // Clear previous content
      d3.select(svgRef.current).selectAll('*').remove();

      const { width, height } = dimensions;
      const margin = { top: 30, right: 150, bottom: 60, left: 60 };
      const chartWidth = width - margin.left - margin.right;
      const chartHeight = height - margin.top - margin.bottom;

      const svg = d3
        .select(svgRef.current)
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);

      // Scales
      const xScale = d3.scaleLinear()
        .domain([0, levelData.length - 1])
        .range([0, chartWidth]);

      const yScale = d3.scaleLinear()
        .domain([0, d3.max(levelData, d => d.totalEmployees) * 1.1])
        .range([chartHeight, 0]);

      // Line generator
      const line = d3.line()
        .x((d, i) => xScale(i))
        .y(d => yScale(d.totalEmployees))
        .curve(d3.curveMonotoneX);

      // Color by status
      const getStatusColor = (status) => {
        switch (status) {
          case 'COMPLIANT':
            return '#10b981';
          case 'NEAR_COMPLIANT':
            return '#f59e0b';
          case 'NON_COMPLIANT':
            return '#ef4444';
          default:
            return '#9ca3af';
        }
      };

      // Draw grid lines
      svg.append('g')
        .attr('class', 'grid')
        .selectAll('line')
        .data(yScale.ticks(5))
        .enter()
        .append('line')
        .attr('x1', 0)
        .attr('x2', chartWidth)
        .attr('y1', d => yScale(d))
        .attr('y2', d => yScale(d))
        .attr('stroke', '#e5e7eb')
        .attr('stroke-width', 1);

      // Draw the line
      svg.append('path')
        .datum(levelData)
        .attr('fill', 'none')
        .attr('stroke', '#3b82f6')
        .attr('stroke-width', 3)
        .attr('d', line);

      // Draw points
      const points = svg.selectAll('.point')
        .data(levelData)
        .enter()
        .append('g')
        .attr('class', 'point')
        .attr('transform', (d, i) => `translate(${xScale(i)}, ${yScale(d.totalEmployees)})`)
        .style('cursor', 'pointer')
        .on('mouseenter', function(event, d) {
          d3.select(this).select('circle')
            .transition()
            .duration(150)
            .attr('r', 8);
          setHoveredPoint(d);
        })
        .on('mouseleave', function() {
          d3.select(this).select('circle')
            .transition()
            .duration(150)
            .attr('r', 6);
          setHoveredPoint(null);
        });

      // Add circles for each point
      points.append('circle')
        .attr('r', 6)
        .attr('fill', d => getStatusColor(d.status))
        .attr('stroke', 'white')
        .attr('stroke-width', 2);

      // X-axis
      const xAxis = d3.axisBottom(xScale)
        .ticks(levelData.length)
        .tickFormat((d, i) => {
          const level = levelData[i];
          if (!level) return '';
          return getLevelShortLabel(level.name);
        });

      svg.append('g')
        .attr('transform', `translate(0, ${chartHeight})`)
        .call(xAxis)
        .selectAll('text')
        .attr('font-size', '11px')
        .attr('fill', '#6b7280')
        .style('text-anchor', 'end')
        .attr('dx', '-0.5em')
        .attr('dy', '0.5em')
        .attr('transform', 'rotate(-35)');

      // Y-axis
      const yAxis = d3.axisLeft(yScale)
        .ticks(5);

      svg.append('g')
        .call(yAxis)
        .selectAll('text')
        .attr('font-size', '11px')
        .attr('fill', '#6b7280');

      // Y-axis label
      svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -chartHeight / 2)
        .attr('y', -40)
        .attr('text-anchor', 'middle')
        .attr('font-size', '12px')
        .attr('font-weight', '500')
        .attr('fill', '#6b7280')
        .text('Total Employees');

      // Legend
      const legendData = [
        { status: 'COMPLIANT', label: 'Compliant' },
        { status: 'NEAR_COMPLIANT', label: 'Near Target' },
        { status: 'NON_COMPLIANT', label: 'Non-Compliant' },
      ];

      const legend = svg.append('g')
        .attr('transform', `translate(${chartWidth + 20}, 0)`);

      legendData.forEach((item, i) => {
        const legendItem = legend.append('g')
          .attr('transform', `translate(0, ${i * 25})`);

        legendItem.append('circle')
          .attr('cx', 6)
          .attr('cy', 6)
          .attr('r', 6)
          .attr('fill', getStatusColor(item.status))
          .attr('stroke', 'white')
          .attr('stroke-width', 2);

        legendItem.append('text')
          .attr('x', 20)
          .attr('y', 10)
          .attr('font-size', '12px')
          .attr('font-weight', '500')
          .attr('fill', '#374151')
          .text(item.label);
      });

    } catch (error) {
      console.error('ComplianceChart: Error rendering chart', error);
    }
  }, [report, dimensions]);

  const getLevelLabel = (level) => {
    const labels = {
      TOP_MANAGEMENT: 'Top Management',
      SENIOR_MANAGEMENT: 'Senior Management',
      PROFESSIONALLY_QUALIFIED_MID_MANAGEMENT: 'Prof & Mid Management',
      SKILLED_TECHNICAL: 'Skilled Technical',
      SEMI_SKILLED: 'Semi-Skilled',
      UNSKILLED: 'Unskilled',
    };
    return labels[level] || level;
  };

  const getLevelShortLabel = (level) => {
    const labels = {
      TOP_MANAGEMENT: 'Top Mgmt',
      SENIOR_MANAGEMENT: 'Senior Mgmt',
      PROFESSIONALLY_QUALIFIED_MID_MANAGEMENT: 'Prof & Mid',
      SKILLED_TECHNICAL: 'Skilled Tech',
      SEMI_SKILLED: 'Semi-Skilled',
      UNSKILLED: 'Unskilled',
    };
    return labels[level] || level;
  };

  // Don't render if report is invalid
  if (!report || !report.levels || report.levels.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900 mb-1">
          Employee Distribution by Level
        </h3>
        <p className="text-sm text-gray-600">
          Total employees across occupational levels
        </p>
      </div>

      <div ref={containerRef} className="w-full">
        <svg ref={svgRef}></svg>
      </div>

      {hoveredPoint && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-3">
            {getLevelLabel(hoveredPoint.name)}
          </h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-600">Total Employees:</span>
              <span className="ml-2 font-semibold text-gray-900">
                {hoveredPoint.totalEmployees}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Designated:</span>
              <span className="ml-2 font-semibold text-gray-900">
                {hoveredPoint.designated} ({hoveredPoint.currentPercentage.toFixed(1)}%)
              </span>
            </div>
            <div>
              <span className="text-gray-600">Target:</span>
              <span className="ml-2 font-semibold text-gray-900">
                {hoveredPoint.targetPercentage.toFixed(1)}%
              </span>
            </div>
            <div>
              <span className="text-gray-600">Gap:</span>
              <span className={`ml-2 font-semibold ${
                hoveredPoint.gap <= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {hoveredPoint.gap > 0 ? '+' : ''}{hoveredPoint.gap.toFixed(1)}%
              </span>
            </div>
            <div>
              <span className="text-gray-600">Status:</span>
              <span className={`ml-2 font-semibold ${
                hoveredPoint.status === 'COMPLIANT' ? 'text-green-600' :
                hoveredPoint.status === 'NEAR_COMPLIANT' ? 'text-amber-600' : 'text-red-600'
              }`}>
                {hoveredPoint.status === 'COMPLIANT' ? 'Compliant' :
                 hoveredPoint.status === 'NEAR_COMPLIANT' ? 'Near Target' : 'Non-Compliant'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
