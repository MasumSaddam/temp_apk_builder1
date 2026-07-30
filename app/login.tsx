import * as React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/use-auth';
import { useThemeColors } from '@/theme/use-theme-colors';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();
  const colors = useThemeColors();

  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  async function handleSubmit() {
    setError(null);
    setIsSubmitting(true);
    const result = await login(username.trim(), password);
    setIsSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.replace('/home');
  }

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={[styles.logo, { backgroundColor: colors.primary }]}>
            <Ionicons name="print" size={28} color={colors.primaryText} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>BRAC Print+</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Sign in with your BRAC University AD/LDAP account
          </Text>
        </View>

        <Card>
          <Text style={[styles.label, { color: colors.textMuted }]}>Username</Text>
          <TextInput
            value={username}
            onChangeText={setUsername}
            placeholder="e.g. student1"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            style={[
              styles.input,
              { borderColor: colors.border, color: colors.text, backgroundColor: colors.surfaceMuted },
            ]}
          />

          <Text style={[styles.label, { color: colors.textMuted, marginTop: 14 }]}>Password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            style={[
              styles.input,
              { borderColor: colors.border, color: colors.text, backgroundColor: colors.surfaceMuted },
            ]}
          />

          {error && (
            <View style={[styles.errorBox, { backgroundColor: colors.destructiveBg }]}>
              <Text style={{ color: colors.destructive, fontSize: 13 }}>{error}</Text>
            </View>
          )}

          <Button
            label="Sign in"
            onPress={handleSubmit}
            loading={isSubmitting}
            disabled={!username || !password}
            style={{ marginTop: 18 }}
          />

          <Text style={[styles.hint, { color: colors.textMuted }]}>
            Demo mode: try <Text style={{ fontWeight: '600', color: colors.text }}>student1</Text> with
            any password.
          </Text>
        </Card>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 24,
  },
  header: {
    alignItems: 'center',
    gap: 8,
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  errorBox: {
    marginTop: 14,
    borderRadius: 10,
    padding: 10,
  },
  hint: {
    marginTop: 14,
    fontSize: 12,
    textAlign: 'center',
  },
});
