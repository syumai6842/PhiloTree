import React, { useEffect, useState } from 'react';
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
import NodeDetail from '../../components/NodeDetail';
import ThoughtMap from '../../components/ThoughtMap';
import { PhiloTreeColors } from '../../constants/Colors';
import { useThoughtMap } from '../../contexts/ThoughtMapContext';
import { Node } from '../../types';

export default function ThoughtMapScreen() {
  const { state, loadState, addNode } = useThoughtMap();
  const [nodeDetailVisible, setNodeDetailVisible] = useState(false);
  const [titleInputVisible, setTitleInputVisible] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [parentNode, setParentNode] = useState<Node | null>(null);
  const [newNodeTitle, setNewNodeTitle] = useState('');

  useEffect(() => {
    loadState();
  }, []);

  const handleNodePress = (node: Node) => {
    setSelectedNode(node);
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
    setSelectedNode(null);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={PhiloTreeColors.background} />
      
      {/* 思想マップ */}
      <View style={styles.mapContainer}>
        <ThoughtMap
          onNodePress={handleNodePress}
          onNodeLongPress={handleNodeLongPress}
          onAddChildNode={handleAddChildNode}
        />
      </View>

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
        visible={nodeDetailVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleNodeDetailClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {selectedNode && (
              <NodeDetail
                node={selectedNode}
                criticisms={state.criticisms.filter(c => c.node_id === selectedNode.id)}
                onClose={handleNodeDetailClose}
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
  mapContainer: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: PhiloTreeColors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleInputContainer: {
    width: '90%',
    backgroundColor: PhiloTreeColors.backgroundSecondary,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: PhiloTreeColors.border,
  },
  titleInputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: PhiloTreeColors.border,
  },
  titleInputTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: PhiloTreeColors.textPrimary,
  },
  closeButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: PhiloTreeColors.textSecondary,
  },
  titleInputContent: {
    padding: 20,
  },
  titleInputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: PhiloTreeColors.textPrimary,
    marginBottom: 8,
  },
  titleInput: {
    backgroundColor: PhiloTreeColors.background,
    borderWidth: 1,
    borderColor: PhiloTreeColors.border,
    borderRadius: 8,
    padding: 12,
    color: PhiloTreeColors.textPrimary,
    fontSize: 16,
  },
  titleInputActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 10,
  },
  titleInputButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: PhiloTreeColors.nodeNormal,
  },
  saveButtonText: {
    color: PhiloTreeColors.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: PhiloTreeColors.background,
    borderWidth: 1,
    borderColor: PhiloTreeColors.border,
  },
  cancelButtonText: {
    color: PhiloTreeColors.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
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
