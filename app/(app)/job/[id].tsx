import * as React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/theme/use-theme-colors';
import { getPrintJob } from '@/lib/api';
import { formatCurrency, formatRelativeTime } from '@/lib/format';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { JobStatusBadge } from '@/components/StatusBadge';
import type { PrintJobSummary } from '@/types';

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useThemeColors();

  const [job, setJob] = React.useState<PrintJobSummary | null>(null);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!id) return;
    const result = await getPrintJob(id);
    setJob(result);
  }, [id]);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function handleRefresh() {
    setIsRefreshing(true);
    await load();
    setIsRefreshing(false);
  }

  if (!job) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const isTerminal = ['completed', 'failed', 'cancelled', 'released'].includes(job.status);

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.content}>
      <View style={styles.iconWrap}>
        <View
          style={[
            styles.iconCircle,
            {
              backgroundColor:
                job.status === 'completed'
                  ? colors.successBg
                  : job.status === 'failed'
                    ? colors.destructiveBg
                    : colors.surfaceMuted,
            },
          ]}
        >
          <Ionicons
            name={
              job.status === 'completed'
                ? 'checkmark-circle'
                : job.status === 'failed'
                  ? 'close-circle'
                  : 'time-outline'
            }
            size={40}
            color={
              job.status === 'completed'
                ? colors.success
                : job.status === 'failed'
                  ? colors.destructive
                  : colors.textMuted
            }
          />
        </View>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {job.documentName}
        </Text>
        <JobStatusBadge status={job.status} />
      </View>

      <Card>
        <SummaryRow label="Printer" value={job.printerName} />
        <SummaryRow label="Copies" value={String(job.copies)} />
        <SummaryRow label="Color mode" value={job.colorMode === 'color' ? 'Color' : 'Black & white'} />
        <SummaryRow label="Duplex" value={job.duplex ? 'Double-sided' : 'Single-sided'} />
        <SummaryRow
          label="Cost"
          value={
            job.costActual != null
              ? formatCurrency(job.costActual)
              : job.costEstimate != null
                ? `~${formatCurrency(job.costEstimate)} (estimate)`
                : '—'
          }
        />
        <SummaryRow label="Submitted" value={formatRelativeTime(job.createdAt)} />
      </Card>

      {job.status === 'failed' && job.errorMessage && (
        <Card style={{ borderColor: colors.destructive }}>
          <Text style={{ color: colors.destructive, fontSize: 13 }}>{job.errorMessage}</Text>
        </Card>
      )}

      {!isTerminal && (
        <Button
          label="Refresh status"
          variant="outline"
          onPress={handleRefresh}
          loading={isRefreshing}
          icon={<Ionicons name="refresh" size={16} color={colors.text} />}
        />
      )}

      <Button label="Back to home" onPress={() => router.replace('/home')} />
    </ScrollView>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  const colors = useThemeColors();
  return (
    <View style={styles.row}>
      <Text style={{ color: colors.textMuted, fontSize: 13 }}>{label}</Text>
      <Text style={{ color: colors.text, fontSize: 13, fontWeight: '500' }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, gap: 16, paddingBottom: 40 },
  iconWrap: { alignItems: 'center', gap: 10, marginTop: 12 },
  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 17, fontWeight: '600', textAlign: 'center', paddingHorizontal: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
});
