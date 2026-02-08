import { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from 'tamagui';
import { Colors } from '@/app/constants';
import { TamaguiText } from '@/app/design-system';
import ProvenanceFooter from './ProvenanceFooter';
import type { DataBlock } from '@/app/types/dataBlock';

interface Props {
  label: string;
  block: DataBlock;
  icon?: string;
}

export default function InsightCard({ label, block }: Props) {
  const theme = useTheme();

  const styles = useMemo(() => StyleSheet.create({
    card: {
      padding: 16,
      borderRadius: 12,
      backgroundColor: theme.surfaceElevated.val,
      borderWidth: 0.5,
      borderColor: theme.borderColor.val,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    label: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.textSecondary.val,
      letterSpacing: -0.2,
    },
    value: {
      fontSize: 20,
      fontWeight: '700',
      color: Colors.primary,
      letterSpacing: -0.3,
      marginBottom: 4,
    },
  }), [theme]);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <TamaguiText preset="caption" textColor="secondary" weight="semibold" style={styles.label}>
          {label}
        </TamaguiText>
      </View>

      <TamaguiText preset="h2" textColor="primary" weight="bold" style={styles.value}>
        {block.value}
      </TamaguiText>
      <ProvenanceFooter block={block} compact />
    </View>
  );
}
