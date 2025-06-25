import React from 'react';
import { StyleSheet, View } from 'react-native';
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

export default function ConnectionLine({ startPos, endPos, isSelected }: ConnectionLineProps) {
  // 接続線の計算
  const startX = startPos.x + 60; // 親ノードの中心
  const startY = startPos.y + 60;
  const endX = endPos.x + 60; // 子ノードの中心
  const endY = endPos.y + 60;

  // 線の長さと角度を計算
  const deltaX = endX - startX;
  const deltaY = endY - startY;
  const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;

  // 線のスタイル
  const lineStyle = {
    position: 'absolute' as const,
    left: startX,
    top: startY,
    width: length,
    height: 2,
    backgroundColor: isSelected ? PhiloTreeColors.connectionLineSelected : PhiloTreeColors.connectionLine,
    transform: [
      { translateX: -length / 2 },
      { translateY: -1 },
      { rotate: `${angle}deg` },
    ],
  };

  return (
    <View style={lineStyle} />
  );
}

const styles = StyleSheet.create({
  // スタイルはインラインで適用
}); 