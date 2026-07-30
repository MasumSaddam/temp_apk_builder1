import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { useThemeColors } from '@/theme/use-theme-colors';

export function ProgressBar({ progress, danger }: { progress: number; danger?: boolean }) {
  const colors = useThemeColors();
  const clamped = Math.max(0, Math.min(1, progress));

  return (
    <View style={[styles.track, { backgroundColor: colors.surfaceMuted }]}>
      <View
        style={[
          styles.fill,
          {
            width: `${clamped * 100}%`,
            backgroundColor: danger ? colors.destructive : colors.primary,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
  },
});
