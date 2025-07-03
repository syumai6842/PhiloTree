import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PhiloTreeColors } from '../../constants/Colors';
import { useFocusNode } from '../../contexts/FocusNodeContext';
import { useThoughtMap } from '../../contexts/ThoughtMapContext';
import { Criticism } from '../../types';

export default function ExploreScreen() {
  const { state } = useThoughtMap();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedScholar, setSelectedScholar] = useState<string | 'all'>('all');
  const { focusNode } = useFocusNode();
  const router = useRouter();

  // 学者名の一覧を取得
  const scholarNames = useMemo(() => {
    const names = new Set<string>();
    state.criticisms.forEach(criticism => {
      if (criticism.scholar_name) {
        names.add(criticism.scholar_name);
      }
    });
    return Array.from(names).sort();
  }, [state.criticisms]);

  // 検索結果を計算
  const searchResults = useMemo(() => {
    if (selectedScholar === 'all') {
      // 通常の検索（自由記述）
      return state.nodes.filter(node => {
        const matchesSearch = searchQuery === '' || 
          node.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (node.content && node.content.toLowerCase().includes(searchQuery.toLowerCase()));
        
        return matchesSearch;
      });
    } else {
      // 学者名によるフィルタリング
      const scholarCriticisms = state.criticisms.filter(
        criticism => criticism.scholar_name === selectedScholar
      );
      
      const relatedNodeIds = new Set<string>();
      
      // 批評ノードのIDを収集
      scholarCriticisms.forEach(criticism => {
        if (criticism.node_id) {
          relatedNodeIds.add(criticism.node_id);
        }
      });
      
      // 関連する思想ノードを取得（アウフヘーベン前後のノード）
      const relatedNodes = state.nodes.filter(node => {
        // 批評ノード自体
        if (relatedNodeIds.has(node.id)) {
          return true;
        }
        
        // アウフヘーベン後のノード（批評ノードを親に持つノード）
        if (node.parent_ids && node.parent_ids.some(parentId => relatedNodeIds.has(parentId))) {
          return true;
        }
        
        // アウフヘーベン前のノード（批評ノードが子を持つノード）
        if (relatedNodeIds.has(node.id)) {
          return true;
        }
        
        return false;
      });
      
      return relatedNodes;
    }
  }, [state.nodes, state.criticisms, searchQuery, selectedScholar]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
    });
  };

  // ノードに関連する批評を取得
  const getNodeCriticisms = (nodeId: string): Criticism[] => {
    return state.criticisms.filter(criticism => criticism.node_id === nodeId);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* 検索バー */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="ノードを検索..."
          placeholderTextColor={PhiloTreeColors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* 学者名フィルター */}
      <View style={styles.filterContainer}>
        <ScrollView 
          style={styles.filterScrollView}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
        >
          <View style={styles.filterTagsContainer}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                selectedScholar === 'all' && styles.filterButtonActive,
              ]}
              onPress={() => setSelectedScholar('all')}
            >
              <Text style={[
                styles.filterButtonText,
                selectedScholar === 'all' && styles.filterButtonTextActive,
              ]}>
                すべて
              </Text>
            </TouchableOpacity>
            
            {scholarNames.map((scholarName) => (
              <TouchableOpacity
                key={scholarName}
                style={[
                  styles.filterButton,
                  selectedScholar === scholarName && styles.filterButtonActive,
                ]}
                onPress={() => setSelectedScholar(scholarName)}
              >
                <Text style={[
                  styles.filterButtonText,
                  selectedScholar === scholarName && styles.filterButtonTextActive,
                ]}>
                  {scholarName}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* 統計情報 */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{state.nodes.length}</Text>
          <Text style={styles.statLabel}>総ノード数</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{searchResults.length}</Text>
          <Text style={styles.statLabel}>検索結果</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{scholarNames.length}</Text>
          <Text style={styles.statLabel}>学者数</Text>
        </View>
      </View>

      {/* ノード一覧 */}
      <ScrollView style={styles.nodeList}>
        {searchResults.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              {selectedScholar === 'all' 
                ? '条件に一致するノードが見つかりません'
                : `${selectedScholar}に関連するノードが見つかりません`
              }
            </Text>
          </View>
        ) : (
          searchResults.map((node) => {
            const nodeCriticisms = getNodeCriticisms(node.id);
            return (
              <TouchableOpacity
                key={node.id}
                style={styles.nodeItem}
                activeOpacity={0.8}
                onPress={() => {
                  focusNode(node.id);
                  router.replace('/');
                }}
              >
                <View style={styles.nodeHeader}>
                  <Text style={styles.nodeTitle}>{node.title}</Text>
                  <View style={styles.nodeBadges}>
                    {nodeCriticisms.length > 0 && (
                      <Text style={styles.criticismBadge}>
                        批評 {nodeCriticisms.length}
                      </Text>
                    )}
                  </View>
                </View>
                <Text style={styles.nodeContent} numberOfLines={3}>
                  {node.content || '内容なし'}
                </Text>
                {/* 関連する批評を表示 */}
                {nodeCriticisms.length > 0 && (
                  <View style={styles.criticismsContainer}>
                    <Text style={styles.criticismsTitle}>関連する批評:</Text>
                    {nodeCriticisms.slice(0, 2).map((criticism, index) => (
                      <TouchableOpacity
                        key={criticism.id}
                        style={[
                          styles.criticismItem,
                          index === nodeCriticisms.slice(0, 2).length - 1 && styles.criticismItemLast
                        ]}
                        activeOpacity={0.8}
                        onPress={() => {
                          focusNode(criticism.id);
                          router.replace('/');
                        }}
                      >
                        <Text style={styles.scholarName}>{criticism.scholar_name}</Text>
                        <Text style={styles.criticismComment} numberOfLines={2}>
                          {criticism.content}
                        </Text>
                      </TouchableOpacity>
                    ))}
                    {nodeCriticisms.length > 2 && (
                      <Text style={styles.moreCriticisms}>
                        他 {nodeCriticisms.length - 2} 件の批評...
                      </Text>
                    )}
                  </View>
                )}
                <View style={styles.nodeMeta}>
                  <Text style={styles.nodeDate}>{formatDate(node.created_at)}</Text>
                  {node.parent_ids && node.parent_ids.length > 0 && (
                    <Text style={styles.nodeParent}>親ノードあり</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: PhiloTreeColors.background,
  },
  searchContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: PhiloTreeColors.border,
  },
  searchInput: {
    backgroundColor: PhiloTreeColors.backgroundSecondary,
    borderRadius: 8,
    padding: 12,
    color: PhiloTreeColors.textPrimary,
    fontSize: 16,
    borderWidth: 1,
    borderColor: PhiloTreeColors.border,
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: PhiloTreeColors.border,
  },
  filterTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterScrollView: {
    maxHeight: 120,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PhiloTreeColors.border,
    backgroundColor: PhiloTreeColors.backgroundSecondary,
  },
  filterButtonActive: {
    backgroundColor: PhiloTreeColors.nodeNormal,
    borderColor: PhiloTreeColors.nodeNormal,
  },
  filterButtonText: {
    fontSize: 14,
    color: PhiloTreeColors.textSecondary,
  },
  filterButtonTextActive: {
    color: PhiloTreeColors.textPrimary,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: PhiloTreeColors.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: PhiloTreeColors.nodeNormal,
  },
  statLabel: {
    fontSize: 12,
    color: PhiloTreeColors.textSecondary,
    marginTop: 4,
  },
  nodeList: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: PhiloTreeColors.textSecondary,
    textAlign: 'center',
  },
  nodeItem: {
    backgroundColor: PhiloTreeColors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: PhiloTreeColors.border,
  },
  nodeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  nodeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: PhiloTreeColors.textPrimary,
    flex: 1,
  },
  nodeBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  criticismBadge: {
    fontSize: 10,
    color: PhiloTreeColors.textPrimary,
    backgroundColor: PhiloTreeColors.info,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 6,
    fontWeight: 'bold',
  },
  nodeContent: {
    fontSize: 14,
    color: PhiloTreeColors.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  nodeMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nodeDate: {
    fontSize: 12,
    color: PhiloTreeColors.textMuted,
  },
  nodeParent: {
    fontSize: 12,
    color: PhiloTreeColors.textMuted,
    fontStyle: 'italic',
  },
  criticismsContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: PhiloTreeColors.background,
    borderWidth: 1,
    borderColor: PhiloTreeColors.border,
    borderRadius: 8,
  },
  criticismsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: PhiloTreeColors.textPrimary,
    marginBottom: 8,
  },
  criticismItem: {
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: PhiloTreeColors.border,
  },
  scholarName: {
    fontSize: 12,
    color: PhiloTreeColors.textPrimary,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  criticismComment: {
    fontSize: 12,
    color: PhiloTreeColors.textSecondary,
    lineHeight: 16,
  },
  moreCriticisms: {
    fontSize: 12,
    color: PhiloTreeColors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 4,
  },
  criticismItemLast: {
    borderBottomWidth: 0,
    marginBottom: 0,
    paddingBottom: 0,
  },
});
