import React, { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ConfirmSheet, Screen, SegmentedControl, Text, type ConfirmSheetHandle } from '@/components';
import { HabitFormModal, type HabitFormModalHandle } from '../components/HabitFormModal';
import { useDeleteHabit } from '../mutations';
import type { LocalHabit } from '@/db/repositories/habits';
import { useColors } from '@/theme/useColors';
import { spacing } from '@/theme';
import { dayjs, formatDayHeader, toDateKey } from '@/utils/date';
import { resolveHabitColor } from '../constants';
import { useHabitDetail } from '../queries';
import * as habitLogsRepo from '@/db/repositories/habitLogs';
import * as eventsRepo from '@/db/repositories/routineEvents';
import { useQuery } from '@tanstack/react-query';
import { Chip } from '@/components';
import { HabitDetailHeader } from '../components/HabitDetailHeader';
import { HabitsHeatmap } from '../components/HabitsHeatmap';
import { LogEditSheet, type LogEditSheetHandle } from '../components/LogEditSheet';
import { buildHabitHeatmap } from '../selectors';
import type { HeatmapCell, HeatmapRange } from '../types';

const RANGE_DAYS: Record<HeatmapRange, number> = {
  month: 30,
  '6months': 182,
  year: 364,
};

const STATUS_LABEL: Record<string, string> = {
  completed: 'Concluído',
  skipped: 'Pulado',
  missed: 'Perdido',
};

export default function HabitDetailScreen({ localId }: { localId: string }) {
  const colors = useColors();
  const detail = useHabitDetail(localId);
  const sheetRef = useRef<LogEditSheetHandle>(null);
  const formRef = useRef<HabitFormModalHandle>(null);
  const deleteSheetRef = useRef<ConfirmSheetHandle>(null);
  const remove = useDeleteHabit();
  const [pendingDelete, setPendingDelete] = useState<LocalHabit | null>(null);

  const handleDeleteRequest = (h: LocalHabit) => {
    setPendingDelete(h);
    formRef.current?.close();
    setTimeout(() => deleteSheetRef.current?.open(), 350);
  };

  const handleDeleteConfirm = async () => {
    if (!pendingDelete) return;
    const toDelete = pendingDelete;
    setPendingDelete(null);
    try {
      await remove.mutateAsync(toDelete.localId);
      router.back();
    } catch {
      // toast
    }
  };

  const openLogEdit = async (targetDate: string) => {
    const existing = await habitLogsRepo.findForHabitOnDate(localId, targetDate);
    sheetRef.current?.open({ habitLocalId: localId, targetDate, existing });
  };

  const [heatmapRange, setHeatmapRange] = useState<HeatmapRange>('year');
  const range = useMemo(() => {
    const today = dayjs();
    return {
      from: toDateKey(today.subtract(RANGE_DAYS[heatmapRange], 'day')),
      to: toDateKey(today),
    };
  }, [heatmapRange]);

  const cells: HeatmapCell[] = useMemo(() => {
    if (!detail.data) return [];
    return buildHabitHeatmap(detail.data.logs, range.from, range.to);
  }, [detail.data, range]);

  const onCellPress = async (cell: HeatmapCell) => {
    if (!detail.data) return;
    const todayKey = toDateKey(dayjs());
    if (cell.dateKey > todayKey) return;
    const existing = await habitLogsRepo.findForHabitOnDate(localId, cell.dateKey);
    sheetRef.current?.open({ habitLocalId: localId, targetDate: cell.dateKey, existing });
  };

  const linkedEventIds = detail.data?.habit.linkedRoutineEventIdsParsed ?? [];
  const linkedEventsQuery = useQuery({
    queryKey: ['habits', 'linkedEvents', localId, linkedEventIds.join(',')],
    queryFn: async () => {
      const out: { remoteId: string; title: string }[] = [];
      for (const rid of linkedEventIds) {
        const ev = await eventsRepo.getByRemoteId(rid);
        if (ev) out.push({ remoteId: rid, title: ev.title });
      }
      return out;
    },
    enabled: linkedEventIds.length > 0,
    staleTime: 10_000,
  });

  if (detail.isLoading || !detail.data) {
    return (
      <Screen>
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </Screen>
    );
  }

  const { habit, logs, stats } = detail.data;
  const tint = resolveHabitColor(habit.color);
  const recentLogs = [...logs].reverse().slice(0, 30);

  return (
    <Screen edges={['top', 'left', 'right', 'bottom']}>
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
          <Feather name="chevron-left" size={24} color={colors.text} />
        </Pressable>
        <Text variant="bodyMedium" numberOfLines={1} style={{ flex: 1 }}>
          {habit.title}
        </Text>
        <Pressable
          onPress={() => formRef.current?.open(habit)}
          style={styles.backBtn}
          hitSlop={10}
          accessibilityLabel="Editar hábito"
        >
          <Feather name="edit-2" size={20} color={colors.text} />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        <HabitDetailHeader habit={habit} stats={stats} />

        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text variant="smallMedium" color={colors.textMuted} style={styles.sectionTitle}>
            ATIVIDADE
          </Text>
          <SegmentedControl
            value={heatmapRange}
            onChange={(v) => setHeatmapRange(v as HeatmapRange)}
            options={[
              { value: 'month', label: '1m' },
              { value: '6months', label: '6m' },
              { value: 'year', label: '1a' },
            ]}
          />
          <View style={{ height: spacing.xs }} />
          <HabitsHeatmap cells={cells} color={tint} onCellPress={onCellPress} />
          <Text variant="caption" color={colors.textMuted} style={{ marginTop: spacing.xs }}>
            Toque em um dia para registrar.
          </Text>
        </View>

        {(linkedEventsQuery.data?.length ?? 0) > 0 && (
          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text variant="smallMedium" color={colors.textMuted} style={styles.sectionTitle}>
              EVENTOS VINCULADOS
            </Text>
            <View style={styles.chipsRow}>
              {(linkedEventsQuery.data ?? []).map((ev) => (
                <Chip key={ev.remoteId} label={ev.title} selected />
              ))}
            </View>
            <Text variant="caption" color={colors.textMuted}>
              Marque o hábito direto na tela de eventos quando o evento ocorrer.
            </Text>
          </View>
        )}

        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text variant="smallMedium" color={colors.textMuted} style={styles.sectionTitle}>
            HISTÓRICO RECENTE
          </Text>
          {recentLogs.length === 0 ? (
            <Text variant="small" color={colors.textMuted}>
              Nenhum registro ainda.
            </Text>
          ) : (
            <View style={styles.logList}>
              {recentLogs.map((log) => (
                <Pressable
                  key={log.localId}
                  onPress={() => openLogEdit(log.targetDate)}
                  style={({ pressed }) => [
                    styles.logRow,
                    { borderBottomColor: colors.border },
                    pressed && { opacity: 0.6 },
                  ]}
                >
                  <Text variant="small">{formatDayHeader(log.targetDate)}</Text>
                  <Text variant="smallMedium" color={tint}>
                    {STATUS_LABEL[log.status] ?? log.status}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <LogEditSheet ref={sheetRef} />
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  backBtn: { padding: spacing.xs },
  body: {
    padding: spacing.base,
    gap: spacing.base,
    paddingBottom: spacing.xl,
  },
  section: {
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    gap: spacing.xs,
  },
  sectionTitle: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logList: { gap: 0 },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  logRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
});
