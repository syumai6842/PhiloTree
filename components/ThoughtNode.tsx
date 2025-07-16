import React, { useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

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
  onAddParent?: () => void; // 親ノード追加ボタン用
  parentAddTargetNodeId?: string | null; // 親ノード追加モード用
  onLayout?: (size: { width: number; height: number }) => void; // 追加
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
  onAddParent,
  parentAddTargetNodeId,
  onLayout,
}: ThoughtNodeProps) {
  const { colors } = useTheme();

  const getNodeColor = () => {
    if (isOrphanCriticism) return '#fff';
    if (isCriticism) return colors.nodeCriticism;
    if (isSelected) return colors.nodeSelected;
    return colors.nodeNormal;
  };

  // 固定サイズを使用
  const nodeSize = useMemo(() => {
    // 批評ノードは少し小さく
    if (isCriticism) {
      return 100;
    }
    return 120;
  }, [isCriticism]);

  // 固定フォントサイズ
  const fontSize = useMemo(() => {
    return isCriticism ? 12 : 14;
  }, [isCriticism]);

  // ノードサイズ計測用
  const [size, setSize] = useState<{ width: number; height: number }>({ width: 120, height: 60 });

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



  // 中心座標から左上座標に変換
  const left = position.x - nodeSize / 2;
  const top = position.y - nodeSize / 2;

  // スタイルをコンポーネント内で定義
  const styles = StyleSheet.create({
    nodeContainer: {
      position: 'absolute',
      alignItems: 'center',
    },
    node: {
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 8,
      borderWidth: 3,
      elevation: 8,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
    },
    normalNode: {
      minWidth: 120,
      minHeight: 60,
      padding: 8,
    },
    criticismNode: {
      minWidth: 100,
      minHeight: 50,
      padding: 6,
    },
    orphanCriticismNode: {
      borderStyle: 'dashed',
    },
    nodeContent: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    nodeTitle: {
      fontWeight: 'bold',
      color: colors.textPrimary,
      textAlign: 'center',
      lineHeight: 18,
    },
    sourceBadge: {
      position: 'absolute',
      top: 5,
      right: 5,
      backgroundColor: colors.info,
      borderRadius: 10,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    sourceText: {
      fontSize: 10,
      color: colors.textPrimary,
      fontWeight: 'bold',
    },
    addChildButton: {
      position: 'absolute',
      bottom: -20,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.nodeNormal,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 3,
      borderColor: colors.background,
      elevation: 10,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.5,
      shadowRadius: 4,
    },
    addChildButtonText: {
      fontSize: 24,
      color: colors.textPrimary,
      fontWeight: 'bold',
    },
    deleteButton: {
      position: 'absolute',
      top: -18,
      right: -18,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: '#f44',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10,
      elevation: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
    },
    deleteButtonText: {
      color: '#fff',
      fontSize: 20,
      fontWeight: 'bold',
      lineHeight: 20,
    },
  });

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
        setSize({ width, height });
        onLayout?.({ width, height });
      }}
    >
      {/* 親ノード追加ボタン（選択時のみ上部に表示） */}
      {isSelected && onAddParent && (
        <TouchableOpacity
          style={[
            styles.addChildButton,
            { top: -30, bottom: undefined, backgroundColor: '#4A90E2', borderColor: '#fff' },
          ]}
          onPress={onAddParent}
          activeOpacity={0.8}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={[styles.addChildButtonText, { color: '#fff' }]}>↑</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity
        style={[
          styles.node,
          isCriticism ? styles.criticismNode : styles.normalNode,
          isOrphanCriticism && styles.orphanCriticismNode,
          {
            backgroundColor: getNodeColor(),
            borderColor: isSelected ? colors.textPrimary : 'transparent',
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