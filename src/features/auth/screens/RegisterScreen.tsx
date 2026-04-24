import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Banner, Button, Screen, Text, TextField } from '@/components';
import { useColors } from '@/theme/useColors';
import { spacing } from '@/theme';
import { getErrorMessage } from '@/api/errors';
import { useRegister } from '../hooks';
import { registerSchema, type RegisterValues } from '../schemas';

export default function RegisterScreen() {
  const colors = useColors();
  const router = useRouter();
  const register = useRegister();

  const { control, handleSubmit, formState } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  const onSubmit = handleSubmit(async ({ confirmPassword: _, ...values }) => {
    try {
      await register.mutateAsync(values);
      router.replace('/(tabs)/eventos');
    } catch {
      // erro já exposto via register.error
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
            <Button
              label="Voltar"
              variant="link"
              leadingIcon={<Feather name="chevron-left" size={18} color={colors.primary} />}
              onPress={() => router.back()}
              style={{ alignSelf: 'flex-start', paddingHorizontal: 0 }}
            />
            <Text variant="display">Criar conta</Text>
            <Text variant="body" color={colors.textMuted}>
              Comece a organizar sua rotina em menos de um minuto.
            </Text>
          </View>

          <View style={styles.form}>
            {register.isError && (
              <Banner tone="error" message={getErrorMessage(register.error)} />
            )}

            <Controller
              control={control}
              name="name"
              render={({ field, fieldState }) => (
                <TextField
                  label="Nome"
                  placeholder="Seu nome"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  error={fieldState.error?.message}
                />
              )}
            />
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
                  placeholder="Mínimo 6 caracteres"
                  secureTextEntry
                  showPasswordToggle
                  autoComplete="password-new"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  error={fieldState.error?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="confirmPassword"
              render={({ field, fieldState }) => (
                <TextField
                  label="Confirmar senha"
                  placeholder="Repita a senha"
                  secureTextEntry
                  showPasswordToggle
                  autoComplete="password-new"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  error={fieldState.error?.message}
                />
              )}
            />
            <Button
              label="Criar conta"
              size="lg"
              fullWidth
              loading={formState.isSubmitting || register.isPending}
              onPress={onSubmit}
              style={{ marginTop: spacing.sm }}
            />
          </View>

          <View style={styles.footer}>
            <Text variant="body" color={colors.textMuted}>
              Já tem conta?
            </Text>
            <Link href="/(auth)/login" asChild>
              <Button label="Entrar" variant="link" />
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
