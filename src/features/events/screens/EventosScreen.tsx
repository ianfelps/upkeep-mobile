import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, RefreshControl, SectionList, StyleSheet, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { ConfirmSheet, FAB, Screen, Text, type ConfirmSheetHandle } from '@/components';
import { useColors } from '@/theme/useColors';
import { spacing } from '@/theme';
import { syncEngine } from '@/sync/syncEngine';
import { FilterBar } from '../components/FilterBar';
import { EventRow } from '../components/EventRow';
import { EmptyEvents } from '../components/EmptyEvents';
import { EventFormModal, type EventFormModalHandle } from '../components/EventFormModal';
import { ConnectionStatusIcon } from '../components/ConnectionStatusIcon';
import { MonthCalendarView } from '../components/MonthCalendarView';
import { TimelineView } from '../components/TimelineView';
import { useEventsForDay, useEventsInRange } from '../queries';
import { eventsQueryKeys } from '../queryKeys';
import { resolveRange, shiftAnchor, todayKey } from '../selectors';
import type { EventFilter, EventOccurrence } from '../types';
import type { LocalEvent } from '@/db/repositories/routineEvents';
import { useDeleteEvent } from '../mutations';

export default function EventosScreen() {
  const colors = useColors();
  const [filter, setFilter] = useState<EventFilter>('day');
  const [anchorKey, setAnchorKey] = useState<string>(todayKey());
  const [refreshing, setRefreshing] = useState(false);
  const [syncDone, setSyncDone] = useState(() => syncEngine.hasSynced());
  const formRef = useRef<EventFormModalHandle>(null);
  const deleteSheetRef = useRef<ConfirmSheetHandle>(null);
  const [pendingDelete, setPendingDelete] = useState<LocalEvent | null>(null);
  const remove = useDeleteEvent();

  const queryClient = useQueryClient();

  useEffect(() => {
    return syncEngine.onResult(() => {
      setSyncDone(true);
      queryClient.invalidateQueries({ queryKey: eventsQueryKeys.all });
    });
  }, [queryClient]);

  const isDay = filter === 'day';
  const range = useMemo(() => resolveRange(filter, anchorKey), [filter, anchorKey]);

  const dayQuery = useEventsForDay(anchorKey, { enabled: isDay });
  const rangeQuery = useEventsInRange(range.fromKey, range.toKey, { enabled: !isDay });

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await syncEngine.tick('pullToRefresh');
      if (isDay) await dayQuery.refetch();
      else await rangeQuery.refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const sections = rangeQuery.data ?? [];
  const hasData = isDay ? (dayQuery.data?.length ?? 0) > 0 : sections.length > 0;
  const isLoading = isDay ? dayQuery.isLoading : rangeQuery.isLoading;
  const isFetching = isDay ? dayQuery.isFetching : rangeQuery.isFetching;

  const openCreate = () => formRef.current?.open();
  const openEdit = (occ: EventOccurrence) => formRef.current?.open(occ.source);

  const handleDeleteRequest = (event: LocalEvent) => {
    setPendingDelete(event);
    formRef.current?.close();
    setTimeout(() => deleteSheetRef.current?.open(), 350);
  };

  const handleDeleteConfirm = async () => {
    if (!pendingDelete) return;
    const toDelete = pendingDelete;
    setPendingDelete(null);
    formRef.current?.close();
    try {
      await remove.mutateAsync(toDelete.localId);
    } catch {
      // erro tratado pela mutation via toast
    }
  };

  const goToDay = (dateKey: string) => {
    setAnchorKey(dateKey);
    setFilter('day');
  };

  return (
    <Screen>
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
        <View style={styles.titleRow}>
          <Text variant="display">Eventos</Text>
          <ConnectionStatusIcon />
        </View>
        <FilterBar
          filter={filter}
          onFilterChange={setFilter}
          anchorKey={anchorKey}
          onAnchorChange={setAnchorKey}
        />
      </View>

      {(!syncDone || isLoading || (!hasData && isFetching)) ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : isDay ? (
        <TimelineView
          occurrences={dayQuery.data ?? []}
          dateKey={anchorKey}
          onSwipeLeft={() => setAnchorKey(shiftAnchor('day', anchorKey, 1))}
          onSwipeRight={() => setAnchorKey(shiftAnchor('day', anchorKey, -1))}
          onEventPress={openEdit}
        />
      ) : filter === 'month' ? (
        <MonthCalendarView
          sections={sections}
          anchorKey={anchorKey}
          onDayPress={goToDay}
        />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item: EventOccurrence) => item.id}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <Text variant="smallMedium" color={colors.textMuted} style={styles.sectionHeader}>
              {section.title}
            </Text>
          )}
          renderItem={({ item }) => <EventRow occurrence={item} onPress={openEdit} />}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          SectionSeparatorComponent={() => <View style={{ height: spacing.base }} />}
          contentContainerStyle={[
            styles.listContent,
            !hasData && styles.listContentEmpty,
          ]}
          ListEmptyComponent={!isLoading ? <EmptyEvents /> : null}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        />
      )}

      <FAB onPress={openCreate} accessibilityLabel="Novo evento" />

      <EventFormModal ref={formRef} onDeleteRequest={handleDeleteRequest} />

      <ConfirmSheet
        ref={deleteSheetRef}
        title="Excluir evento"
        message={`Tem certeza que deseja excluir "${pendingDelete?.title ?? ''}"?`}
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
    gap: spacing.md,
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
  },
  listContentEmpty: { flexGrow: 1 },
  sectionHeader: {
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
