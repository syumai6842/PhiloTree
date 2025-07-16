import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useThoughtMap } from '../contexts/ThoughtMapContext';
import { Criticism, Node } from '../types';
import { IconSymbol } from './ui/IconSymbol';

export interface NodeDetailHandle {
  save: () => Promise<void>;
}

interface NodeDetailProps {
  node: Node;
  criticisms?: Criticism[];
  onClose?: () => void;
  onFocusNode?: (nodeId: string) => void;
}

function isCriticismNode(node: any): node is { scholar_name: string } {
  return 'scholar_name' in node;
}

const NodeDetail = forwardRef<NodeDetailHandle, NodeDetailProps>(
  function NodeDetail({ node, criticisms = [], onClose, onFocusNode }, ref) {
    const { updateNode, updateCriticism, state, deleteNode, deleteCriticism } = useThoughtMap();
    const { colors } = useTheme();
    const [isEditing, setIsEditing] = useState(true);
    const [title, setTitle] = useState(node.title);
    const [content, setContent] = useState(node.content || '');
    const [parentIds, setParentIds] = useState<string[]>(node.parent_ids || []);
    // 親ノード追加に関するstate, handler, UIを削除
    // parentToAdd, setParentToAdd, handleAddParent, parentCandidates, addParentContainer, pickerContainer, picker, addParentButton, addParentButtonText など
    // 親ノードリスト表示と親ノード削除ボタンは残す

    useEffect(() => {
      // 初回表示時またはノードIDが変更された時のみ値を設定
      setTitle(node.title);
      setContent(node.content || '');
      setParentIds(node.parent_ids || []);
      setIsEditing(true);
    }, [node.id]); // node.idのみを依存配列に含める

    useEffect(() => {
      return () => {
        if (isEditing && (title !== node.title || content !== (node.content || ''))) {
          handleSave();
        }
      };
    }, [isEditing, title, content, node.id]); // node.idのみを依存配列に含める

    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    const handleSave = async () => {
      if (!title.trim()) {
        Alert.alert('エラー', 'タイトルを入力してください');
        return;
      }

      try {
        await updateNode({
          id: node.id,
          title: title.trim(),
          content: content.trim(),
          parent_ids: parentIds,
        });
        setIsEditing(false);
      } catch (error) {
        Alert.alert('エラー', '保存に失敗しました');
      }
    };

    const handleCancel = () => {
      setTitle(node.title);
      setContent(node.content || '');
      setIsEditing(false);
    };

    const handleClose = async () => {
      await handleSave();
      onClose?.();
    };

    // ノード・批評ノード削除ハンドラ
    const handleDelete = async () => {
      console.log('削除ボタン即時onPress呼び出し');
      try {
        if (isCriticismNode(node)) {
          console.log('deleteCriticism開始', node.id);
          await deleteCriticism(node.id);
          console.log('deleteCriticism完了', node.id);
        } else {
          console.log('deleteNode開始', node.id);
          await deleteNode(node.id);
          console.log('deleteNode完了', node.id);
        }
        console.log('onClose呼び出し前');
        onClose?.();
        console.log('onClose呼び出し後');
      } catch (e) {
        console.error('削除処理でエラー', e);
      }
    };

    useImperativeHandle(ref, () => ({
      save: handleSave
    }));

    // 親ノード削除
    // 親ノードリストの各親ノードの横にある削除ボタン（TouchableOpacity）を削除し、タイトル表示のみ残す
    // handleRemoveParentも不要なら削除

    // 親ノード候補（自分以外の全ノード）
    const parentCandidates = state.nodes.filter(n => n.id !== node.id);

    // スタイルをコンポーネント内で定義
    const styles = StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: colors.backgroundSecondary,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
      },
      header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      },
      headerContent: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'flex-start',
      },
      title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginBottom: 8,
      },
      meta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
      },
      sourceBadge: {
        backgroundColor: colors.info,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
      },
      sourceText: {
        fontSize: 10,
        color: colors.textPrimary,
        fontWeight: 'bold',
      },
      headerActions: {
        flexDirection: 'row',
        gap: 10,
      },
      editButton: {
        backgroundColor: colors.nodeNormal,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
      },
      editButtonText: {
        color: colors.textPrimary,
        fontSize: 12,
        fontWeight: 'bold',
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
      content: {
        flex: 1,
        padding: 20,
      },
      section: {
        marginBottom: 24,
      },
      sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginBottom: 12,
      },
      contentText: {
        fontSize: 16,
        color: colors.textPrimary,
        lineHeight: 24,
      },
      criticismItem: {
        backgroundColor: colors.background,
        padding: 16,
        borderRadius: 8,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.border,
      },
      criticismHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
      },
      criticismScholar: {
        fontSize: 14,
        fontWeight: 'bold',
        color: colors.textPrimary,
      },
      criticismField: {
        fontSize: 12,
        color: colors.textSecondary,
      },
      criticismContent: {
        fontSize: 14,
        color: colors.textPrimary,
        lineHeight: 20,
        marginBottom: 8,
      },
      criticismMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      },
      criticismDate: {
        fontSize: 12,
        color: colors.textMuted,
      },
      criticismSource: {
        fontSize: 12,
        color: colors.textSecondary,
        fontWeight: 'bold',
      },
      metadataItem: {
        flexDirection: 'row',
        marginBottom: 8,
      },
      metadataLabel: {
        fontSize: 14,
        color: colors.textSecondary,
        fontWeight: '600',
        width: 80,
      },
      metadataValue: {
        fontSize: 14,
        color: colors.textPrimary,
        flex: 1,
      },
      titleInput: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.textPrimary,
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
        flex: 1,
        width: '100%',
        lineHeight: 24,
      },
      contentInput: {
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 8,
        padding: 12,
        textAlignVertical: 'top',
      },
      cancelButton: {
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
      },
      cancelButtonText: {
        color: colors.textPrimary,
        fontSize: 12,
        fontWeight: 'bold',
      },
      saveButton: {
        backgroundColor: colors.nodeNormal,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
      },
      saveButtonText: {
        color: colors.textPrimary,
        fontSize: 12,
        fontWeight: 'bold',
      },
      parentNodeItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: colors.background,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 6,
        marginBottom: 4,
        borderWidth: 1,
        borderColor: colors.border,
      },
      parentNodeTitle: {
        flex: 1,
        fontSize: 14,
        color: colors.textPrimary,
      },
      removeParentButton: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: colors.textSecondary,
        borderRadius: 4,
      },
      removeParentButtonText: {
        color: colors.textPrimary,
        fontSize: 12,
        fontWeight: 'bold',
      },
      addParentContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        backgroundColor: colors.background,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: colors.border,
      },
      pickerContainer: {
        flex: 1,
        borderRightWidth: 1,
        borderRightColor: colors.border,
      },
      picker: {
        height: 32,
        width: '100%',
      },
      addParentButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: colors.nodeNormal,
        borderRadius: 6,
      },
      addParentButtonText: {
        color: colors.textPrimary,
        fontSize: 12,
        fontWeight: 'bold',
      },
      emptyText: {
        color: '#888',
        fontSize: 14,
        textAlign: 'center',
        paddingVertical: 10,
      },
      deleteButton: {
        backgroundColor: '#f44',
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
      },
      deleteButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
        marginLeft: 4,
      },
    });

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <TextInput
              style={[styles.titleInput, { textAlignVertical: 'top' }]}
              value={title}
              onChangeText={setTitle}
              placeholder="タイトルを入力"
              placeholderTextColor={colors.textMuted}
              maxLength={50}
              multiline
            />
            <View style={styles.meta}>
              {isCriticismNode(node) && (
                <View style={styles.sourceBadge}>
                  <Text style={styles.sourceText}>{node.scholar_name}</Text>
                </View>
              )}
              {node.source_gpt && (
                <View style={styles.sourceBadge}>
                  <Text style={styles.sourceText}>GPT生成</Text>
                </View>
              )}
            </View>
          </View>
          <View style={styles.headerActions}>
            {/* Material Symbolsのゴミ箱アイコンのみの丸ボタン */}
            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
              <IconSymbol name="delete" size={24} color="#fff" />
            </TouchableOpacity>
            {/* ×ボタンは削除 */}
          </View>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>内容</Text>
            <TextInput
              style={[styles.contentText, styles.contentInput, { textAlignVertical: 'top', minHeight: 120 }]}
              value={content}
              onChangeText={setContent}
              placeholder="内容を入力"
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={6}
              maxLength={1000}
            />
          </View>

          {criticisms.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>批評 ({criticisms.length})</Text>
              {criticisms.map((criticism) => (
                <TouchableOpacity
                  key={criticism.id}
                  style={styles.criticismItem}
                  activeOpacity={0.8}
                  onPress={() => onFocusNode?.(criticism.id)}
                >
                  <View style={styles.criticismHeader}>
                    <Text style={styles.criticismScholar}>{criticism.scholar_name}</Text>
                    {criticism.field && (
                      <Text style={styles.criticismField}>{criticism.field}</Text>
                    )}
                  </View>
                  <Text style={styles.criticismContent}>{criticism.content}</Text>
                  <View style={styles.criticismMeta}>
                    <Text style={styles.criticismDate}>
                      {formatDate(criticism.created_at)}
                    </Text>
                    {criticism.source_url && (
                      <Text style={styles.criticismSource}>出典あり</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* 親ノード編集セクション */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>親ノード</Text>
            {/* ノードの場合はparent_ids、批評ノードの場合はnode_idを親ノードとして表示 */}
            {isCriticismNode(node) ? (
              (node as Criticism).node_id ? (
                (() => {
                  const nodeId = (node as Criticism).node_id!;
                  const pnode = state.nodes.find(n => n.id === nodeId);
                  const pcriticism = state.criticisms.find(c => c.id === nodeId);
                  const handleRemoveParent = () => {
                    updateCriticism({
                      id: node.id,
                      node_id: undefined,
                    });
                  };
                  return (
                    <View style={styles.parentNodeItem}>
                      <Text style={styles.parentNodeTitle}>{pnode ? pnode.title : (pcriticism ? pcriticism.title : nodeId)}</Text>
                      <TouchableOpacity onPress={handleRemoveParent} style={{ marginLeft: 8, padding: 4 }}>
                        <IconSymbol name="close" size={18} color={colors.textSecondary} />
                      </TouchableOpacity>
                    </View>
                  );
                })()
              ) : (
                <Text style={styles.emptyText}>親ノードなし</Text>
              )
            ) : (
              parentIds.length > 0 ? (
                parentIds.map(pid => {
                  const pnode = state.nodes.find(n => n.id === pid);
                  const pcriticism = state.criticisms.find(c => c.id === pid);
                  const handleRemoveParent = () => {
                    const newParentIds = parentIds.filter(id => id !== pid);
                    updateNode({
                      id: node.id,
                      parent_ids: newParentIds,
                    });
                    setParentIds(newParentIds);
                  };
                  return (
                    <View key={pid} style={styles.parentNodeItem}>
                      <TouchableOpacity onPress={() => onFocusNode?.(pid)} style={{ flex: 1 }}>
                        <Text style={styles.parentNodeTitle}>{pnode ? pnode.title : (pcriticism ? pcriticism.title : pid)}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={handleRemoveParent} style={{ marginLeft: 8, padding: 4 }}>
                        <IconSymbol name="close" size={18} color={colors.textSecondary} />
                      </TouchableOpacity>
                    </View>
                  );
                })
              ) : (
                <Text style={styles.emptyText}>親ノードなし</Text>
              )
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>メタデータ</Text>
            <View style={styles.metadataItem}>
              <Text style={styles.metadataLabel}>作成日時:</Text>
              <Text style={styles.metadataValue}>{formatDate(node.created_at)}</Text>
            </View>
            <View style={styles.metadataItem}>
              <Text style={styles.metadataLabel}>更新日時:</Text>
              <Text style={styles.metadataValue}>{formatDate(node.updated_at)}</Text>
            </View>
            {node.parent_ids && node.parent_ids.length > 0 && (
              <View style={styles.metadataItem}>
                <Text style={styles.metadataLabel}>親ノード:</Text>
                <Text style={styles.metadataValue}>{node.parent_ids.length}個</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    );
  }
);

export default NodeDetail; 