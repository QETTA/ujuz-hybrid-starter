import { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from 'tamagui';
import { Colors } from '@/app/constants';
import { TamaguiText } from '@/app/design-system';
import ConfidenceBadge from './ConfidenceBadge';
import ProvenanceFooter from './ProvenanceFooter';
import type { DataBlock } from '@/app/types/dataBlock';

interface Props {
  label: string;
  block: DataBlock;
  icon?: string;
}

export default function InsightCard({ label, block }: Props) {
  const theme = useTheme();
  const confidence = block.confidence ?? 0;
  const accentColor = confidence >= 0.8 ? Colors.success : confidence >= 0.5 ? Colors.primary : Colors.warning;

  const styles = useMemo(() => StyleSheet.create({
    card: {
      padding: 16,
      borderRadius: 14,
      backgroundColor: theme.surfaceElevated.val,
      borderWidth: 0.5,
      borderColor: theme.borderColor.val,
      borderLeftWidth: 3,
      borderLeftColor: accentColor,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 6,
    },
    label: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.textSecondary.val,
      letterSpacing: -0.2,
    },
    value: {
      fontSize: 22,
      fontWeight: '800',
      color: theme.textPrimary.val,
      letterSpacing: -0.5,
      marginBottom: 4,
    },
  }), [theme, accentColor]);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <TamaguiText preset="caption" textColor="secondary" weight="semibold" style={styles.label}>
          {label}
        </TamaguiText>
        <ConfidenceBadge confidence={confidence} size="sm" />
      </View>

      <TamaguiText preset="h2" textColor="primary" weight="bold" style={styles.value}>
        {block.value}
      </TamaguiText>
      <ProvenanceFooter block={block} compact />
    </View>
  );
}
