import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { PhiloTreeColors } from '../constants/Colors';

interface NodePosition {
  x: number;
  y: number;
}

interface ConnectionLineProps {
  startPos: NodePosition;
  endPos: NodePosition;
  isSelected?: boolean;
  isDashed?: boolean;
}

export default function ConnectionLine({ startPos, endPos, isSelected, isDashed = false }: ConnectionLineProps) {
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

  // サンキー風ベジェ曲線の制御点（上下方向にカーブ）
  const c1x = x1;
  const c1y = y1 + (y2 - y1) * 0.5;
  const c2x = x2;
  const c2y = y1 + (y2 - y1) * 0.5;
  const pathData = `M ${x1},${y1} C ${c1x},${c1y} ${c2x},${c2y} ${x2},${y2}`;

  return (
    <Svg
      style={{ position: 'absolute', left: minX, top: minY, pointerEvents: 'none' }}
      width={width}
      height={height}
    >
      <Path
        d={pathData}
        stroke={isSelected ? PhiloTreeColors.connectionLineSelected : PhiloTreeColors.connectionLine}
        strokeWidth={3}
        strokeDasharray={isDashed ? '8,8' : undefined}
        fill="none"
        strokeLinecap="round"
      />
    </Svg>
  );
}

// スタイルは不要 