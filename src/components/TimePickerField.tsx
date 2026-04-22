import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Feather } from '@expo/vector-icons';
import { Text } from './Text';
import { colors, radii, spacing, typography } from '@/theme';
import { formatTime } from '@/utils/date';

type Props = {
  label?: string;
  value: string | null;
  onChange: (next: string) => void;
  onClear?: () => void;
  error?: string | undefined;
  placeholder?: string;
  optional?: boolean;
};

function toTimeString(d: Date): string {
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}:00`;
}

function parseTimeToDate(value: string | null): Date {
  if (!value) {
    const d = new Date();
    d.setSeconds(0, 0);
    return d;
  }
  const [hh, mm] = value.split(':');
  const d = new Date();
  d.setHours(Number(hh ?? 0), Number(mm ?? 0), 0, 0);
  return d;
}

export function TimePickerField({
  label,
  value,
  onChange,
  onClear,
  error,
  placeholder = 'Selecionar horário',
  optional,
}: Props) {
  const [open, setOpen] = useState(false);

  const handleChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setOpen(false);
    if (event.type === 'dismissed' || !selected) return;
    onChange(toTimeString(selected));
  };

  const hasError = !!error;
  const formatted = value ? formatTime(value) : placeholder;

  return (
    <View style={styles.wrapper}>
      {label && (
        <Text variant="smallMedium" color={colors.text} style={styles.label}>
          {label}
          {optional && (
            <Text variant="small" color={colors.textMuted}>
              {' '}
              (opcional)
            </Text>
          )}
        </Text>
      )}
      <View style={styles.row}>
        <Pressable
          onPress={() => setOpen(true)}
          style={[styles.field, hasError && styles.fieldError]}
          accessibilityRole="button"
          accessibilityLabel={label ?? 'Selecionar horário'}
        >
          <Feather name="clock" size={18} color={colors.textMuted} />
          <Text
            variant="body"
            color={value ? colors.text : colors.textMuted}
            style={styles.value}
          >
            {formatted}
          </Text>
        </Pressable>
        {optional && value && onClear && (
          <Pressable
            onPress={onClear}
            hitSlop={12}
            style={styles.clearBtn}
            accessibilityRole="button"
            accessibilityLabel="Limpar horário"
          >
            <Feather name="x" size={18} color={colors.textMuted} />
          </Pressable>
        )}
      </View>
      {hasError && (
        <Text variant="small" color={colors.error} style={styles.helper}>
          {error}
        </Text>
      )}
      {open && (
        <DateTimePicker
          value={parseTimeToDate(value)}
          mode="time"
          is24Hour
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.xs },
  label: { marginBottom: 2 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  field: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    minHeight: 48,
  },
  fieldError: { borderColor: colors.error },
  value: {
    flex: 1,
    fontFamily: typography.body.fontFamily,
  },
  clearBtn: {
    padding: spacing.xs,
  },
  helper: { marginTop: 2 },
});
