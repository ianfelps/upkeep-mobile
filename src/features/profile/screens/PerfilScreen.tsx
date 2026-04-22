import React, { useRef } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Card, Screen, Text } from '@/components';
import { colors, radii, spacing } from '@/theme';
import { useAuthStore } from '@/features/auth/store';
import { useLogout } from '@/features/auth/hooks';
import { dayjs } from '@/utils/date';
import {
  EditProfileModal,
  type EditProfileModalHandle,
} from '../components/EditProfileModal';
import {
  ChangePasswordModal,
  type ChangePasswordModalHandle,
} from '../components/ChangePasswordModal';
import { useDeleteAccount } from '../mutations';
import { getErrorMessage } from '@/api/errors';

export default function PerfilScreen() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const logout = useLogout();
  const deleteAccount = useDeleteAccount();

  const editRef = useRef<EditProfileModalHandle>(null);
  const pwRef = useRef<ChangePasswordModalHandle>(null);

  const initials = (user?.name ?? '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

  const memberSince = user?.createdAt
    ? dayjs(user.createdAt).format('MMMM [de] YYYY')
    : null;

  const confirmLogout = () => {
    Alert.alert('Sair', 'Deseja encerrar sua sessão neste aparelho?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          await logout.mutateAsync();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const confirmDeleteAccount = () => {
    Alert.alert(
      'Excluir conta',
      'Isso removerá permanentemente sua conta e todos os seus dados deste aparelho. Continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Tenho certeza',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirmar exclusão',
              'Essa ação é irreversível. Tem certeza absoluta?',
              [
                { text: 'Voltar', style: 'cancel' },
                {
                  text: 'Excluir definitivamente',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await deleteAccount.mutateAsync();
                      router.replace('/(auth)/login');
                    } catch (err) {
                      Alert.alert('Erro', getErrorMessage(err));
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text variant="display" style={styles.heading}>
          Perfil
        </Text>

        <Card padding="lg" style={styles.identityCard}>
          <View style={styles.avatar}>
            <Text variant="h1" color={colors.primaryContrast}>
              {initials || '?'}
            </Text>
          </View>
          <View style={styles.identityInfo}>
            <Text variant="h1">{user?.name ?? '—'}</Text>
            <Text variant="body" color={colors.textMuted}>
              {user?.email ?? '—'}
            </Text>
            {memberSince && (
              <Text variant="small" color={colors.textMuted}>
                Membro desde {memberSince}
              </Text>
            )}
          </View>
        </Card>

        <View style={styles.actions}>
          <ActionRow
            icon="edit-3"
            label="Editar perfil"
            onPress={() => editRef.current?.open()}
          />
          <ActionRow
            icon="lock"
            label="Alterar senha"
            onPress={() => pwRef.current?.open()}
          />
          <ActionRow
            icon="log-out"
            label="Sair"
            onPress={confirmLogout}
            loading={logout.isPending}
          />
          <ActionRow
            icon="trash-2"
            label="Excluir conta"
            tone="destructive"
            onPress={confirmDeleteAccount}
            loading={deleteAccount.isPending}
          />
        </View>

        <Text variant="small" color={colors.textMuted} align="center" style={styles.version}>
          Upkeep · v0.1.0
        </Text>
      </ScrollView>

      <EditProfileModal ref={editRef} />
      <ChangePasswordModal ref={pwRef} />
    </Screen>
  );
}

function ActionRow({
  icon,
  label,
  onPress,
  tone = 'default',
  disabled,
  loading,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
  tone?: 'default' | 'destructive';
  disabled?: boolean;
  loading?: boolean;
}) {
  const fg = tone === 'destructive' ? colors.error : colors.text;
  const isDisabled = disabled || loading;
  return (
    <Card
      onPress={isDisabled ? undefined : onPress}
      padding="base"
      style={{ ...styles.actionRow, opacity: isDisabled ? 0.5 : 1 }}
    >
      <View style={styles.actionInner}>
        <Feather name={icon} size={18} color={fg} />
        <Text variant="bodyMedium" color={fg} style={{ flex: 1 }}>
          {label}
        </Text>
        {!isDisabled && <Feather name="chevron-right" size={18} color={colors.textMuted} />}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: spacing.base,
    paddingBottom: spacing.xl,
    gap: spacing.base,
  },
  heading: { marginBottom: spacing.sm },
  identityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityInfo: { flex: 1, gap: 2 },
  actions: { gap: spacing.sm },
  actionRow: {
    paddingVertical: spacing.md,
    borderRadius: radii.md,
  },
  actionInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  version: { marginTop: spacing.lg },
});
