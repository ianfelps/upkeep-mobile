import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Text } from '@/components';
import { useColors } from '@/theme/useColors';
import { radii, spacing } from '@/theme';
import * as habitsRepo from '@/db/repositories/habits';
import * as habitLogsRepo from '@/db/repositories/habitLogs';
import { resolveHabitColor } from '../constants';
import { useUpsertHabitLog, useDeleteHabitLog } from '../mutations';
import { habitsQueryKeys } from '../queryKeys';

type Props = {
  eventRemoteId: string | null | undefined;
  dateKey: string;
};

export function EventLinkedHabits({ eventRemoteId, dateKey }: Props) {
  const colors = useColors();
  const upsert = useUpsertHabitLog();
  const remove = useDeleteHabitLog();

  const query = useQuery({
    queryKey: ['habits', 'forEvent', eventRemoteId ?? '', dateKey],
    queryFn: async () => {
      if (!eventRemoteId) return [];
      const habits = await habitsRepo.findByLinkedEventRemoteId(eventRemoteId);
      const logs = await Promise.all(
        habits.map((h) => habitLogsRepo.findForHabitOnDate(h.localId, dateKey))
      );
      return habits.map((habit, idx) => ({ habit, log: logs[idx] ?? null }));
    },
    enabled: !!eventRemoteId,
    staleTime: 5_000,
  });

  if (!eventRemoteId || !query.data || query.data.length === 0) return null;

  const onToggle = async (item: { habit: habitsRepo.LocalHabit; log: habitLogsRepo.LocalHabitLog | null }) => {
    if (item.log?.status === 'completed') {
      await remove.mutateAsync(item.log.localId);
    } else {
      await upsert.mutateAsync({
        habitLocalId: item.habit.localId,
        targetDate: dateKey,
        status: 'Completed',
      });
    }
  };

  return (
    <View style={styles.row}>
      {query.data.map((item) => {
        const tint = resolveHabitColor(item.habit.color);
        const done = item.log?.status === 'completed';
        return (
          <Pressable
            key={item.habit.localId}
            onPress={() => onToggle(item)}
            disabled={upsert.isPending || remove.isPending}
            style={[
              styles.chip,
              {
                backgroundColor: done ? tint : 'transparent',
                borderColor: tint,
              },
            ]}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={`${item.habit.title}${done ? ' concluído' : ''}`}
            accessibilityState={{ checked: done }}
          >
            <Feather
              name={done ? 'check-circle' : 'circle'}
              size={12}
              color={done ? '#fff' : tint}
            />
            <Text variant="caption" color={done ? '#fff' : colors.text}>
              {item.habit.title}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// Invalidação automática: ao toggle, useUpsertHabitLog/useDeleteHabitLog já invalidam habitsQueryKeys.all
// que cobre 'habits.forEvent' por prefix matching.
void habitsQueryKeys; // keep import alive for future use

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
});
