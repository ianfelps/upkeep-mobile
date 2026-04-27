import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Chip, Text } from '@/components';
import { useColors } from '@/theme/useColors';
import { spacing } from '@/theme';
import * as eventsRepo from '@/db/repositories/routineEvents';

type Props = {
  // List of remoteIds of linked routine events
  value: string[];
  onChange: (next: string[]) => void;
};

export function LinkedEventsPicker({ value, onChange }: Props) {
  const colors = useColors();
  const [options, setOptions] = useState<{ remoteId: string; title: string }[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const all = await eventsRepo.findInRange('1970-01-01', '2999-12-31');
      const recurring = all.filter(
        (e) => e.eventType === 'recurring' && e.remoteId !== null && e.remoteId !== undefined
      );
      if (cancelled) return;
      setOptions(
        recurring.map((e) => ({ remoteId: e.remoteId as string, title: e.title }))
      );
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = (remoteId: string) => {
    if (value.includes(remoteId)) {
      onChange(value.filter((id) => id !== remoteId));
    } else {
      onChange([...value, remoteId]);
    }
  };

  if (options.length === 0) {
    return (
      <Text variant="small" color={colors.textMuted}>
        Nenhum evento recorrente sincronizado disponível.
      </Text>
    );
  }

  return (
    <View style={styles.list}>
      {options.map((opt) => (
        <Chip
          key={opt.remoteId}
          label={opt.title}
          selected={value.includes(opt.remoteId)}
          onPress={() => toggle(opt.remoteId)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
});
