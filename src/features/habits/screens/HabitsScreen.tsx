import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import {
  ConfirmSheet,
  EmptyState,
  FAB,
  Screen,
  SegmentedControl,
  Text,
  type ConfirmSheetHandle,
} from '@/components';
import { useColors } from '@/theme/useColors';
import { spacing } from '@/theme';
import { syncEngine } from '@/sync/syncEngine';
import { dayjs, toDateKey } from '@/utils/date';
import type { LocalHabit } from '@/db/repositories/habits';
import { useGlobalHeatmap, useHabitsList } from '../queries';
import { useDeleteHabit } from '../mutations';
import { habitsQueryKeys } from '../queryKeys';
import { ConnectionStatusIcon } from '@/features/events/components/ConnectionStatusIcon';
import { HabitCard } from '../components/HabitCard';
import { HabitFormModal, type HabitFormModalHandle } from '../components/HabitFormModal';
import { HabitsHeatmap } from '../components/HabitsHeatmap';
import type { HabitWithTodayLog, HeatmapRange } from '../types';

const RANGE_DAYS: Record<HeatmapRange, number> = {
  month: 30,
  '6months': 182,
  year: 364,
};

export default function HabitsScreen() {
  const colors = useColors();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [syncDone, setSyncDone] = useState(() => syncEngine.hasSynced());
  const formRef = useRef<HabitFormModalHandle>(null);
  const deleteSheetRef = useRef<ConfirmSheetHandle>(null);
  const [pendingDelete, setPendingDelete] = useState<LocalHabit | null>(null);
  const remove = useDeleteHabit();

  useEffect(() => {
    return syncEngine.onResult(() => {
      setSyncDone(true);
      queryClient.invalidateQueries({ queryKey: habitsQueryKeys.all });
    });
  }, [queryClient]);

  const [heatmapRange, setHeatmapRange] = useState<HeatmapRange>('year');
  const range = useMemo(() => {
    const today = dayjs();
    return {
      from: toDateKey(today.subtract(RANGE_DAYS[heatmapRange], 'day')),
      to: toDateKey(today),
    };
  }, [heatmapRange]);

  const list = useHabitsList();
  const heatmap = useGlobalHeatmap(range.from, range.to);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await syncEngine.tick('pullToRefresh');
      await Promise.all([list.refetch(), heatmap.refetch()]);
    } finally {
      setRefreshing(false);
    }
  };

  const items = list.data ?? [];
  const isLoading = list.isLoading || heatmap.isLoading;
  const isFetching = list.isFetching || heatmap.isFetching;

  const openCreate = () => formRef.current?.open();
  const openEdit = (item: HabitWithTodayLog) => {
    router.push(`/(tabs)/habitos/${item.habit.localId}` as never);
  };

  const handleDeleteRequest = (habit: LocalHabit) => {
    setPendingDelete(habit);
    formRef.current?.close();
    setTimeout(() => deleteSheetRef.current?.open(), 350);
  };

  const handleDeleteConfirm = async () => {
    if (!pendingDelete) return;
    const toDelete = pendingDelete;
    setPendingDelete(null);
    try {
      await remove.mutateAsync(toDelete.localId);
    } catch {
      // toast pela mutation
    }
  };

  const totalActive = items.filter((i) => i.habit.isActive).length;

  return (
    <Screen>
      <View
        style={[
          styles.header,
          { borderBottomColor: colors.border, backgroundColor: colors.surface },
        ]}
      >
        <View style={styles.titleRow}>
          <Text variant="display">Hábitos</Text>
          <ConnectionStatusIcon />
        </View>
      </View>

      {!syncDone || isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => it.habit.localId}
          renderItem={({ item }) => <HabitCard item={item} onPress={openEdit} />}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          contentContainerStyle={[
            styles.listContent,
            items.length === 0 && styles.listContentEmpty,
          ]}
          ListHeaderComponent={
            <View style={styles.headerBlock}>
              <Text variant="smallMedium" color={colors.textMuted} style={styles.heatmapTitle}>
                ATIVIDADE — ÚLTIMOS 12 MESES
              </Text>
              <View style={[styles.heatmapCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <SegmentedControl
                  value={heatmapRange}
                  onChange={(v) => setHeatmapRange(v as HeatmapRange)}
                  options={[
                    { value: 'month', label: '1m' },
                    { value: '6months', label: '6m' },
                    { value: 'year', label: '1a' },
                  ]}
                />
                <View style={{ height: spacing.sm }} />
                <HabitsHeatmap
                  cells={heatmap.data ?? []}
                  color={colors.primary}
                />
                <Text variant="caption" color={colors.textMuted} style={{ marginTop: spacing.xs }}>
                  {totalActive} hábito{totalActive !== 1 ? 's' : ''} ativo{totalActive !== 1 ? 's' : ''}
                </Text>
              </View>
              {items.length > 0 && (
                <Text variant="smallMedium" color={colors.textMuted} style={styles.listTitle}>
                  SEUS HÁBITOS
                </Text>
              )}
            </View>
          }
          ListEmptyComponent={
            <EmptyState
              icon="repeat"
              title="Sem hábitos"
              subtitle="Crie seu primeiro hábito tocando no botão +."
              style={{ flex: 1 }}
            />
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing || isFetching}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        />
      )}

      <FAB onPress={openCreate} accessibilityLabel="Novo hábito" />

      <HabitFormModal ref={formRef} onDeleteRequest={handleDeleteRequest} />

      <ConfirmSheet
        ref={deleteSheetRef}
        title="Excluir hábito"
        message={`Tem certeza que deseja excluir "${pendingDelete?.title ?? ''}"? Os registros também serão removidos.`}
        confirmLabel="Excluir"
        tone="destructive"
        loading={remove.isPending}
        onConfirm={handleDeleteConfirm}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
    paddingBottom: spacing.base,
    borderBottomWidth: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: spacing.base,
    paddingBottom: 96,
    gap: spacing.sm,
  },
  listContentEmpty: { flexGrow: 1 },
  headerBlock: { gap: spacing.sm, marginBottom: spacing.base },
  heatmapTitle: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heatmapCard: {
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
  },
  listTitle: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.sm,
  },
});
