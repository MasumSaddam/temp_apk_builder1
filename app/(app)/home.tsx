import * as React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/use-auth';
import { useThemeColors } from '@/theme/use-theme-colors';
import { getQuota, listPrinters, listPrintJobs } from '@/lib/api';
import { formatCurrency, formatRelativeTime } from '@/lib/format';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ProgressBar } from '@/components/ProgressBar';
import { JobStatusBadge, PrinterStatusDot } from '@/components/StatusBadge';
import type { PrinterSummary, PrintJobSummary, QuotaSummary } from '@/types';

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const colors = useThemeColors();

  const [quota, setQuota] = React.useState<QuotaSummary | null>(null);
  const [printers, setPrinters] = React.useState<PrinterSummary[]>([]);
  const [jobs, setJobs] = React.useState<PrintJobSummary[]>([]);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const load = React.useCallback(async () => {
    const [q, p, j] = await Promise.all([getQuota(), listPrinters(), listPrintJobs()]);
    setQuota(q);
    setPrinters(p);
    setJobs(j.slice(0, 3));
  }, []);

  // Fetch-on-mount: load() awaits network calls before setting state, which
  // is exactly what effects are for (synchronizing with an external system).
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function handleRefresh() {
    setIsRefreshing(true);
    await load();
    setIsRefreshing(false);
  }

  const onlineCount = printers.filter((p) => p.status === 'online').length;
  const usedRatio = quota ? quota.pagesUsed / Math.max(quota.pagesAllocated, 1) : 0;
  const isLowQuota = quota ? quota.pagesRemaining / Math.max(quota.pagesAllocated, 1) < 0.15 : false;

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
    >
      <View>
        <Text style={[styles.greeting, { color: colors.text }]}>
          Hi, {user?.displayName.split(' ')[0]}
        </Text>
        <Text style={[styles.subGreeting, { color: colors.textMuted }]}>
          Here&apos;s your printing overview
        </Text>
      </View>

      <Card>
        <View style={styles.rowBetween}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Print Quota</Text>
          {quota && (
            <Text style={{ color: colors.textMuted, fontSize: 12 }}>
              {quota.periodType.charAt(0).toUpperCase() + quota.periodType.slice(1)}
            </Text>
          )}
        </View>

        {quota ? (
          <>
            <View style={{ marginTop: 12 }}>
              <ProgressBar progress={usedRatio} danger={isLowQuota} />
            </View>
            <View style={[styles.rowBetween, { marginTop: 10 }]}>
              <Text style={{ color: colors.textMuted, fontSize: 13 }}>
                {quota.pagesUsed.toLocaleString()} / {quota.pagesAllocated.toLocaleString()} pages used
              </Text>
              <Text
                style={{
                  color: isLowQuota ? colors.destructive : colors.text,
                  fontSize: 13,
                  fontWeight: '600',
                }}
              >
                {quota.pagesRemaining.toLocaleString()} left
              </Text>
            </View>
            <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 6 }}>
              Credit balance: {formatCurrency(quota.creditBalance)}
            </Text>
            {isLowQuota && (
              <View style={[styles.warningBox, { backgroundColor: colors.destructiveBg }]}>
                <Text style={{ color: colors.destructive, fontSize: 12 }}>
                  Your print balance is running low.
                </Text>
              </View>
            )}
          </>
        ) : (
          <Text style={{ color: colors.textMuted, marginTop: 12 }}>Loading…</Text>
        )}
      </Card>

      <Button
        label="Upload & Print"
        onPress={() => router.push('/new-job')}
        icon={<Ionicons name="cloud-upload-outline" size={18} color={colors.primaryText} />}
      />

      <Card>
        <View style={styles.rowBetween}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Printer Availability</Text>
          <Text style={{ color: colors.textMuted, fontSize: 12 }}>
            {onlineCount}/{printers.length} online
          </Text>
        </View>
        <View style={{ gap: 10, marginTop: 10 }}>
          {printers.map((printer) => (
            <View key={printer.id} style={styles.rowBetween}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontSize: 14, fontWeight: '500' }} numberOfLines={1}>
                  {printer.name}
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: 12 }} numberOfLines={1}>
                  {printer.location}
                </Text>
              </View>
              <PrinterStatusDot status={printer.status} />
            </View>
          ))}
        </View>
      </Card>

      <Card>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Recent Print Jobs</Text>
        <View style={{ gap: 14, marginTop: 10 }}>
          {jobs.length === 0 && (
            <Text style={{ color: colors.textMuted, fontSize: 13 }}>No print jobs yet.</Text>
          )}
          {jobs.map((job) => (
            <View key={job.id} style={styles.rowBetween}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={{ color: colors.text, fontSize: 14, fontWeight: '500' }} numberOfLines={1}>
                  {job.documentName}
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: 12 }} numberOfLines={1}>
                  {job.printerName} · {formatRelativeTime(job.createdAt)}
                </Text>
              </View>
              <JobStatusBadge status={job.status} />
            </View>
          ))}
        </View>
      </Card>

      <Button label="Sign out" variant="outline" onPress={logout} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    gap: 16,
    paddingBottom: 40,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
  },
  subGreeting: {
    fontSize: 14,
    marginTop: 2,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  warningBox: {
    marginTop: 10,
    borderRadius: 10,
    padding: 10,
  },
});
