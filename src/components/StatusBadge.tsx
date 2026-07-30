import * as React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useThemeColors } from '@/theme/use-theme-colors';
import type { JobStatus, PrinterStatus } from '@/types';

const JOB_LABELS: Record<JobStatus, string> = {
  pending: 'Pending',
  submitted: 'Submitted',
  queued: 'Queued',
  printing: 'Printing',
  released: 'Released',
  completed: 'Completed',
  failed: 'Failed',
  cancelled: 'Cancelled',
};

export function JobStatusBadge({ status }: { status: JobStatus }) {
  const colors = useThemeColors();

  const { bg, fg } =
    status === 'completed' || status === 'released'
      ? { bg: colors.successBg, fg: colors.success }
      : status === 'failed' || status === 'cancelled'
        ? { bg: colors.destructiveBg, fg: colors.destructive }
        : status === 'queued'
          ? { bg: colors.warningBg, fg: colors.warning }
          : { bg: colors.surfaceMuted, fg: colors.textMuted };

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      {status === 'printing' && <ActivityIndicator size="small" color={fg} style={styles.spinner} />}
      <Text style={[styles.text, { color: fg }]}>{JOB_LABELS[status]}</Text>
    </View>
  );
}

export function PrinterStatusDot({ status }: { status: PrinterStatus }) {
  const colors = useThemeColors();
  const color =
    status === 'online'
      ? colors.success
      : status === 'error'
        ? colors.destructive
        : status === 'maintenance'
          ? colors.warning
          : colors.textMuted;

  return <View style={[styles.dot, { backgroundColor: color }]} />;
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
    gap: 6,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
  spinner: {
    marginRight: 2,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
