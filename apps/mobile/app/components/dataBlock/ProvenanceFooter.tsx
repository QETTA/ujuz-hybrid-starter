import { useMemo } from 'react';
import { View, StyleSheet, Linking } from 'react-native';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Colors } from '@/app/constants';
import { TamaguiText, TamaguiPressableScale } from '@/app/design-system';
import { COPY } from '@/app/copy/copy.ko';
import type { DataBlock } from '@/app/types/dataBlock';

interface Props {
  block: DataBlock;
  compact?: boolean;
}

const SOURCE_LABEL: Record<DataBlock['source'], string> = {
  public_api: '공공데이터',
  user_report: '사용자 제보',
  crawler: '자동 수집',
  inference: 'AI 분석',
};

export default function ProvenanceFooter({ block, compact = false }: Props) {
  const timeAgo = useMemo(
    () => formatDistanceToNow(block.updatedAt, { addSuffix: true, locale: ko }),
    [block.updatedAt]
  );
  const fontSize = compact ? 10 : 11;
  const confidencePct = Math.round((block.confidence ?? 0) * 100);

  return (
    <View style={styles.row}>
      <TamaguiText preset="caption" textColor="tertiary" weight="medium" style={{ fontSize }}>
        {SOURCE_LABEL[block.source]}
      </TamaguiText>
      <TamaguiText preset="caption" textColor="tertiary" style={{ fontSize }}>
        ·
      </TamaguiText>
      <TamaguiText preset="caption" textColor="tertiary" weight="medium" style={{ fontSize }}>
        {timeAgo}
      </TamaguiText>
      <TamaguiText preset="caption" textColor="tertiary" style={{ fontSize }}>
        ·
      </TamaguiText>
      <TamaguiText preset="caption" textColor="tertiary" weight="medium" style={{ fontSize }}>
        {confidencePct}%
      </TamaguiText>
      {block.provenanceUrl && (
        <>
          <TamaguiText preset="caption" textColor="tertiary" style={{ fontSize }}>
            ·
          </TamaguiText>
          <TamaguiPressableScale
            onPress={() => Linking.openURL(block.provenanceUrl!)}
            accessibilityLabel={COPY.A11Y_OPEN_SOURCE}
          >
            <TamaguiText preset="caption" weight="semibold" style={[styles.link, { fontSize }]}>
              출처
            </TamaguiText>
          </TamaguiPressableScale>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  text: {
    color: Colors.textTertiary,
    fontWeight: '500',
  },
  link: {
    color: Colors.primary,
    fontWeight: '600',
  },
});
