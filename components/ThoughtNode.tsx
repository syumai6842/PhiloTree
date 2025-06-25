import React from 'react';
import {
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { PhiloTreeColors } from '../constants/Colors';
import { Node } from '../types';

const { width: screenWidth } = Dimensions.get('window');

interface NodePosition {
  x: number;
  y: number;
}

interface ThoughtNodeProps {
  node: Node;
  position: NodePosition;
  isSelected?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  onAddChild?: () => void;
}

export default function ThoughtNode({
  node,
  position,
  isSelected = false,
  onPress,
  onLongPress,
  onAddChild,
}: ThoughtNodeProps) {
  const getNodeColor = () => {
    if (isSelected) {
      return PhiloTreeColors.nodeSelected;
    }
    return PhiloTreeColors.nodeNormal;
  };

  const getNodeSize = () => {
    // 固定サイズ
    return 120;
  };

  const nodeSize = getNodeSize();

  return (
    <View style={[
      styles.nodeContainer,
      {
        left: position.x,
        top: position.y,
      }
    ]}>
      <TouchableOpacity
        style={[
          styles.node,
          {
            width: nodeSize,
            height: nodeSize,
            backgroundColor: getNodeColor(),
            borderColor: isSelected ? PhiloTreeColors.textPrimary : 'transparent',
          },
        ]}
        onPress={onPress}
        onLongPress={onLongPress}
        activeOpacity={0.8}
      >
        <View style={styles.nodeContent}>
          <Text style={styles.nodeTitle} numberOfLines={2}>
            {node.title}
          </Text>
          
          {node.source_gpt && (
            <View style={styles.sourceBadge}>
              <Text style={styles.sourceText}>GPT</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* 子ノード追加ボタン */}
      <TouchableOpacity
        style={styles.addChildButton}
        onPress={() => {
          console.log('Add child button pressed for node:', node.id);
          onAddChild?.();
        }}
        activeOpacity={0.8}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text style={styles.addChildButtonText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  nodeContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  node: {
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    elevation: 8,
    shadowColor: PhiloTreeColors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  nodeContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  nodeTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: PhiloTreeColors.textPrimary,
    textAlign: 'center',
    marginBottom: 5,
  },
  sourceBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: PhiloTreeColors.info,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  sourceText: {
    fontSize: 10,
    color: PhiloTreeColors.textPrimary,
    fontWeight: 'bold',
  },
  addChildButton: {
    position: 'absolute',
    bottom: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: PhiloTreeColors.nodeNormal,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: PhiloTreeColors.background,
    elevation: 10,
    shadowColor: PhiloTreeColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  addChildButtonText: {
    fontSize: 24,
    color: PhiloTreeColors.textPrimary,
    fontWeight: 'bold',
  },
}); 