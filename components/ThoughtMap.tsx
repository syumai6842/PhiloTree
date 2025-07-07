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
      const NODE_WIDTH = 120;
      const NODE_HEIGHT = 60;
      const Y_GAP = 100;
      const X_GAP = 180;

      // 1. ノードの階層（深さ）を計算
      const nodeDepths: Record<string, number> = {};
      function setDepth(nodeId: string, depth: number, visited: Set<string> = new Set()) {
        if (visited.has(nodeId)) return;
        visited.add(nodeId);
        if (nodeDepths[nodeId] === undefined || nodeDepths[nodeId] < depth) {
          nodeDepths[nodeId] = depth;
          // 子ノード
          state.nodes.filter(n => n.parent_ids.includes(nodeId)).forEach(child => setDepth(child.id, depth + 1, new Set(visited)));
          // 批評ノード
          state.criticisms.filter(c => c.node_id === nodeId).forEach(crit => setDepth(crit.id, depth + 1, new Set(visited)));
        }
      }
      // ルートノードから深さを設定
      state.nodes.filter(n => n.parent_ids.length === 0).forEach(root => setDepth(root.id, 0));
      // ルートを持たない批評ノードも0に
      state.criticisms.filter(c => !c.node_id).forEach(crit => setDepth(crit.id, 0));

      // 2. 各階層ごとにノードをまとめる（批評ノードは除外）
      const nodesByDepth: Record<number, string[]> = {};
      Object.entries(nodeDepths).forEach(([id, depth]) => {
        if (state.criticisms.some(c => c.id === id)) return;
        if (!nodesByDepth[depth]) nodesByDepth[depth] = [];
        nodesByDepth[depth].push(id);
      });

      // 3. 各階層ごとに「批評ノード階層」を挿入するか判定
      //    - 批評ノードを持つノードがいる階層を記録
      const insertCriticismLayer: Record<number, boolean> = {};
      Object.entries(nodesByDepth).forEach(([depthStr, ids]) => {
        const depth = Number(depthStr);
        // この階層のノードのうち、批評ノードを持つものがいるか
        const hasCriticisms = ids.some(id => {
          const node = state.nodes.find(n => n.id === id);
          return node && state.criticisms.some(c => c.node_id === node.id);
        });
        if (hasCriticisms) {
          insertCriticismLayer[depth] = true;
        }
      });

      // 4. Y座標計算用に、各階層の「実際のYインデックス」を作る
      //    - 批評ノード階層を挿入した分だけYをずらす
      const depthToYIndex: Record<number, number> = {};
      let yIndex = 0;
      const maxDepth = Math.max(...Object.keys(nodesByDepth).map(Number));
      for (let d = 0; d <= maxDepth; d++) {
        depthToYIndex[d] = yIndex;
        if (insertCriticismLayer[d]) {
          yIndex += 2; // 批評ノード階層を挿入
        } else {
          yIndex += 1;
        }
      }

      // 5. 各ノードの子要素の幅を計算
      const nodeChildWidths: Record<string, number> = {};
      
      // 最下層から上に向かって子要素の幅を計算
      const depths = Object.keys(nodesByDepth).map(Number).sort((a, b) => b - a);
      depths.forEach(depth => {
        const ids = nodesByDepth[depth] || [];
        ids.forEach(id => {
          const node = state.nodes.find(n => n.id === id);
          if (!node) return;
          
          // 子ノードの幅を取得
          const childNodes = state.nodes.filter(n => n.parent_ids.includes(id));
          const childCriticisms = state.criticisms.filter(c => c.node_id === id);
          
          if (childNodes.length === 0 && childCriticisms.length === 0) {
            // 子要素がない場合は固定幅
            nodeChildWidths[id] = NODE_WIDTH;
          } else {
            // 子要素がある場合は子要素の幅の合計を計算
            let totalChildWidth = 0;
            childNodes.forEach(child => {
              totalChildWidth += nodeChildWidths[child.id] || NODE_WIDTH;
            });
            childCriticisms.forEach(crit => {
              totalChildWidth += NODE_WIDTH; // 批評ノードは固定幅
            });
            
            // 子要素間のギャップを追加
            const totalChildren = childNodes.length + childCriticisms.length;
            if (totalChildren > 1) {
              totalChildWidth += (totalChildren - 1) * X_GAP;
            }
            
            // 親ノードの幅は子要素の幅の平均値に制限
            const averageChildWidth = totalChildWidth / totalChildren;
            nodeChildWidths[id] = Math.max(NODE_WIDTH, Math.min(totalChildWidth, averageChildWidth * 2));
          }
        });
      });

      // 6. ノードを配置（子要素の幅に基づいて）
      Object.entries(nodesByDepth).forEach(([depthStr, ids]) => {
        const depth = Number(depthStr);
        const y = 80 + depthToYIndex[depth] * Y_GAP;
        
        // この階層の全幅を計算
        let totalWidth = 0;
        ids.forEach(id => {
          totalWidth += nodeChildWidths[id] || NODE_WIDTH;
        });
        if (ids.length > 1) {
          totalWidth += (ids.length - 1) * X_GAP;
        }
        
        let startX = Math.max(80, (screenWidth - totalWidth) / 2);
        let currentX = startX;
        
        ids.forEach((id, idx) => {
          const nodeWidth = nodeChildWidths[id] || NODE_WIDTH;
          positions[id] = { x: currentX + nodeWidth / 2, y: y + NODE_HEIGHT / 2 };
          currentX += nodeWidth + X_GAP;
        });
      });

      // 7. 批評ノードを「批評ノード階層」に配置
      Object.entries(nodesByDepth).forEach(([depthStr, ids]) => {
        const depth = Number(depthStr);
        if (!insertCriticismLayer[depth]) return;
        
        // この階層のノードの批評ノードを集める
        let criticisms: any[] = [];
        ids.forEach(id => {
          const node = state.nodes.find(n => n.id === id);
          if (!node) return;
          const nodeCriticisms = state.criticisms.filter(c => c.node_id === node.id);
          criticisms.push(...nodeCriticisms);
        });
        
        if (criticisms.length === 0) return;
        
        // 批評ノード階層に配置
        const y = 80 + (depthToYIndex[depth] + 1) * Y_GAP;
        const totalWidth = criticisms.length * NODE_WIDTH + (criticisms.length - 1) * X_GAP;
        let startX = Math.max(80, (screenWidth - totalWidth) / 2);
        let currentX = startX;
        criticisms.forEach((crit, idx) => {
          positions[crit.id] = { x: currentX + NODE_WIDTH / 2, y: y + NODE_HEIGHT / 2 };
          currentX += NODE_WIDTH + X_GAP;
        });
      });

      return positions;
    }, [state.nodes, state.criticisms]);

    // canvasサイズを自動調整
    const canvasPadding = 200;
    const allPositions = Object.values(nodePositions);
    const minX = allPositions.length ? Math.min(...allPositions.map(p => p.x)) : 0;
    const minY = allPositions.length ? Math.min(...allPositions.map(p => p.y)) : 0;
    const maxX = allPositions.length ? Math.max(...allPositions.map(p => p.x)) : screenWidth;
    const maxY = allPositions.length ? Math.max(...allPositions.map(p => p.y)) : screenHeight;
    const canvasWidth = maxX - minX + canvasPadding * 2;
    const canvasHeight = maxY - minY + canvasPadding * 2;

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
    const handleNodeSelect = (node: Node) => {
      setSelectedNode(node.id);
    };
    const handleNodePress = (node: Node) => {
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
              width: canvasWidth,
              height: canvasHeight,
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
            style={[styles.background, { width: canvasWidth, height: canvasHeight }]}
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
                onSelect={() => handleNodeSelect(node)}
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
                node={c}
                position={position}
                isSelected={state.selectedNodeId === c.id}
                isCriticism={true}
                isOrphanCriticism={!hasChild}
                onSelect={() => handleNodeSelect(c as any)}
                onPress={() => handleNodePress(c as any)}
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