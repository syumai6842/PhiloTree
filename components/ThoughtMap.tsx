import React, { useMemo, useRef } from 'react';
import {
    Animated,
    Dimensions,
    PanResponder,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { PhiloTreeColors } from '../constants/Colors';
import { useThoughtMap } from '../contexts/ThoughtMapContext';
import { Node } from '../types';
import ConnectionLine from './ConnectionLine';
import ThoughtNode from './ThoughtNode';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ThoughtMapProps {
  onNodePress?: (node: Node) => void;
  onNodeLongPress?: (node: Node) => void;
  onAddChildNode?: (parentNode: Node) => void;
}

interface NodePosition {
  x: number;
  y: number;
}

export default function ThoughtMap({ onNodePress, onNodeLongPress, onAddChildNode }: ThoughtMapProps) {
  const { state, setSelectedNode, setZoom, setPan } = useThoughtMap();
  const pan = useRef(new Animated.ValueXY()).current;
  const scale = useRef(new Animated.Value(1)).current;

  // 自動レイアウト計算
  const nodePositions = useMemo(() => {
    const positions: Record<string, NodePosition> = {};
    const nodeLevels: Record<string, number> = {};
    const levelNodes: Record<number, string[]> = {};

    // ルートノードを特定
    const rootNodes = state.nodes.filter(node => node.parent_ids.length === 0);
    
    // 各ノードのレベルを計算
    const calculateLevel = (nodeId: string, level: number = 0) => {
      if (nodeLevels[nodeId] !== undefined) return nodeLevels[nodeId];
      
      nodeLevels[nodeId] = level;
      if (!levelNodes[level]) levelNodes[level] = [];
      levelNodes[level].push(nodeId);

      // 子ノードのレベルを計算
      const children = state.nodes.filter(node => node.parent_ids.includes(nodeId));
      children.forEach(child => calculateLevel(child.id, level + 1));
    };

    rootNodes.forEach(node => calculateLevel(node.id, 0));

    // 各レベルでノードを配置
    Object.keys(levelNodes).forEach(levelStr => {
      const level = parseInt(levelStr);
      const nodesInLevel = levelNodes[level];
      const levelWidth = screenWidth * 0.8;
      const nodeSpacing = levelWidth / (nodesInLevel.length + 1);
      const startX = (screenWidth - levelWidth) / 2;

      nodesInLevel.forEach((nodeId, index) => {
        const x = startX + nodeSpacing * (index + 1);
        const y = 100 + level * 150;
        positions[nodeId] = { x, y };
      });
    });

    return positions;
  }, [state.nodes]);

  // パンジェスチャー設定
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => {
        // ノードやボタンがタップされた場合はパンジェスチャーを無効にする
        return false;
      },
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // 移動距離が一定以上の場合のみパンジェスチャーを有効にする
        return Math.abs(gestureState.dx) > 10 || Math.abs(gestureState.dy) > 10;
      },
      onPanResponderGrant: () => {
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: () => {
        pan.flattenOffset();
        setPan({ x: (pan.x as any)._value, y: (pan.y as any)._value });
      },
    })
  ).current;

  // ズームジェスチャー設定
  const handlePinchGesture = (event: any) => {
    const { scale: newScale } = event.nativeEvent;
    const clampedScale = Math.max(0.5, Math.min(3, newScale));
    scale.setValue(clampedScale);
    setZoom(clampedScale);
  };

  // ノード選択処理
  const handleNodePress = (node: Node) => {
    setSelectedNode(node.id);
    onNodePress?.(node);
  };

  // ノード長押し処理
  const handleNodeLongPress = (node: Node) => {
    onNodeLongPress?.(node);
  };

  // 子ノード追加処理
  const handleAddChildNode = (parentNode: Node) => {
    console.log('ThoughtMap handleAddChildNode called with parentNode:', parentNode.id);
    onAddChildNode?.(parentNode);
  };

  // 背景タップで選択解除
  const handleBackgroundPress = () => {
    setSelectedNode(undefined);
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.mapContainer,
          {
            transform: [
              { translateX: pan.x },
              { translateY: pan.y },
              { scale: scale },
            ],
          },
        ]}
        {...panResponder.panHandlers}
      >
        {/* 背景 */}
        <TouchableOpacity
          style={styles.background}
          onPress={handleBackgroundPress}
          activeOpacity={1}
        />

        {/* 接続線 */}
        {state.nodes.map((node) => {
          const nodePos = nodePositions[node.id];
          if (!nodePos) return null;

          return node.parent_ids.map((parentId) => {
            const parentPos = nodePositions[parentId];
            if (!parentPos) return null;

            return (
              <ConnectionLine
                key={`connection-${parentId}-${node.id}`}
                startPos={parentPos}
                endPos={nodePos}
                isSelected={state.selectedNodeId === node.id || state.selectedNodeId === parentId}
              />
            );
          });
        })}

        {/* ノード */}
        {state.nodes.map((node) => {
          const position = nodePositions[node.id];
          if (!position) return null;

          return (
            <ThoughtNode
              key={node.id}
              node={node}
              position={position}
              isSelected={state.selectedNodeId === node.id}
              onPress={() => handleNodePress(node)}
              onLongPress={() => handleNodeLongPress(node)}
              onAddChild={() => handleAddChildNode(node)}
            />
          );
        })}
      </Animated.View>

      {/* ズームコントロール */}
      <View style={styles.zoomControls}>
        <TouchableOpacity
          style={styles.zoomButton}
          onPress={() => {
            const newScale = Math.min(3, state.zoom + 0.2);
            scale.setValue(newScale);
            setZoom(newScale);
          }}
        >
          <Text style={styles.zoomButtonText}>+</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.zoomButton}
          onPress={() => {
            const newScale = Math.max(0.5, state.zoom - 0.2);
            scale.setValue(newScale);
            setZoom(newScale);
          }}
        >
          <Text style={styles.zoomButtonText}>-</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PhiloTreeColors.background,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: PhiloTreeColors.background,
  },
  zoomControls: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    flexDirection: 'column',
  },
  zoomButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: PhiloTreeColors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: PhiloTreeColors.border,
  },
  zoomButtonText: {
    fontSize: 24,
    color: PhiloTreeColors.textPrimary,
    fontWeight: 'bold',
  },
}); 