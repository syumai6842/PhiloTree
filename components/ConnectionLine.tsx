import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';
import { useTheme } from '../contexts/ThemeContext';

interface NodePosition {
  x: number;
  y: number;
}

interface ConnectionLineProps {
  startPos: NodePosition;
  endPos: NodePosition;
  isSelected?: boolean;
  isDashed?: boolean;
  startNode?: any; // 開始ノード（サイズ計算用）
  endNode?: any;   // 終了ノード（サイズ計算用）
  startNodeSize?: { width: number; height: number };
  endNodeSize?: { width: number; height: number };
}

export default function ConnectionLine({ startPos, endPos, isSelected, isDashed = false, startNode, endNode, startNodeSize, endNodeSize }: ConnectionLineProps) {
  const { colors } = useTheme();
  // サイズが渡されていない場合のデフォルト
  const getNodeSize = (node: any, isCriticism: boolean = false) => {
    if (isCriticism) {
      return { width: 120, height: 60 };
    } else {
      return { width: 120, height: 60 };
    }
  };

  // ノードサイズを取得
  const startSize = startNodeSize || getNodeSize(startNode, startNode?.isCriticism);
  const endSize = endNodeSize || getNodeSize(endNode, endNode?.isCriticism);

  // ノードの境界を計算（中心座標から境界座標に変換）
  const startX = startPos.x;
  const startY = startPos.y;
  const endX = endPos.x;
  const endY = endPos.y;

  // 接続線の方向を計算
  const deltaX = endX - startX;
  const deltaY = endY - startY;
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

  // ノード境界での接続点を計算
  let connectionStartX = startX;
  let connectionStartY = startY;
  let connectionEndX = endX;
  let connectionEndY = endY;

  if (distance > 0) {
    // 開始ノードの境界点を計算
    const startUnitX = deltaX / distance;
    const startUnitY = deltaY / distance;
    const startHalfWidth = startSize.width / 2;
    const startHalfHeight = startSize.height / 2;
    let startT = Infinity;
    if (Math.abs(startUnitX) > 0.001) {
      startT = Math.min(startT, startHalfWidth / Math.abs(startUnitX));
    }
    if (Math.abs(startUnitY) > 0.001) {
      startT = Math.min(startT, startHalfHeight / Math.abs(startUnitY));
    }
    connectionStartX = startX + startUnitX * startT;
    connectionStartY = startY + startUnitY * startT;

    // 終了ノードの境界点を計算
    const endUnitX = -startUnitX; // 反対方向
    const endUnitY = -startUnitY;
    const endHalfWidth = endSize.width / 2;
    const endHalfHeight = endSize.height / 2;
    let endT = Infinity;
    if (Math.abs(endUnitX) > 0.001) {
      endT = Math.min(endT, endHalfWidth / Math.abs(endUnitX));
    }
    if (Math.abs(endUnitY) > 0.001) {
      endT = Math.min(endT, endHalfHeight / Math.abs(endUnitY));
    }
    connectionEndX = endX + endUnitX * endT;
    connectionEndY = endY + endUnitY * endT;
  }

  // SVGの描画領域
  const circleRadius = 8;
  const minX = Math.min(connectionStartX, connectionEndX) - circleRadius;
  const minY = Math.min(connectionStartY, connectionEndY) - circleRadius;
  const width = Math.abs(connectionEndX - connectionStartX) + circleRadius * 2 || circleRadius * 2;
  const height = Math.abs(connectionEndY - connectionStartY) + circleRadius * 2 || circleRadius * 2;

  // SVGの線の始点・終点（ローカル座標）
  const x1 = connectionStartX - minX;
  const y1 = connectionStartY - minY;
  const x2 = connectionEndX - minX;
  const y2 = connectionEndY - minY;

  // 直線のパスデータ
  const pathData = `M ${x1},${y1} L ${x2},${y2}`;

  // 透明度のグラデーションで有向グラフを表現
  const strokeOpacities = [0.2, 0.4, 0.6, 0.8, 1.0]; // 透明から不透明まで

  return (
    <Svg
      style={{ position: 'absolute', left: minX, top: minY, pointerEvents: 'none' }}
      width={width}
      height={height}
    >
      {/* 複数の線を重ねて透明度グラデーション効果を作る */}
      {strokeOpacities.map((opacity, index) => (
        <Path
          key={index}
          d={pathData}
          stroke={isSelected ? colors.connectionLineSelected : colors.connectionLine}
          strokeWidth={3}
          strokeDasharray={isDashed ? '8,8' : undefined}
          fill="none"
          strokeLinecap="round"
          opacity={opacity}
        />
      ))}
      
      {/* 終点に丸を追加して方向性を表現 */}
      <Circle
        cx={x2}
        cy={y2}
        r={8}
        fill={isSelected ? colors.connectionLineSelected : colors.connectionLine}
        opacity={1.0}
      />
    </Svg>
  );
}

// スタイルは不要 