import React, { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
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

// ThoughtMapPropsにrefをforwardする
export interface ThoughtMapHandle {
  focusNode: (nodeId: string) => void;
}

const ThoughtMap = forwardRef<ThoughtMapHandle, ThoughtMapProps>(
  function ThoughtMap({ onNodePress, onNodeLongPress, onAddChildNode }, ref) {
    const { state, setSelectedNode, setZoom, setPan } = useThoughtMap();
    const pan = useRef(new Animated.ValueXY()).current;
    const scale = useRef(new Animated.Value(1)).current;

    // ノード・批評ノード両方の位置を計算
    const nodePositions = useMemo(() => {
      const positions: Record<string, NodePosition> = {};
      const nodeLevels: Record<string, number> = {};
      const levelNodes: Record<number, string[]> = {};
      const parentChildMap: Record<string, string[]> = {};
      const nodeCriticisms: Record<string, string[]> = {}; // 各ノードの批評を記録

      // ルートノード（親がいないNode）
      const rootNodes = state.nodes.filter(node => node.parent_ids.length === 0);
      const rootCriticisms = state.criticisms.filter(c => !c.node_id);

      // ノードサイズを動的に計算する関数
      const calculateNodeSize = (node: any, isCriticism: boolean = false) => {
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
      };

      // Nodeのレベル計算と親子関係の構築
      const calculateLevel = (nodeId: string, level: number = 0, parentId?: string) => {
        if (nodeLevels[nodeId] !== undefined) return nodeLevels[nodeId];
        nodeLevels[nodeId] = level;
        if (!levelNodes[level]) levelNodes[level] = [];
        levelNodes[level].push(nodeId);
        
        // 親子関係を記録
        if (parentId) {
          if (!parentChildMap[parentId]) parentChildMap[parentId] = [];
          parentChildMap[parentId].push(nodeId);
        }
        
        // 子ノード
        const children = state.nodes.filter(node => node.parent_ids.includes(nodeId));
        children.forEach(child => calculateLevel(child.id, level + 1, nodeId));
        // 批評ノード（node_idがこのnodeIdのもの）
        const criticisms = state.criticisms.filter(c => c.node_id === nodeId);
        criticisms.forEach(c => calculateLevel(c.id, level + 1, nodeId));
      };
      rootNodes.forEach(node => calculateLevel(node.id, 0));
      rootCriticisms.forEach(c => calculateLevel(c.id, 0));

      // 各ノードの批評を記録
      state.criticisms.forEach(criticism => {
        if (criticism.node_id) {
          if (!nodeCriticisms[criticism.node_id]) nodeCriticisms[criticism.node_id] = [];
          nodeCriticisms[criticism.node_id].push(criticism.id);
        }
      });

      // 最小間隔
      const minSpacing = 120; // より大きな間隔
      const levelSpacing = 280; // レベル間の間隔をさらに大きく
      const criticismSpacing = 80; // 批評ノード間の間隔

      // 重なり検出と回避関数
      const checkOverlap = (pos1: NodePosition, size1: number, pos2: NodePosition, size2: number) => {
        const margin = 30; // 追加のマージン
        return !(pos1.x + size1 + margin < pos2.x || pos2.x + size2 + margin < pos1.x ||
                pos1.y + size1 + margin < pos2.y || pos2.y + size2 + margin < pos1.y);
      };

      // ノード位置を調整する関数
      const adjustPosition = (id: string, proposedPos: NodePosition, nodeSize: number) => {
        let adjustedPos = { ...proposedPos };
        let attempts = 0;
        const maxAttempts = 15;
        
        while (attempts < maxAttempts) {
          let hasOverlap = false;
          
          // 既存のノードとの重なりをチェック
          for (const [existingId, existingPos] of Object.entries(positions)) {
            if (existingId === id) continue;
            
            const existingNode = state.nodes.find(n => n.id === existingId);
            const existingCriticism = state.criticisms.find(c => c.id === existingId);
            const existingSize = existingNode ? calculateNodeSize(existingNode, false) : 
                                existingCriticism ? calculateNodeSize(existingCriticism, true) : 120;
            
            if (checkOverlap(adjustedPos, nodeSize, existingPos, existingSize)) {
              hasOverlap = true;
              // 右に移動して重なりを回避
              adjustedPos.x += nodeSize + minSpacing;
              break;
            }
          }
          
          if (!hasOverlap) break;
          attempts++;
        }
        
        return adjustedPos;
      };

      // 各レベルでノード・批評ノードを配置（重なり防止）
      Object.keys(levelNodes).forEach(levelStr => {
        const level = parseInt(levelStr);
        const nodesInLevel = levelNodes[level];
        
        // 各ノードのサイズを計算
        const nodeSizes = nodesInLevel.map(id => {
          const node = state.nodes.find(n => n.id === id);
          const criticism = state.criticisms.find(c => c.id === id);
          if (node) {
            return calculateNodeSize(node, false);
          } else if (criticism) {
            return calculateNodeSize(criticism, true);
          }
          return 120; // デフォルトサイズ
        });
        
        // レベル0（ルートレベル）の場合は中央揃えで配置
        if (level === 0) {
          const totalWidth = nodeSizes.reduce((sum, size) => sum + size, 0) + (nodesInLevel.length - 1) * minSpacing;
          const levelWidth = Math.min(screenWidth * 0.6, totalWidth); // より小さくして余裕を持たせる
          const nodeSpacing = nodesInLevel.length > 1 ? (levelWidth - nodeSizes.reduce((sum, size) => sum + size, 0)) / (nodesInLevel.length - 1) : 0;
          const startX = (screenWidth - levelWidth) / 2;
          
          let currentX = startX;
          nodesInLevel.forEach((id, index) => {
            const nodeSize = nodeSizes[index];
            const proposedPos = { x: currentX, y: 120 + level * levelSpacing };
            const adjustedPos = adjustPosition(id, proposedPos, nodeSize);
            positions[id] = adjustedPos;
            currentX += nodeSize + nodeSpacing;
          });
        } else {
          // 子レベルは親ノードの下に配置
          nodesInLevel.forEach((id, index) => {
            const nodeSize = nodeSizes[index];
            
            // 親ノードを探す
            let parentId: string | undefined;
            const node = state.nodes.find(n => n.id === id);
            const criticism = state.criticisms.find(c => c.id === id);
            
            if (node && node.parent_ids.length > 0) {
              parentId = node.parent_ids[0]; // 最初の親を使用
            } else if (criticism && criticism.node_id) {
              parentId = criticism.node_id;
            }
            
            if (parentId && positions[parentId]) {
              // 親ノードの下に配置
              const parentPos = positions[parentId];
              const parentNode = state.nodes.find(n => n.id === parentId);
              const parentCriticism = state.criticisms.find(c => c.id === parentId);
              const parentSize = parentNode ? calculateNodeSize(parentNode, false) : 
                                parentCriticism ? calculateNodeSize(parentCriticism, true) : 120;
              
              // 同じ親を持つ他の子ノードの数を数える
              const siblings = parentChildMap[parentId] || [];
              const siblingIndex = siblings.indexOf(id);
              const totalSiblings = siblings.length;
              
              // 親ノードの中心を基準に配置
              const parentCenterX = parentPos.x + parentSize / 2;
              const totalSiblingsWidth = totalSiblings * nodeSize + (totalSiblings - 1) * minSpacing;
              const startX = parentCenterX - totalSiblingsWidth / 2;
              
              const proposedPos = { 
                x: startX + siblingIndex * (nodeSize + minSpacing),
                y: parentPos.y + parentSize / 2 + 80 + level * levelSpacing // より大きな間隔
              };
              
              const adjustedPos = adjustPosition(id, proposedPos, nodeSize);
              positions[id] = adjustedPos;
            } else {
              // 親が見つからない場合は中央揃えで配置
              const totalWidth = nodeSizes.reduce((sum, size) => sum + size, 0) + (nodesInLevel.length - 1) * minSpacing;
              const levelWidth = Math.min(screenWidth * 0.6, totalWidth);
              const nodeSpacing = nodesInLevel.length > 1 ? (levelWidth - nodeSizes.reduce((sum, size) => sum + size, 0)) / (nodesInLevel.length - 1) : 0;
              const startX = (screenWidth - levelWidth) / 2;
              
              let currentX = startX;
              nodesInLevel.forEach((nodeId, idx) => {
                if (idx === index) {
                  const proposedPos = { x: currentX, y: 120 + level * levelSpacing };
                  const adjustedPos = adjustPosition(id, proposedPos, nodeSize);
                  positions[id] = adjustedPos;
                }
                currentX += nodeSizes[idx] + nodeSpacing;
              });
            }
          });
        }
      });

      // 批評ノードを左右に配置
      Object.keys(nodeCriticisms).forEach(nodeId => {
        const criticisms = nodeCriticisms[nodeId];
        if (criticisms.length === 0 || !positions[nodeId]) return;

        const nodePos = positions[nodeId];
        const node = state.nodes.find(n => n.id === nodeId);
        const nodeSize = node ? calculateNodeSize(node, false) : 120;

        // 批評ノードを左右に分ける
        const leftCriticisms = criticisms.slice(0, Math.ceil(criticisms.length / 2));
        const rightCriticisms = criticisms.slice(Math.ceil(criticisms.length / 2));

        // 左側の批評ノードを配置
        leftCriticisms.forEach((criticismId, index) => {
          const criticism = state.criticisms.find(c => c.id === criticismId);
          if (!criticism) return;

          const criticismSize = calculateNodeSize(criticism, true);
          const criticismY = nodePos.y + nodeSize / 2 + 40;
          
          // 左側に配置（ノードの左端から左に）
          const leftStartX = nodePos.x - criticismSize - criticismSpacing;
          const proposedPos = {
            x: leftStartX - index * (criticismSize + criticismSpacing),
            y: criticismY
          };
          
          const adjustedPos = adjustPosition(criticismId, proposedPos, criticismSize);
          positions[criticismId] = adjustedPos;
        });

        // 右側の批評ノードを配置
        rightCriticisms.forEach((criticismId, index) => {
          const criticism = state.criticisms.find(c => c.id === criticismId);
          if (!criticism) return;

          const criticismSize = calculateNodeSize(criticism, true);
          const criticismY = nodePos.y + nodeSize / 2 + 40;
          
          // 右側に配置（ノードの右端から右に）
          const rightStartX = nodePos.x + nodeSize + criticismSpacing;
          const proposedPos = {
            x: rightStartX + index * (criticismSize + criticismSpacing),
            y: criticismY
          };
          
          const adjustedPos = adjustPosition(criticismId, proposedPos, criticismSize);
          positions[criticismId] = adjustedPos;
        });
      });

      return positions;
    }, [state.nodes, state.criticisms]);

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

    // ノード位置にパン・ズームするメソッド
    useImperativeHandle(ref, () => ({
      focusNode: (nodeId: string) => {
        const pos = nodePositions[nodeId];
        if (!pos) return;
        
        // ノードサイズを動的に計算
        const node = state.nodes.find(n => n.id === nodeId);
        const criticism = state.criticisms.find(c => c.id === nodeId);
        let nodeSize = 120; // デフォルトサイズ
        
        if (node) {
          const titleLength = node.title.length;
          if (titleLength <= 10) nodeSize = 100;
          else if (titleLength <= 20) nodeSize = 120;
          else if (titleLength <= 30) nodeSize = 140;
          else if (titleLength <= 40) nodeSize = 160;
          else if (titleLength <= 50) nodeSize = 180;
          else nodeSize = 200;
        } else if (criticism) {
          const titleLength = (criticism.title || '（タイトルなし）').length;
          if (titleLength <= 10) nodeSize = 80;
          else if (titleLength <= 20) nodeSize = 100;
          else if (titleLength <= 30) nodeSize = 120;
          else if (titleLength <= 40) nodeSize = 140;
          else if (titleLength <= 50) nodeSize = 160;
          else nodeSize = 180;
        }
        
        // 画面中央に来るようにパンを計算
        const centerX = screenWidth / 2;
        const centerY = screenHeight / 2;
        const targetX = centerX - pos.x - nodeSize / 2;
        const targetY = centerY - pos.y - nodeSize / 2;
        pan.setValue({ x: targetX, y: targetY });
        setPan({ x: targetX, y: targetY });
        setSelectedNode(nodeId);
      }
    }), [nodePositions, setPan, setSelectedNode, state.nodes, state.criticisms]);

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

          {/* 接続線（Node→Node, Node→Criticism） */}
          {state.nodes.map((node) => {
            const nodePos = nodePositions[node.id];
            if (!nodePos) return null;
            // Node→Node
            const nodeLines = node.parent_ids.map((parentId) => {
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
            // Node→Criticism
            const criticismLines = state.criticisms.filter(c => c.node_id === node.id).map(c => {
              const cPos = nodePositions[c.id];
              if (!cPos) return null;
              return (
                <ConnectionLine
                  key={`connection-${node.id}-criticism-${c.id}`}
                  startPos={nodePos}
                  endPos={cPos}
                  isSelected={state.selectedNodeId === node.id || state.selectedNodeId === c.id}
                  isDashed={true}
                />
              );
            });
            return [...nodeLines, ...criticismLines];
          })}

          {/* ノード描画 */}
          {state.nodes.map((node) => {
            const position = nodePositions[node.id];
            if (!position) return null;
            return (
              <ThoughtNode
                key={node.id}
                node={node}
                position={position}
                isSelected={state.selectedNodeId === node.id}
                isCriticism={false}
                onSelect={() => setSelectedNode(node.id)}
                onPress={() => handleNodePress(node)}
                onLongPress={() => handleNodeLongPress(node)}
                onAddChild={() => handleAddChildNode(node)}
              />
            );
          })}
          {/* 批評ノード描画 */}
          {state.criticisms.map((c) => {
            const position = nodePositions[c.id];
            if (!position) return null;
            // 子ノードを持たない批評ノードを判定
            const hasChild = state.nodes.some(node => node.parent_ids.includes(c.id)) || state.criticisms.some(cc => cc.node_id === c.id);
            return (
              <ThoughtNode
                key={c.id}
                node={c as any}
                position={position}
                isSelected={state.selectedNodeId === c.id}
                isCriticism={true}
                isOrphanCriticism={!hasChild}
                onSelect={() => setSelectedNode(c.id)}
                onPress={() => onNodePress?.(c as any)}
                onLongPress={() => onNodeLongPress?.(c as any)}
                onAddChild={() => onAddChildNode?.(c as any)}
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
);

export default ThoughtMap;

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