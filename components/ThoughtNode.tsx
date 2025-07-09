import React, { useMemo, useRef, useState } from 'react';
import {
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { PhiloTreeColors } from '../constants/Colors';

const { width: screenWidth } = Dimensions.get('window');

interface NodePosition {
  x: number;
  y: number;
}

interface ThoughtNodeProps {
  node: any; // NodeまたはCriticism
  position: NodePosition;
  isSelected?: boolean;
  isCriticism?: boolean;
  isOrphanCriticism?: boolean;
  onPress?: () => void; // ダブルタップで内容表示
  onSelect?: () => void; // シングルタップで選択
  onLongPress?: () => void;
  onAddChild?: () => void;
}

export default function ThoughtNode({
  node,
  position,
  isSelected = false,
  isCriticism = false,
  isOrphanCriticism = false,
  onPress,
  onSelect,
  onLongPress,
  onAddChild,
}: ThoughtNodeProps) {
  const getNodeColor = () => {
    if (isOrphanCriticism) return '#fff';
    if (isCriticism) return PhiloTreeColors.nodeCriticism;
    if (isSelected) return PhiloTreeColors.nodeSelected;
    return PhiloTreeColors.nodeNormal;
  };

  // タイトルの長さに基づいてノードサイズを動的に計算
  const nodeSize = useMemo(() => {
    const title = isCriticism ? (node.title || '（タイトルなし）') : node.title;
    const titleLength = title.length;
    
    // 基本サイズ
    let baseSize = 120;
    
    // タイトル長に応じてサイズを調整
    if (titleLength <= 10) {
      baseSize = 100;
    } else if (titleLength <= 20) {
      baseSize = 120;
    } else if (titleLength <= 30) {
      baseSize = 140;
    } else if (titleLength <= 40) {
      baseSize = 160;
    } else if (titleLength <= 50) {
      baseSize = 180;
    } else {
      baseSize = 200;
    }
    
    // 批評ノードは少し小さく
    if (isCriticism) {
      baseSize = Math.max(80, baseSize - 20);
    }
    
    return baseSize;
  }, [node.title, isCriticism]);

  // フォントサイズも動的に調整
  const fontSize = useMemo(() => {
    const title = isCriticism ? (node.title || '（タイトルなし）') : node.title;
    const titleLength = title.length;
    
    if (titleLength <= 10) return 16;
    if (titleLength <= 20) return 14;
    if (titleLength <= 30) return 13;
    if (titleLength <= 40) return 12;
    if (titleLength <= 50) return 11;
    return 10;
  }, [node.title, isCriticism]);

  // ノードサイズ計測用
  const [size, setSize] = useState({ width: 120, height: 60 });

  // ダブルタップ判定
  const lastTap = useRef(0);
  const handleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      onPress?.();
    } else {
      onSelect?.();
    }
    lastTap.current = now;
  };

  return (
    <View
      style={[
        styles.nodeContainer,
        {
          left: position.x - size.width / 2,
          top: position.y - size.height / 2,
        },
      ]}
      onLayout={e => {
        const { width, height } = e.nativeEvent.layout;
        if (width !== size.width || height !== size.height) {
          setSize({ width, height });
        }
      }}
    >
      <TouchableOpacity
        style={[
          styles.node,
          isCriticism ? styles.criticismNode : styles.normalNode,
          isOrphanCriticism && styles.orphanCriticismNode,
          {
            backgroundColor: getNodeColor(),
            borderColor: isSelected ? PhiloTreeColors.textPrimary : 'transparent',
          },
        ]}
        onPress={handleTap}
        onLongPress={onLongPress}
        activeOpacity={0.8}
      >
        <View style={styles.nodeContent}>
          <Text 
            style={[
              styles.nodeTitle, 
              { fontSize },
              isOrphanCriticism && { color: '#111', fontWeight: 'bold' }
            ]}
            ellipsizeMode="tail"
          >
            {isCriticism ? (node.title || '（タイトルなし）') : node.title}
          </Text>
          {node.source_gpt && !isCriticism && (
            <View style={styles.sourceBadge}>
              <Text style={styles.sourceText}>GPT</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
      {/* 子ノード追加ボタンは選択時のみ表示 */}
      {isSelected && (
        <TouchableOpacity
          style={styles.addChildButton}
          onPress={() => {
            onAddChild?.();
          }}
          activeOpacity={0.8}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.addChildButtonText}>+</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  nodeContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  node: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    elevation: 8,
    shadowColor: PhiloTreeColors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    minWidth: 120,
    maxWidth: 260,
    minHeight: 60,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  normalNode: {
    borderRadius: 12,
  },
  criticismNode: {
    borderRadius: 60,
  },
  nodeContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  nodeTitle: {
    fontWeight: 'bold',
    color: PhiloTreeColors.textPrimary,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 240,
    minWidth: 100,
  },
  sourceBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: PhiloTreeColors.info,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  sourceText: {
    fontSize: 10,
    color: PhiloTreeColors.textPrimary,
    fontWeight: 'bold',
  },
  addChildButton: {
    position: 'absolute',
    bottom: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: PhiloTreeColors.nodeNormal,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: PhiloTreeColors.background,
    elevation: 10,
    shadowColor: PhiloTreeColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  addChildButtonText: {
    fontSize: 24,
    color: PhiloTreeColors.textPrimary,
    fontWeight: 'bold',
  },
  orphanCriticismNode: {
    borderColor: '#000',
  },
}); 