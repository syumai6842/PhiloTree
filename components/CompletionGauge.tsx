import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PhiloTreeColors } from '../constants/Colors';

interface CompletionGaugeProps {
  completed: number;
  total: number;
  percentage: number;
}

export default function CompletionGauge({ completed, total, percentage }: CompletionGaugeProps) {
  return (
    <View style={styles.container}>
      <View style={styles.gaugeContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${percentage}%` }
            ]} 
          />
        </View>
        <Text style={styles.percentageText}>{percentage}%</Text>
      </View>
      <Text style={styles.countText}>
        {completed}/{total}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: PhiloTreeColors.backgroundSecondary,
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  gaugeContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  progressBar: {
    flex: 1,
    height: 10,
    backgroundColor: PhiloTreeColors.background,
    borderRadius: 5,
    marginRight: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: PhiloTreeColors.nodeNormal,
    borderRadius: 5,
  },
  percentageText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: PhiloTreeColors.textPrimary,
    minWidth: 40,
    textAlign: 'right',
  },
  countText: {
    fontSize: 16,
    color: PhiloTreeColors.textMuted,
    fontWeight: '600',
  },
}); 