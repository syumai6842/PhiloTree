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
import { PhiloTreeColors } from '../constants/Colors';
import { useThoughtMap } from '../contexts/ThoughtMapContext';
import { Criticism, Node } from '../types';

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
  return typeof node.scholar_name === 'string' && node.scholar_name.length > 0;
}

const NodeDetail = forwardRef<NodeDetailHandle, NodeDetailProps>(
  function NodeDetail({ node, criticisms = [], onClose, onFocusNode }, ref) {
    const { updateNode } = useThoughtMap();
    const [isEditing, setIsEditing] = useState(true);
    const [title, setTitle] = useState(node.title);
    const [content, setContent] = useState(node.content || '');

    useEffect(() => {
      setTitle(node.title);
      setContent(node.content || '');
      setIsEditing(true);
    }, [node]);

    useEffect(() => {
      return () => {
        if (isEditing && (title !== node.title || content !== (node.content || ''))) {
          handleSave();
        }
      };
    }, [isEditing, title, content, node]);

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

    useImperativeHandle(ref, () => ({
      save: handleSave
    }));

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <TextInput
              style={[styles.titleInput, { textAlignVertical: 'top' }]}
              value={title}
              onChangeText={setTitle}
              placeholder="タイトルを入力"
              placeholderTextColor={PhiloTreeColors.textMuted}
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
            {onClose && (
              <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            )}
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
              placeholderTextColor={PhiloTreeColors.textMuted}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PhiloTreeColors.backgroundSecondary,
    borderWidth: 1,
    borderColor: PhiloTreeColors.border,
    borderRadius: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: PhiloTreeColors.border,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: PhiloTreeColors.textPrimary,
    marginBottom: 8,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sourceBadge: {
    backgroundColor: PhiloTreeColors.info,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  sourceText: {
    fontSize: 10,
    color: PhiloTreeColors.textPrimary,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  editButton: {
    backgroundColor: PhiloTreeColors.nodeNormal,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  editButtonText: {
    color: PhiloTreeColors.textPrimary,
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
    color: PhiloTreeColors.textSecondary,
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
    color: PhiloTreeColors.textPrimary,
    marginBottom: 12,
  },
  contentText: {
    fontSize: 16,
    color: PhiloTreeColors.textPrimary,
    lineHeight: 24,
  },
  criticismItem: {
    backgroundColor: PhiloTreeColors.background,
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: PhiloTreeColors.border,
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
    color: PhiloTreeColors.textPrimary,
  },
  criticismField: {
    fontSize: 12,
    color: PhiloTreeColors.textSecondary,
  },
  criticismContent: {
    fontSize: 14,
    color: PhiloTreeColors.textPrimary,
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
    color: PhiloTreeColors.textMuted,
  },
  criticismSource: {
    fontSize: 12,
    color: PhiloTreeColors.textSecondary,
    fontWeight: 'bold',
  },
  metadataItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  metadataLabel: {
    fontSize: 14,
    color: PhiloTreeColors.textSecondary,
    fontWeight: '600',
    width: 80,
  },
  metadataValue: {
    fontSize: 14,
    color: PhiloTreeColors.textPrimary,
    flex: 1,
  },
  titleInput: {
    fontSize: 20,
    fontWeight: 'bold',
    color: PhiloTreeColors.textPrimary,
    marginBottom: 8,
    backgroundColor: PhiloTreeColors.background,
    borderWidth: 1,
    borderColor: PhiloTreeColors.border,
    borderRadius: 8,
    padding: 8,
  },
  contentInput: {
    backgroundColor: PhiloTreeColors.background,
    borderWidth: 1,
    borderColor: PhiloTreeColors.border,
    borderRadius: 8,
    padding: 12,
    textAlignVertical: 'top',
  },
  cancelButton: {
    backgroundColor: PhiloTreeColors.background,
    borderWidth: 1,
    borderColor: PhiloTreeColors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 8,
  },
  cancelButtonText: {
    color: PhiloTreeColors.textPrimary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: PhiloTreeColors.nodeNormal,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  saveButtonText: {
    color: PhiloTreeColors.textPrimary,
    fontSize: 12,
    fontWeight: 'bold',
  },
}); 