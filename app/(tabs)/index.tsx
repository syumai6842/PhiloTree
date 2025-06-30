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
import CompletionGauge from '../../components/CompletionGauge';
import NodeDetail, { NodeDetailHandle } from '../../components/NodeDetail';
import ThoughtMap, { ThoughtMapHandle } from '../../components/ThoughtMap';
import { PhiloTreeColors } from '../../constants/Colors';
import { useFocusNode } from '../../contexts/FocusNodeContext';
import { useThoughtMap } from '../../contexts/ThoughtMapContext';
import { Node } from '../../types';

export default function ThoughtMapScreen() {
  const { state, loadState, addNode, getCompletionRate } = useThoughtMap();
  const [nodeDetailVisible, setNodeDetailVisible] = useState(false);
  const [titleInputVisible, setTitleInputVisible] = useState(false);
  const [parentNode, setParentNode] = useState<Node | null>(null);
  const [newNodeTitle, setNewNodeTitle] = useState('');
  const thoughtMapRef = useRef<ThoughtMapHandle>(null);
  const { pendingNodeId, clearPending } = useFocusNode();
  const nodeDetailRef = useRef<NodeDetailHandle>(null);
  const nodeDetailVisibleRef = useRef(nodeDetailVisible);

  useEffect(() => {
    loadState();
  }, []);

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
    console.log('Node long pressed:', node.id);
  };

  const handleAddChildNode = (parentNode: Node) => {
    console.log('handleAddChildNode called with parentNode:', parentNode);
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

    if (!parentNode) return;

    try {
      await addNode({
        title: newNodeTitle.trim(),
        parent_ids: [parentNode.id],
      });
      handleTitleInputClose();
    } catch (error) {
      Alert.alert('エラー', 'ノードの作成に失敗しました');
    }
  };

  const handleNodeDetailClose = () => {
    setNodeDetailVisible(false);
  };

  // 選択されたノードの達成度を計算
  const selectedNode = state.selectedNodeId ? 
    state.nodes.find(n => n.id === state.selectedNodeId) || 
    state.criticisms.find(c => c.id === state.selectedNodeId) : null;
  const completionData = selectedNode ? getCompletionRate(selectedNode.id) : { completed: 0, total: 0, percentage: 0 };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={PhiloTreeColors.background} />
      
      {/* 達成度ゲージ */}
      {selectedNode && (
        <View style={styles.gaugeContainer}>
          <CompletionGauge 
            completed={completionData.completed}
            total={completionData.total}
            percentage={completionData.percentage}
          />
        </View>
      )}
      
      {/* 思想マップ */}
      <View style={styles.mapContainer}>
        <ThoughtMap
          ref={thoughtMapRef}
          onNodePress={handleNodePress}
          onNodeLongPress={handleNodeLongPress}
          onAddChildNode={handleAddChildNode}
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
        <View style={styles.modalOverlay}>
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
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: PhiloTreeColors.background,
  },
  gaugeContainer: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  mapContainer: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleInputContainer: {
    backgroundColor: PhiloTreeColors.backgroundSecondary,
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 400,
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
    color: PhiloTreeColors.textPrimary,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: PhiloTreeColors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: PhiloTreeColors.textPrimary,
    fontWeight: 'bold',
  },
  titleInputContent: {
    marginBottom: 20,
  },
  titleInputLabel: {
    fontSize: 16,
    color: PhiloTreeColors.textPrimary,
    marginBottom: 8,
  },
  titleInput: {
    backgroundColor: PhiloTreeColors.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: PhiloTreeColors.textPrimary,
    borderWidth: 1,
    borderColor: PhiloTreeColors.border,
  },
  titleInputActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  titleInputButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  cancelButton: {
    backgroundColor: PhiloTreeColors.background,
  },
  saveButton: {
    backgroundColor: PhiloTreeColors.nodeNormal,
  },
  cancelButtonText: {
    color: PhiloTreeColors.textPrimary,
    fontSize: 16,
    fontWeight: '500',
  },
  saveButtonText: {
    color: PhiloTreeColors.textPrimary,
    fontSize: 16,
    fontWeight: '500',
  },
  modalContainer: {
    width: '90%',
    height: '80%',
    backgroundColor: PhiloTreeColors.backgroundSecondary,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: PhiloTreeColors.border,
  },
});
