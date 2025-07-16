import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Modal,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import NodeDetail, { NodeDetailHandle } from '../../components/NodeDetail';
import ThoughtMap, { ThoughtMapHandle } from '../../components/ThoughtMap';
import { PhiloTreeColors } from '../../constants/Colors';
import { useFocusNode } from '../../contexts/FocusNodeContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useThoughtMap } from '../../contexts/ThoughtMapContext';
import { Node } from '../../types';

export default function ThoughtMapScreen() {
  const { state, loadState, addNode, getCompletionRate, setSelectedNode, updateNode } = useThoughtMap();
  const [nodeDetailVisible, setNodeDetailVisible] = useState(false);
  const [titleInputVisible, setTitleInputVisible] = useState(false);
  const [parentNode, setParentNode] = useState<Node | null>(null);
  const [newNodeTitle, setNewNodeTitle] = useState('');
  const { currentTheme, colors, toggleTheme } = useTheme();
  const thoughtMapRef = useRef<ThoughtMapHandle>(null);
  const { pendingNodeId, clearPending } = useFocusNode();
  const nodeDetailRef = useRef<NodeDetailHandle>(null);
  const nodeDetailVisibleRef = useRef(nodeDetailVisible);
  // 親ノード追加フロー用の状態
  const [parentAddTargetNodeId, setParentAddTargetNodeId] = useState<string | null>(null);

  useEffect(() => {
    loadState();
  }, []);

  // テーマ切り替え処理
  const handleThemeToggle = () => {
    toggleTheme();
  };

  // pendingNodeIdがセットされたらジャンプ＆UI閉じる
  useEffect(() => {
    if (pendingNodeId) {
      setNodeDetailVisible(false);
      setTimeout(() => {
        thoughtMapRef.current?.focusNode(pendingNodeId);
        clearPending();
      }, 500);
    }
  }, [pendingNodeId]);

  useEffect(() => {
    nodeDetailVisibleRef.current = nodeDetailVisible;
  }, [nodeDetailVisible]);

  const handleNodePress = (node: Node) => {
    setNodeDetailVisible(true);
  };

  const handleNodeLongPress = (node: Node) => {
    // 長押し機能は必要に応じて実装
  };

  const handleAddChildNode = (parentNode: Node) => {
    setParentNode(parentNode);
    setTitleInputVisible(true);
  };

  const handleTitleInputClose = () => {
    setTitleInputVisible(false);
    setParentNode(null);
    setNewNodeTitle('');
  };

  const handleTitleInputSave = async () => {
    
    if (!newNodeTitle.trim()) {
      Alert.alert('エラー', 'タイトルを入力してください');
      return;
    }

    if (!parentNode) {
      Alert.alert('エラー', '親ノードが見つかりません');
      return;
    }

    try {
      
      await addNode({
        title: newNodeTitle.trim(),
        parent_ids: [parentNode.id],
      });
      
      handleTitleInputClose();
    } catch (error) {
      Alert.alert('エラー', `ノードの作成に失敗しました: ${error}`);
    }
  };

  const handleNodeDetailClose = () => {
    setNodeDetailVisible(false);
    setSelectedNode(undefined); // 追加: 選択ノードも解除
  };

  // 選択されたノードの達成度を計算（削除 - ThoughtMap内で計算するため）
  // const selectedNode = state.selectedNodeId ? 
  //   state.nodes.find(n => n.id === state.selectedNodeId) || 
  //   state.criticisms.find(c => c.id === state.selectedNodeId) : null;
  // const completionData = selectedNode ? getCompletionRate(selectedNode.id) : { completed: 0, total: 0, percentage: 0 };

  // 選択されたノード（ノード詳細モーダル用）
  const selectedNode = state.selectedNodeId ? 
    state.nodes.find(n => n.id === state.selectedNodeId) || 
    state.criticisms.find(c => c.id === state.selectedNodeId) : null;

  // ノード削除後などでselectedNodeがnullになったら詳細モーダルも閉じる
  useEffect(() => {
    if (!selectedNode && nodeDetailVisible) {
      setNodeDetailVisible(false);
    }
  }, [selectedNode, nodeDetailVisible]);

  // ノード選択時の処理を拡張
  const handleNodeSelect = (node: Node) => {
    // 親ノード追加モード中なら、親ノードとして追加
    if (parentAddTargetNodeId && node.id !== parentAddTargetNodeId) {
      // 対象ノードを取得
      const targetNode = state.nodes.find(n => n.id === parentAddTargetNodeId);
      if (targetNode && !targetNode.parent_ids.includes(node.id)) {
        // 親ノードを追加
        updateNode({
          id: targetNode.id,
          parent_ids: [...targetNode.parent_ids, node.id],
        });
      }
      setParentAddTargetNodeId(null);
      setSelectedNode(undefined);
      setNodeDetailVisible(false);
      return;
    }
    // 通常の選択
    setSelectedNode(node.id);
  };

  // スタイルを関数として定義
  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    mapContainer: {
      flex: 1,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: 'center',
      alignItems: 'center',
    },
    titleInputContainer: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 12,
      padding: 20,
      width: '80%',
      maxWidth: 400,
      borderWidth: 1,
      borderColor: colors.border,
    },
    titleInputHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    titleInputTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.textPrimary,
    },
    closeButton: {
      width: 24,
      height: 24,
      justifyContent: 'center',
      alignItems: 'center',
    },
    closeButtonText: {
      fontSize: 18,
      color: colors.textSecondary,
    },
    titleInputContent: {
      marginBottom: 20,
    },
    titleInputLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 8,
    },
    titleInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 6,
      padding: 12,
      fontSize: 16,
      color: colors.textPrimary,
      backgroundColor: colors.background,
    },
    titleInputActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 12,
    },
    titleInputButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 6,
    },
    cancelButton: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cancelButtonText: {
      color: colors.textSecondary,
      fontWeight: 'bold',
    },
    saveButton: {
      backgroundColor: colors.nodeNormal,
    },
    saveButtonText: {
      color: colors.textPrimary,
      fontWeight: 'bold',
    },
    modalContainer: {
      width: '90%',
      height: '80%',
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    themeToggleContainer: {
      position: 'absolute',
      top: 50,
      right: 20,
      zIndex: 1000,
    },
    themeToggleButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
    },
    themeToggleText: {
      fontSize: 24,
    },
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      {/* テーマ切り替えボタン */}
      <View style={styles.themeToggleContainer}>
        <TouchableOpacity style={[styles.themeToggleButton, { backgroundColor: colors.background, borderColor: colors.border }]} onPress={handleThemeToggle}>
          <Text style={[styles.themeToggleText, { color: colors.textPrimary }]}>
            {currentTheme === 'light' ? '🌙' : '☀️'}
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* 思想マップ */}
      <View style={styles.mapContainer}>
        <ThoughtMap
          ref={thoughtMapRef}
          onNodePress={handleNodePress}
          onNodeLongPress={handleNodeLongPress}
          onAddChildNode={handleAddChildNode}
          onNodeSelect={handleNodeSelect}
          parentAddTargetNodeId={parentAddTargetNodeId}
          setParentAddTargetNodeId={setParentAddTargetNodeId}
        />
      </View>

      {/* 検索画面（例: タブやモーダルで表示する場合） */}
      {/* <ExploreScreen onFocusNode={nodeId => thoughtMapRef.current?.focusNode(nodeId)} /> */}

      {/* タイトル入力モーダル（子ノード追加用） */}
      <Modal
        visible={titleInputVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleTitleInputClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.titleInputContainer}>
            <View style={styles.titleInputHeader}>
              <Text style={styles.titleInputTitle}>新しいノード</Text>
              <TouchableOpacity onPress={handleTitleInputClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.titleInputContent}>
              <Text style={styles.titleInputLabel}>タイトル *</Text>
              <TextInput
                style={styles.titleInput}
                value={newNodeTitle}
                onChangeText={setNewNodeTitle}
                placeholder="ノードのタイトルを入力"
                placeholderTextColor={PhiloTreeColors.textMuted}
                maxLength={50}
                autoFocus
              />
            </View>

            <View style={styles.titleInputActions}>
              <TouchableOpacity
                style={[styles.titleInputButton, styles.cancelButton]}
                onPress={handleTitleInputClose}
              >
                <Text style={styles.cancelButtonText}>キャンセル</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.titleInputButton, styles.saveButton]}
                onPress={handleTitleInputSave}
              >
                <Text style={styles.saveButtonText}>作成</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ノード詳細・編集モーダル */}
      <Modal
        visible={nodeDetailVisible && !!selectedNode}
        animationType="slide"
        transparent={true}
        onRequestClose={handleNodeDetailClose}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={handleNodeDetailClose}
        >
          <View style={styles.modalContainer}>
            {selectedNode && (
              <NodeDetail
                ref={nodeDetailRef}
                node={selectedNode as Node}
                criticisms={state.criticisms.filter(c => c.node_id === selectedNode.id)}
                onClose={handleNodeDetailClose}
                onFocusNode={nodeId => thoughtMapRef.current?.focusNode(nodeId)}
              />
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}
