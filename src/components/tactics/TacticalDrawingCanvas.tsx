'use client';

import React, { useRef, useState, useEffect } from 'react';
import { TacticalDrawnLine } from '@/types/tactics';

interface TacticalDrawingCanvasProps {
  lines: TacticalDrawnLine[];
  activeColor: string;
  lineWidth?: number;
  isDrawingMode: boolean;
  onAddLine: (line: TacticalDrawnLine) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export default function TacticalDrawingCanvas({
  lines,
  activeColor,
  lineWidth = 4,
  isDrawingMode,
  onAddLine,
  containerRef,
}: TacticalDrawingCanvasProps) {
  const [currentStroke, setCurrentStroke] = useState<{ x: number; y: number }[] | null>(null);
  const isMouseDownRef = useRef(false);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } | null => {
    if (!containerRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;

    let clientX = 0;
    let clientY = 0;

    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));

    return { x, y };
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawingMode) return;
    const pt = getCoordinates(e);
    if (!pt) return;
    isMouseDownRef.current = true;
    setCurrentStroke([pt]);
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawingMode || !isMouseDownRef.current || !currentStroke) return;
    const pt = getCoordinates(e);
    if (!pt) return;

    // Throttle / minimum distance
    const last = currentStroke[currentStroke.length - 1];
    const dist = Math.hypot(pt.x - last.x, pt.y - last.y);
    if (dist > 0.5) {
      setCurrentStroke((prev) => (prev ? [...prev, pt] : [pt]));
    }
  };

  const handlePointerUp = () => {
    if (!isDrawingMode || !isMouseDownRef.current) return;
    isMouseDownRef.current = false;

    if (currentStroke && currentStroke.length > 1) {
      const newLine: TacticalDrawnLine = {
        id: `line_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        points: currentStroke,
        color: activeColor,
        width: lineWidth,
      };
      onAddLine(newLine);
    }
    setCurrentStroke(null);
  };

  const renderPathD = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return '';
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      d += ` L ${points[i].x} ${points[i].y}`;
    }
    return d;
  };

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className={`absolute inset-0 w-full h-full pointer-events-none select-none z-10 ${
        isDrawingMode ? 'pointer-events-auto cursor-crosshair' : ''
      }`}
      onMouseDown={handlePointerDown}
      onMouseMove={handlePointerMove}
      onMouseUp={handlePointerUp}
      onTouchStart={handlePointerDown}
      onTouchMove={handlePointerMove}
      onTouchEnd={handlePointerUp}
    >
      <defs>
        {/* Dynamic Arrow Markers */}
        <marker
          id="arrowhead-red"
          markerWidth="4"
          markerHeight="4"
          refX="2"
          refY="2"
          orient="auto"
        >
          <polygon points="0 0, 4 2, 0 4" fill="#f43f5e" />
        </marker>
        <marker
          id="arrowhead-blue"
          markerWidth="4"
          markerHeight="4"
          refX="2"
          refY="2"
          orient="auto"
        >
          <polygon points="0 0, 4 2, 0 4" fill="#3b82f6" />
        </marker>
        <marker
          id="arrowhead-amber"
          markerWidth="4"
          markerHeight="4"
          refX="2"
          refY="2"
          orient="auto"
        >
          <polygon points="0 0, 4 2, 0 4" fill="#f59e0b" />
        </marker>
        <marker
          id="arrowhead-emerald"
          markerWidth="4"
          markerHeight="4"
          refX="2"
          refY="2"
          orient="auto"
        >
          <polygon points="0 0, 4 2, 0 4" fill="#10b981" />
        </marker>
      </defs>

      {/* Render Saved Lines */}
      {lines.map((line) => {
        const d = renderPathD(line.points);
        return (
          <g key={line.id}>
            {/* Glow/Shadow background */}
            <path
              d={d}
              fill="none"
              stroke="#000000"
              strokeWidth={line.width * 0.4}
              strokeOpacity="0.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Main Path */}
            <path
              d={d}
              fill="none"
              stroke={line.color}
              strokeWidth={line.width * 0.25}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={line.points.length > 5 ? undefined : '1 1'}
            />
            {/* Direction Arrow on end */}
            {line.points.length > 2 && (
              <circle
                cx={line.points[line.points.length - 1].x}
                cy={line.points[line.points.length - 1].y}
                r={line.width * 0.2}
                fill={line.color}
                stroke="#ffffff"
                strokeWidth="0.2"
              />
            )}
          </g>
        );
      })}

      {/* Render Active In-progress Stroke */}
      {currentStroke && currentStroke.length > 1 && (
        <path
          d={renderPathD(currentStroke)}
          fill="none"
          stroke={activeColor}
          strokeWidth={lineWidth * 0.25}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="animate-pulse"
        />
      )}
    </svg>
  );
}

