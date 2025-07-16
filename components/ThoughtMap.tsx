import * as d3 from 'd3-force';
import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useThoughtMap } from '../contexts/ThoughtMapContext';
import { Node } from '../types';
import CompletionGauge from './CompletionGauge';
import ConnectionLine from './ConnectionLine';
import ThoughtNode from './ThoughtNode';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ThoughtMapProps {
  onNodePress?: (node: Node) => void;
  onNodeLongPress?: (node: Node) => void;
  onAddChildNode?: (parentNode: Node) => void;
  onNodeSelect?: (node: Node) => void;
  parentAddTargetNodeId?: string | null;
  setParentAddTargetNodeId?: (id: string | null) => void;
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
  function ThoughtMap({ onNodePress, onNodeLongPress, onAddChildNode, onNodeSelect, parentAddTargetNodeId, setParentAddTargetNodeId }, ref) {
    const { state, setSelectedNode, setZoom, setPan, deleteNode, deleteCriticism } = useThoughtMap();
    const { colors, currentTheme } = useTheme();
    const pan = useRef(new Animated.ValueXY()).current;
    const scale = useRef(new Animated.Value(0.7)).current; // 初期ズームを0.7に

    // ノードサイズ管理
    const [nodeSizes, setNodeSizes] = useState<{ [id: string]: { width: number; height: number } }>({});

    // ノード・エッジデータをd3-force用に変換
    // 型宣言ファイル追加（プロジェクトルートにtypes/d3-force.d.tsを作成）
    // declare module 'd3-force';

    // ノード型を明示
    const nodeIds = new Set([
      ...state.nodes.map(n => n.id),
      ...state.criticisms.map(c => c.id)
    ]);
    const nodes: { id: string; x?: number; y?: number }[] = [
      ...state.nodes.map(n => ({ id: n.id })),
      ...state.criticisms.map(c => ({ id: c.id }))
    ];
    const links = [
      // 通常ノードの親子関係
      ...state.nodes.flatMap(n =>
        n.parent_ids
          .filter(pid => nodeIds.has(pid)) // 存在しない親IDは除外
          .map(pid => ({ source: pid, target: n.id }))
      ),
      // 批評ノードの親子関係（node_idが親）
      ...state.criticisms
        .filter(c => c.node_id && nodeIds.has(c.node_id))
        .map(c => ({ source: c.node_id, target: c.id }))
    ];

    // d3-forceで座標計算
    const [forcePositions, setForcePositions] = useState<{ [id: string]: { x: number; y: number } }>({});
    useEffect(() => {
      if (nodes.length === 0) return;
      
      // ノードの階層レベルを計算（根拠→結果の流れ）
      const calculateNodeLevel = (nodeId: string, visited: Set<string> = new Set()): number => {
        if (visited.has(nodeId)) return 0; // 循環参照を防ぐ
        visited.add(nodeId);
        
        const node = state.nodes.find(n => n.id === nodeId);
        if (!node || node.parent_ids.length === 0) {
          return 0; // ルートノードはレベル0
        }
        
        // 親ノードの最大レベル + 1
        const parentLevels = node.parent_ids.map(pid => calculateNodeLevel(pid, new Set(visited)));
        return Math.max(...parentLevels) + 1;
      };
      
      // 各ノードのレベルを計算
      const nodeLevels: { [id: string]: number } = {};
      nodes.forEach(n => {
        nodeLevels[n.id] = calculateNodeLevel(n.id);
      });
      
      // 批評ノードのレベルを親ノードより少し下に設定
      state.criticisms.forEach(c => {
        if (c.node_id) {
          nodeLevels[c.id] = nodeLevels[c.node_id] + 0.5; // 親ノードより少し下
        } else {
          nodeLevels[c.id] = 0; // 親がない批評ノード
        }
      });
      
      // ノードサイズを考慮したcollision forceの設定
      const simulation = d3.forceSimulation(nodes)
        .force('link', d3.forceLink(links)
          .id((d: {id: string}) => d.id)
          .distance((link: any) => {
            // 批評ノードへのリンクだけ短く
            const isCriticism = state.criticisms.some(c => c.id === link.target.id || c.id === link.target);
            return isCriticism ? 60 : 100;
          })
        )
        .force('charge', d3.forceManyBody().strength(-300)) // 斥力を少し弱める
        .force('center', d3.forceCenter(screenWidth / 2, screenHeight / 2))
        .force('collision', d3.forceCollide().radius((d: any) => {
          // ノードサイズに基づいて半径を設定（最小60px）
          const nodeSize = nodeSizes[d.id];
          if (nodeSize) {
            return Math.max(nodeSize.width, nodeSize.height) / 2 + 30; // マージンを30pxに増加
          }
          return 60; // デフォルトサイズ
        }))
        .force('y', d3.forceY((d: any) => {
          // レベルに基づいてY座標を設定（レベルが高いほど下に）
          const level = nodeLevels[d.id] || 0;
          const baseY = screenHeight / 2;
          const levelSpacing = 150; // レベル間の距離
          return baseY + (level * levelSpacing);
        }).strength(0.3)) // Y軸方向の力を適度に設定
        .alphaDecay(0.1) // より早く安定化
        .velocityDecay(0.4) // 速度減衰を強める
        .stop();
      
      // より多くのイテレーションで安定化
      for (let i = 0; i < 500; ++i) simulation.tick();
      
      // 結果を保存
      const pos: { [id: string]: { x: number; y: number } } = {};
      nodes.forEach(n => {
        pos[n.id] = { x: n.x ?? 0, y: n.y ?? 0 };
      });
      setForcePositions(pos);
    }, [state.nodes, nodeSizes, state.criticisms]); // state.criticismsも依存配列に追加

    // 達成度データを計算
    const completionData = useMemo(() => {
      // 選択されたノードがある場合
      if (state.selectedNodeId) {
        const selectedNode = state.nodes.find(n => n.id === state.selectedNodeId) || 
                           state.criticisms.find(c => c.id === state.selectedNodeId);
        
        if (selectedNode) {
          // 選択されたノードの下にある批評ノードを取得
          const getCriticismsBelow = (nodeId: string, visited: Set<string> = new Set()): string[] => {
            if (visited.has(nodeId)) return [];
            visited.add(nodeId);
            
            const criticisms: string[] = [];
            
            // 直接の批評ノード
            const directCriticisms = state.criticisms.filter(c => c.node_id === nodeId);
            criticisms.push(...directCriticisms.map(c => c.id));
            
            // 子ノードの批評ノードも再帰的に取得
            const childNodes = state.nodes.filter(n => n.parent_ids.includes(nodeId));
            childNodes.forEach(child => {
              criticisms.push(...getCriticismsBelow(child.id, new Set(visited)));
            });
            
            return criticisms;
          };
          
          const criticismsBelow = getCriticismsBelow(selectedNode.id);
          
          // 批評ノードのうち、子ノードを持つものをカウント
          const criticismsWithChildren = criticismsBelow.filter(criticismId => {
            // 批評ノードが子ノード（通常ノードまたは他の批評ノード）を持っているかチェック
            const hasChildNodes = state.nodes.some(node => node.parent_ids.includes(criticismId));
            const hasChildCriticisms = state.criticisms.some(c => c.node_id === criticismId);
            return hasChildNodes || hasChildCriticisms;
          });
          
          return {
            completed: criticismsWithChildren.length,
            total: criticismsBelow.length,
            percentage: criticismsBelow.length > 0 ? Math.round((criticismsWithChildren.length / criticismsBelow.length) * 100) : 0
          };
        }
      }
      
      // 何も選択していない場合：すべての批評ノードのうち子ノードを持つものをカウント
      const allCriticisms = state.criticisms;
      const criticismsWithChildren = allCriticisms.filter(criticism => {
        const hasChildNodes = state.nodes.some(node => node.parent_ids.includes(criticism.id));
        const hasChildCriticisms = state.criticisms.some(c => c.node_id === criticism.id);
        return hasChildNodes || hasChildCriticisms;
      });
      
      return {
        completed: criticismsWithChildren.length,
        total: allCriticisms.length,
        percentage: allCriticisms.length > 0 ? Math.round((criticismsWithChildren.length / allCriticisms.length) * 100) : 0
      };
    }, [state.nodes, state.criticisms, state.selectedNodeId]);

    // canvasサイズを自動調整
    const canvasPadding = 200;
    const allPositions = Object.values(forcePositions);
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
      onAddChildNode?.(parentNode);
    };

    // 背景タップで選択解除
    const handleBackgroundPress = () => {
      setSelectedNode(undefined);
    };

    // ノード削除ハンドラ
    const handleDeleteNode = (node: Node) => {
      Alert.alert(
        'ノード削除',
        '本当にこのノードを削除しますか？',
        [
          { text: 'キャンセル', style: 'cancel' },
          { text: '削除', style: 'destructive', onPress: async () => {
            console.log('Alert削除ボタンonPress呼び出し');
            deleteNode(node.id);
          } },
        ]
      );
    };
    // 批評ノード削除ハンドラ
    const handleDeleteCriticism = (criticism: any) => {
      Alert.alert(
        '批評ノード削除',
        '本当にこの批評ノードを削除しますか？',
        [
          { text: 'キャンセル', style: 'cancel' },
          { text: '削除', style: 'destructive', onPress: async () => {
            console.log('Alert削除ボタンonPress呼び出し');
            deleteCriticism(criticism.id);
          } },
        ]
      );
    };

    // ノード位置にパン・ズームするメソッド
    useImperativeHandle(ref, () => ({
      focusNode: (nodeId: string) => {
        const pos = forcePositions[nodeId];
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
        const targetX = centerX - pos.x;
        const targetY = centerY - pos.y;
        pan.setValue({ x: targetX, y: targetY });
        setPan({ x: targetX, y: targetY });
        setSelectedNode(nodeId);
      }
    }), [forcePositions, setPan, setSelectedNode, state.nodes, state.criticisms]);

    // スタイルをコンポーネント内で定義
    const styles = StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: colors.background,
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
        backgroundColor: colors.background,
      },
      completionGaugeContainer: {
        position: 'absolute',
        top: 20,
        left: 20,
        right: 20,
        zIndex: 1000,
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
        backgroundColor: colors.backgroundSecondary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
        borderWidth: 1,
        borderColor: colors.border,
      },
      zoomButtonText: {
        fontSize: 24,
        color: currentTheme === 'light' ? '#000' : colors.textPrimary,
        fontWeight: 'bold',
      },
    });

    return (
      <View style={styles.container}>
        {/* 達成度ゲージ - 常に最前面に表示 */}
        <View style={styles.completionGaugeContainer}>
          <CompletionGauge 
            completed={completionData.completed}
            total={completionData.total}
            percentage={completionData.percentage}
          />
        </View>

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
            const nodePos = forcePositions[node.id];
            if (!nodePos) return null;
            
            // Node→Node, Criticism→Node（親が通常ノードまたは批評ノード）
            const nodeLines = node.parent_ids.map((parentId) => {
              const parentPos = forcePositions[parentId];
              // 親が通常ノードか批評ノードかを判定
              const parentNode = state.nodes.find(n => n.id === parentId) || state.criticisms.find(c => c.id === parentId);
              if (!parentPos || !parentNode) {
                return null;
              }
              // 批評ノードの場合はisCriticismフラグを付与
              const isParentCriticism = !!state.criticisms.find(c => c.id === parentId);
              const parentNodeWithFlag = isParentCriticism ? { ...parentNode, isCriticism: true } : parentNode;
              return (
                <ConnectionLine
                  key={`connection-${parentId}-${node.id}`}
                  startPos={parentPos}
                  endPos={nodePos}
                  startNode={parentNodeWithFlag}
                  endNode={node}
                  startNodeSize={nodeSizes[parentId]}
                  endNodeSize={nodeSizes[node.id]}
                  isSelected={state.selectedNodeId === node.id || state.selectedNodeId === parentId}
                  isDashed={false} // 批評ノードを親に持つノードは実線
                />
              );
            });
            // ノードを親にもつ批評ノード（点線）
            const criticismLines = state.criticisms.filter(c => c.node_id === node.id).map(c => {
              const cPos = forcePositions[c.id];
              if (!cPos) {
                return null;
              }
              // 批評ノードにisCriticismフラグを追加
              const criticismNode = { ...c, isCriticism: true };
              return (
                <ConnectionLine
                  key={`connection-${node.id}-criticism-${c.id}`}
                  startPos={nodePos}
                  endPos={cPos}
                  startNode={node}
                  endNode={criticismNode}
                  startNodeSize={nodeSizes[node.id]}
                  endNodeSize={nodeSizes[c.id]}
                  isSelected={state.selectedNodeId === node.id || state.selectedNodeId === c.id}
                  isDashed={true} // ノードを親にもつ批評ノードは点線
                />
              );
            });
            return [...nodeLines, ...criticismLines];
          })}

          {/* ノード描画 */}
          {state.nodes.map((node) => {
            const position = forcePositions[node.id];
            if (!position) return null;
            return (
              <ThoughtNode
                key={node.id}
                node={node}
                position={position}
                isSelected={state.selectedNodeId === node.id}
                isCriticism={false}
                onSelect={() => onNodeSelect?.(node)}
                onPress={() => handleNodePress(node)}
                onLongPress={() => handleNodeLongPress(node)}
                onAddChild={() => handleAddChildNode(node)}
                onAddParent={setParentAddTargetNodeId ? () => setParentAddTargetNodeId(node.id) : undefined}
                parentAddTargetNodeId={parentAddTargetNodeId}
                onLayout={({ width, height }) => {
                  setNodeSizes(sizes => ({ ...sizes, [node.id]: { width, height } }));
                }}
              />
            );
          })}
          {/* 批評ノード描画 */}
          {state.criticisms.map((c) => {
            const position = forcePositions[c.id];
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
                onLayout={({ width, height }) => {
                  setNodeSizes(sizes => ({ ...sizes, [c.id]: { width, height } }));
                }}
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
              const newScale = Math.max(0.3, state.zoom - 0.2); // 最小ズームを0.3に
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