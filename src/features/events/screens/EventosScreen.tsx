import React, { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, RefreshControl, SectionList, StyleSheet, View } from 'react-native';
import { FAB, Screen, Text } from '@/components';
import { colors, spacing } from '@/theme';
import { syncEngine } from '@/sync/syncEngine';
import { FilterBar } from '../components/FilterBar';
import { EventRow } from '../components/EventRow';
import { EmptyEvents } from '../components/EmptyEvents';
import { EventFormModal, type EventFormModalHandle } from '../components/EventFormModal';
import { OfflineBanner } from '../components/OfflineBanner';
import { SyncErrorBanner } from '../components/SyncErrorBanner';
import { useEventsInRange } from '../queries';
import { resolveRange, todayKey } from '../selectors';
import type { EventFilter, EventOccurrence } from '../types';

export default function EventosScreen() {
  const [filter, setFilter] = useState<EventFilter>('day');
  const [anchorKey, setAnchorKey] = useState<string>(todayKey());
  const [refreshing, setRefreshing] = useState(false);
  const formRef = useRef<EventFormModalHandle>(null);

  const range = useMemo(() => resolveRange(filter, anchorKey), [filter, anchorKey]);
  const query = useEventsInRange(range.fromKey, range.toKey);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await syncEngine.tick('pullToRefresh');
      await query.refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const sections = query.data ?? [];
  const hasData = sections.length > 0;

  const openCreate = () => formRef.current?.open();
  const openEdit = (occ: EventOccurrence) => formRef.current?.open(occ.source);

  return (
    <Screen>
      <View style={styles.header}>
        <Text variant="display">Eventos</Text>
        <FilterBar
          filter={filter}
          onFilterChange={setFilter}
          anchorKey={anchorKey}
          onAnchorChange={setAnchorKey}
        />
      </View>

      <View style={styles.banners}>
        <OfflineBanner />
        <SyncErrorBanner />
      </View>

      {query.isLoading && !hasData ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
        </View>
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
          ListEmptyComponent={!query.isLoading ? <EmptyEvents /> : null}
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

      <EventFormModal ref={formRef} />
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
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  banners: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
    gap: spacing.sm,
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
