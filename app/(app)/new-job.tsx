import * as React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/theme/use-theme-colors';
import { listPrinters, submitPrintJob, uploadDocument, type UploadedDocument } from '@/lib/api';
import { formatBytes, formatCurrency } from '@/lib/format';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { PrinterStatusDot } from '@/components/StatusBadge';
import type { ColorMode, PickedFile, PrinterSummary } from '@/types';

const STEP_LABELS = ['Document', 'Options', 'Printer', 'Confirm'];

export default function NewJobScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const [step, setStep] = React.useState(1);

  const [pickedFile, setPickedFile] = React.useState<PickedFile | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadedDoc, setUploadedDoc] = React.useState<UploadedDocument | null>(null);
  const [pickError, setPickError] = React.useState<string | null>(null);

  const [copies, setCopies] = React.useState('1');
  const [colorMode, setColorMode] = React.useState<ColorMode>('bw');
  const [duplex, setDuplex] = React.useState(true);
  const [pageRange, setPageRange] = React.useState('');

  const [printers, setPrinters] = React.useState<PrinterSummary[]>([]);
  const [selectedPrinter, setSelectedPrinter] = React.useState<PrinterSummary | null>(null);

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (step === 3 && printers.length === 0) {
      listPrinters().then(setPrinters);
    }
  }, [step, printers.length]);

  async function handlePickDocument() {
    setPickError(null);
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/png', 'image/jpeg', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    if (asset.size && asset.size > 50 * 1024 * 1024) {
      setPickError('File exceeds the maximum allowed size of 50 MB.');
      return;
    }

    const file: PickedFile = {
      uri: asset.uri,
      name: asset.name,
      mimeType: asset.mimeType ?? null,
      size: asset.size ?? null,
    };
    setPickedFile(file);
    setUploadedDoc(null);

    setIsUploading(true);
    try {
      const uploaded = await uploadDocument(file);
      setUploadedDoc(uploaded);
    } catch {
      setPickError('Upload failed. Please try again.');
      setPickedFile(null);
    } finally {
      setIsUploading(false);
    }
  }

  const copiesNumber = Math.max(1, Math.min(50, Number(copies) || 1));
  const estimatedCost = React.useMemo(() => {
    const pages = uploadedDoc?.pageCount ?? 1;
    const perPage = colorMode === 'color' ? 0.5 : 0.1;
    return pages * copiesNumber * perPage;
  }, [uploadedDoc, copiesNumber, colorMode]);

  async function handleSubmit() {
    if (!uploadedDoc || !selectedPrinter) return;
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const job = await submitPrintJob({
        documentId: uploadedDoc.id,
        documentName: uploadedDoc.originalFilename,
        printerId: selectedPrinter.id,
        printerName: selectedPrinter.name,
        copies: copiesNumber,
        colorMode,
        duplex,
        pageRange: pageRange || undefined,
      });
      router.replace({ pathname: '/job/[id]', params: { id: job.id } });
    } catch {
      setSubmitError('MyQ could not accept this job. Check your quota and try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.content}>
      <Stepper step={step} />

      {step === 1 && (
        <Card>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Select a document</Text>
          <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 2 }}>
            PDF, Word, or image files up to 50 MB.
          </Text>

          {!pickedFile ? (
            <Button
              label="Choose file"
              variant="secondary"
              onPress={handlePickDocument}
              style={{ marginTop: 16 }}
              icon={<Ionicons name="document-attach-outline" size={18} color={colors.text} />}
            />
          ) : (
            <View style={[styles.fileRow, { borderColor: colors.border, marginTop: 16 }]}>
              <Ionicons name="document-text-outline" size={22} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight: '500' }} numberOfLines={1}>
                  {pickedFile.name}
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                  {pickedFile.size ? formatBytes(pickedFile.size) : ''}
                </Text>
              </View>
              {isUploading && <ActivityIndicator color={colors.primary} />}
            </View>
          )}

          {pickError && (
            <Text style={{ color: colors.destructive, fontSize: 13, marginTop: 10 }}>{pickError}</Text>
          )}
          {uploadedDoc && (
            <Text style={{ color: colors.success, fontSize: 13, marginTop: 10 }}>
              Ready to print · {uploadedDoc.pageCount ?? '?'} page(s)
            </Text>
          )}

          <Button
            label="Next"
            onPress={() => setStep(2)}
            disabled={!uploadedDoc || isUploading}
            style={{ marginTop: 20 }}
          />
        </Card>
      )}

      {step === 2 && (
        <Card>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Print options</Text>

          <Text style={[styles.label, { color: colors.textMuted }]}>Copies</Text>
          <TextInput
            value={copies}
            onChangeText={setCopies}
            keyboardType="number-pad"
            style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.surfaceMuted }]}
          />

          <Text style={[styles.label, { color: colors.textMuted }]}>Page range (optional)</Text>
          <TextInput
            value={pageRange}
            onChangeText={setPageRange}
            placeholder="e.g. 1-5,8"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.surfaceMuted }]}
          />

          <Text style={[styles.label, { color: colors.textMuted }]}>Color mode</Text>
          <View style={styles.segmentRow}>
            {(['bw', 'color'] as ColorMode[]).map((mode) => (
              <Button
                key={mode}
                label={mode === 'bw' ? 'Black & white' : 'Color'}
                variant={colorMode === mode ? 'primary' : 'outline'}
                onPress={() => setColorMode(mode)}
                style={{ flex: 1 }}
              />
            ))}
          </View>

          <View style={[styles.switchRow, { borderColor: colors.border }]}>
            <View>
              <Text style={{ color: colors.text, fontWeight: '500' }}>Double-sided</Text>
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>Print on both sides</Text>
            </View>
            <Switch value={duplex} onValueChange={setDuplex} trackColor={{ true: colors.primary }} />
          </View>

          <View style={styles.navRow}>
            <Button label="Back" variant="outline" onPress={() => setStep(1)} style={{ flex: 1 }} />
            <Button label="Next" onPress={() => setStep(3)} style={{ flex: 1 }} />
          </View>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Choose a printer</Text>
          <View style={{ gap: 10, marginTop: 14 }}>
            {printers.length === 0 && <ActivityIndicator color={colors.primary} />}
            {printers.map((printer) => {
              const disabled = printer.status !== 'online';
              const selected = selectedPrinter?.id === printer.id;
              return (
                <View
                  key={printer.id}
                  onTouchEnd={() => !disabled && setSelectedPrinter(printer)}
                  style={[
                    styles.printerCard,
                    {
                      borderColor: selected ? colors.primary : colors.border,
                      backgroundColor: selected ? colors.surfaceMuted : 'transparent',
                      opacity: disabled ? 0.5 : 1,
                    },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontWeight: '500' }}>{printer.name}</Text>
                    <Text style={{ color: colors.textMuted, fontSize: 12 }}>{printer.location}</Text>
                  </View>
                  <PrinterStatusDot status={printer.status} />
                </View>
              );
            })}
          </View>

          <View style={styles.navRow}>
            <Button label="Back" variant="outline" onPress={() => setStep(2)} style={{ flex: 1 }} />
            <Button label="Next" onPress={() => setStep(4)} disabled={!selectedPrinter} style={{ flex: 1 }} />
          </View>
        </Card>
      )}

      {step === 4 && uploadedDoc && selectedPrinter && (
        <Card>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Confirm & submit</Text>

          <View style={{ gap: 8, marginTop: 14 }}>
            <SummaryRow label="Document" value={uploadedDoc.originalFilename} />
            <SummaryRow label="Copies" value={String(copiesNumber)} />
            <SummaryRow label="Color mode" value={colorMode === 'color' ? 'Color' : 'Black & white'} />
            <SummaryRow label="Duplex" value={duplex ? 'Double-sided' : 'Single-sided'} />
            <SummaryRow label="Printer" value={selectedPrinter.name} />
          </View>

          <View style={[styles.costRow, { backgroundColor: colors.surfaceMuted }]}>
            <Text style={{ color: colors.text, fontWeight: '500' }}>Estimated cost</Text>
            <Text style={{ color: colors.text, fontWeight: '700', fontSize: 16 }}>
              {formatCurrency(estimatedCost)}
            </Text>
          </View>
          <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 6 }}>
            MyQ calculates and enforces the final cost against your quota at submission time.
          </Text>

          {submitError && (
            <Text style={{ color: colors.destructive, fontSize: 13, marginTop: 10 }}>{submitError}</Text>
          )}

          <View style={styles.navRow}>
            <Button label="Back" variant="outline" onPress={() => setStep(3)} disabled={isSubmitting} style={{ flex: 1 }} />
            <Button label="Submit" onPress={handleSubmit} loading={isSubmitting} style={{ flex: 1 }} />
          </View>
        </Card>
      )}
    </ScrollView>
  );
}

function Stepper({ step }: { step: number }) {
  const colors = useThemeColors();
  return (
    <View style={styles.stepperRow}>
      {STEP_LABELS.map((label, index) => {
        const num = index + 1;
        const active = num === step;
        const complete = num < step;
        return (
          <View key={label} style={styles.stepperItem}>
            <View
              style={[
                styles.stepDot,
                {
                  borderColor: active || complete ? colors.primary : colors.border,
                  backgroundColor: complete ? colors.primary : 'transparent',
                },
              ]}
            >
              <Text style={{ color: complete ? colors.primaryText : active ? colors.primary : colors.textMuted, fontSize: 12, fontWeight: '600' }}>
                {complete ? '✓' : num}
              </Text>
            </View>
            <Text style={{ fontSize: 10, color: active || complete ? colors.text : colors.textMuted, marginTop: 4 }}>
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  const colors = useThemeColors();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text style={{ color: colors.textMuted, fontSize: 13 }}>{label}</Text>
      <Text style={{ color: colors.text, fontSize: 13, fontWeight: '500' }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 16, paddingBottom: 40 },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  label: { fontSize: 13, fontWeight: '500', marginTop: 14, marginBottom: 6 },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
  },
  segmentRow: { flexDirection: 'row', gap: 10, marginTop: 6 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    padding: 12,
    marginTop: 16,
  },
  navRow: { flexDirection: 'row', gap: 10, marginTop: 20 },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    padding: 12,
  },
  printerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    padding: 14,
  },
  costRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 10,
    padding: 12,
    marginTop: 16,
  },
  stepperRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 8 },
  stepperItem: { alignItems: 'center', width: 70 },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
