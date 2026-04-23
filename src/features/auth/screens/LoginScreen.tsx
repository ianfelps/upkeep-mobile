import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AppLogo, Banner, Button, Screen, Text, TextField } from '@/components';
import { colors, spacing } from '@/theme';
import { getErrorMessage } from '@/api/errors';
import { syncEngine } from '@/sync/syncEngine';
import { useLogin } from '../hooks';
import { loginSchema, type LoginValues } from '../schemas';

export default function LoginScreen() {
  const router = useRouter();
  const login = useLogin();

  const { control, handleSubmit, formState } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await login.mutateAsync(values);
      // Aguarda pull inicial para DB ter dados antes de navegar.
      // Promise.race garante no máximo 5s de espera (ex: offline).
      await Promise.race([
        syncEngine.tick('login'),
        new Promise<void>((resolve) => setTimeout(resolve, 5000)),
      ]);
      router.replace('/(tabs)/eventos');
    } catch {
      // erro já exposto via login.error
    }
  });

  return (
    <Screen padded>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <AppLogo size="md" />
            <Text variant="display">Upkeep</Text>
            <Text variant="body" color={colors.textMuted}>
              Organize sua rotina, um dia de cada vez.
            </Text>
          </View>

          <View style={styles.form}>
            {login.isError && (
              <Banner tone="error" message={getErrorMessage(login.error)} />
            )}

            <Controller
              control={control}
              name="email"
              render={({ field, fieldState }) => (
                <TextField
                  label="E-mail"
                  placeholder="voce@email.com"
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  error={fieldState.error?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="password"
              render={({ field, fieldState }) => (
                <TextField
                  label="Senha"
                  placeholder="••••••••"
                  secureTextEntry
                  showPasswordToggle
                  autoComplete="password"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  error={fieldState.error?.message}
                />
              )}
            />
            <Button
              label="Entrar"
              size="lg"
              fullWidth
              loading={formState.isSubmitting || login.isPending}
              onPress={onSubmit}
              style={{ marginTop: spacing.sm }}
            />
          </View>

          <View style={styles.footer}>
            <Text variant="body" color={colors.textMuted}>
              Ainda não tem uma conta?
            </Text>
            <Link href="/(auth)/register" asChild>
              <Button label="Criar conta" variant="link" />
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    paddingVertical: spacing.xl,
    gap: spacing.xl,
  },
  header: { gap: spacing.sm, alignItems: 'flex-start' },
  form: { gap: spacing.md },
  footer: {
    marginTop: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
});
