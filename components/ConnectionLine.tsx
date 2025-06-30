import React from 'react';
import Svg, { Line } from 'react-native-svg';
import { PhiloTreeColors } from '../constants/Colors';

interface NodePosition {
  x: number;
  y: number;
}

interface ConnectionLineProps {
  startPos: NodePosition;
  endPos: NodePosition;
  isSelected?: boolean;
}

export default function ConnectionLine({ startPos, endPos, isSelected, isDashed = false }: ConnectionLineProps & { isDashed?: boolean }) {
  // ノード中心座標
  const startX = startPos.x + 60;
  const startY = startPos.y + 60;
  const endX = endPos.x + 60;
  const endY = endPos.y + 60;

  // SVGの描画領域
  const minX = Math.min(startX, endX);
  const minY = Math.min(startY, endY);
  const width = Math.abs(endX - startX) || 2;
  const height = Math.abs(endY - startY) || 2;

  // SVGの線の始点・終点（ローカル座標）
  const x1 = startX - minX;
  const y1 = startY - minY;
  const x2 = endX - minX;
  const y2 = endY - minY;

  return (
    <Svg
      style={{ position: 'absolute', left: minX, top: minY, pointerEvents: 'none' }}
      width={width}
      height={height}
    >
      <Line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={isSelected ? PhiloTreeColors.connectionLineSelected : PhiloTreeColors.connectionLine}
        strokeWidth={3}
        strokeLinecap="round"
        strokeDasharray={isDashed ? '8,8' : undefined}
      />
    </Svg>
  );
}

// スタイルは不要 