import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import NetInfo from '@react-native-community/netinfo';
import { Sheet, Text } from '@/components';
import { colors, radii, spacing } from '@/theme';
import {
  countWithSyncError,
  findWithSyncError,
  type LocalEvent,
} from '@/db/repositories/routineEvents';
import { syncEngine } from '@/sync/syncEngine';
import { resolveEventColor } from '../constants';

const STATUS_LABELS: Record<string, string> = {
  pending_create: 'A criar',
  pending_update: 'A atualizar',
  pending_delete: 'A remover',
};

function SyncErrorItem({ event }: { event: LocalEvent }) {
  const statusLabel = STATUS_LABELS[event.syncStatus] ?? event.syncStatus;
  const dotColor = resolveEventColor(event.color);

  return (
    <View style={styles.item}>
      <View style={[styles.itemDot, { backgroundColor: dotColor }]} />
      <View style={styles.itemBody}>
        <Text variant="bodyMedium" numberOfLines={1}>
          {event.title}
        </Text>
        <Text variant="caption" color={colors.textMuted}>
          {statusLabel}
          {event.syncAttempts > 0 ? ` · ${event.syncAttempts} tentativa${event.syncAttempts > 1 ? 's' : ''}` : ''}
        </Text>
        {event.syncError && (
          <Text variant="small" color={colors.error} numberOfLines={2}>
            {event.syncError}
          </Text>
        )}
      </View>
    </View>
  );
}

export function ConnectionStatusIcon() {
  const sheetRef = useRef<BottomSheetModal>(null);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      setOffline(!state.isConnected || state.isInternetReachable === false);
    });
    NetInfo.fetch().then((state) => {
      setOffline(!state.isConnected || state.isInternetReachable === false);
    });
    return unsub;
  }, []);

  const countQuery = useQuery({
    queryKey: ['events', 'syncErrorCount'],
    queryFn: countWithSyncError,
    staleTime: 5_000,
  });

  const listQuery = useQuery({
    queryKey: ['events', 'syncErrorList'],
    queryFn: findWithSyncError,
    staleTime: 5_000,
    enabled: false,
  });

  useEffect(() => {
    return syncEngine.onResult(() => {
      countQuery.refetch();
      listQuery.refetch();
    });
  }, [countQuery, listQuery]);

  const syncErrors = countQuery.data ?? 0;
  const hasSyncError = syncErrors > 0;

  if (!offline && !hasSyncError) return null;

  const isSyncError = hasSyncError;
  const iconName: 'alert-circle' | 'wifi-off' = isSyncError ? 'alert-circle' : 'wifi-off';
  const iconColor = isSyncError ? colors.error : colors.warn;
  const bgColor = isSyncError ? colors.errorMuted : colors.warnMuted;

  const onPress = () => {
    if (isSyncError) listQuery.refetch();
    sheetRef.current?.present();
  };

  const errorEvents = listQuery.data ?? [];

  return (
    <>
      <Pressable
        onPress={onPress}
        style={[styles.btn, { backgroundColor: bgColor }]}
        accessibilityRole="button"
        accessibilityLabel={isSyncError ? 'Erro de sincronização' : 'Sem conexão'}
        hitSlop={8}
      >
        <Feather name={iconName} size={16} color={iconColor} />
      </Pressable>

      <Sheet ref={sheetRef} snapPoints={isSyncError ? ['55%'] : ['38%']}>
        {isSyncError ? (
          <>
            <View style={styles.sheetIconRow}>
              <View style={[styles.sheetIconWrap, { backgroundColor: colors.errorMuted }]}>
                <Feather name="alert-circle" size={28} color={colors.error} />
              </View>
              <View style={styles.sheetTitleBlock}>
                <Text variant="h2">Erro de sincronização</Text>
                <Text variant="small" color={colors.textMuted}>
                  {syncErrors === 1
                    ? '1 evento aguardando sincronização'
                    : `${syncErrors} eventos aguardando sincronização`}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
              {errorEvents.map((ev) => (
                <SyncErrorItem key={ev.localId} event={ev} />
              ))}
              {errorEvents.length === 0 && (
                <Text variant="small" color={colors.textMuted} style={styles.emptyList}>
                  Carregando...
                </Text>
              )}
            </ScrollView>

            <Text variant="caption" color={colors.textMuted} style={styles.footer}>
              O app tentará sincronizar automaticamente quando houver conexão.
            </Text>
          </>
        ) : (
          <>
            <View style={styles.sheetIconRow}>
              <View style={[styles.sheetIconWrap, { backgroundColor: colors.warnMuted }]}>
                <Feather name="wifi-off" size={28} color={colors.warn} />
              </View>
              <View style={styles.sheetTitleBlock}>
                <Text variant="h2">Sem conexão</Text>
                <Text variant="small" color={colors.textMuted}>
                  Modo offline ativo
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <Text variant="body" color={colors.textMuted}>
              Você está offline. Suas alterações ficam salvas localmente e serão sincronizadas automaticamente assim que a conexão for restaurada.
            </Text>
          </>
        )}
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  sheetIconWrap: {
    width: 52,
    height: 52,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTitleBlock: {
    flex: 1,
    gap: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  list: {
    flex: 1,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  itemDot: {
    width: 10,
    height: 10,
    borderRadius: radii.pill,
    marginTop: 5,
  },
  itemBody: {
    flex: 1,
    gap: 2,
  },
  emptyList: {
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  footer: {
    textAlign: 'center',
    paddingTop: spacing.xs,
  },
});
