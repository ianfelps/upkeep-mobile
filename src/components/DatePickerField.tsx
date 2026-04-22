import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Feather } from '@expo/vector-icons';
import { Text } from './Text';
import { colors, radii, spacing, typography } from '@/theme';
import { dayjs, parseDateKey, toDateKey } from '@/utils/date';

type Props = {
  label?: string;
  value: string | null;
  onChange: (next: string) => void;
  error?: string | undefined;
  placeholder?: string;
  minimumDate?: Date;
};

export function DatePickerField({
  label,
  value,
  onChange,
  error,
  placeholder = 'Selecionar data',
  minimumDate,
}: Props) {
  const [open, setOpen] = useState(false);
  const current = value ? parseDateKey(value).toDate() : new Date();

  const handleChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setOpen(false);
    if (event.type === 'dismissed' || !selected) return;
    onChange(toDateKey(selected));
  };

  const formatted = value ? dayjs(value).format('dddd, DD [de] MMMM [de] YYYY') : placeholder;
  const hasError = !!error;

  return (
    <View style={styles.wrapper}>
      {label && (
        <Text variant="smallMedium" color={colors.text} style={styles.label}>
          {label}
        </Text>
      )}
      <Pressable
        onPress={() => setOpen(true)}
        style={[styles.field, hasError && styles.fieldError]}
        accessibilityRole="button"
        accessibilityLabel={label ?? 'Selecionar data'}
      >
        <Feather name="calendar" size={18} color={colors.textMuted} />
        <Text
          variant="body"
          color={value ? colors.text : colors.textMuted}
          style={styles.value}
        >
          {formatted}
        </Text>
      </Pressable>
      {hasError && (
        <Text variant="small" color={colors.error} style={styles.helper}>
          {error}
        </Text>
      )}
      {open && (
        <DateTimePicker
          value={current}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={handleChange}
          minimumDate={minimumDate}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.xs },
  label: { marginBottom: 2 },
  field: {
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
  helper: { marginTop: 2 },
});
