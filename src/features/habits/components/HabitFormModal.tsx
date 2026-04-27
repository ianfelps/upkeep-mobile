import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Feather } from '@expo/vector-icons';
import { BottomSheetScrollView, type BottomSheetModal } from '@gorhom/bottom-sheet';
import {
  Banner,
  Button,
  SegmentedControl,
  Sheet,
  Text,
  TextField,
} from '@/components';
import { radii, spacing } from '@/theme';
import { useColors } from '@/theme/useColors';
import type { LocalHabit } from '@/db/repositories/habits';
import { getErrorMessage } from '@/api/errors';
import { habitFormSchema, type HabitFormValues } from '../schemas';
import { DEFAULT_HABIT_COLOR, DEFAULT_HABIT_ICON } from '../constants';
import { ColorSwatchPicker } from './ColorSwatchPicker';
import { IconPickerGrid } from './IconPickerGrid';
import { LinkedEventsPicker } from './LinkedEventsPicker';
import { useCreateHabit, useUpdateHabit } from '../mutations';

export type HabitFormModalHandle = {
  open: (habit?: LocalHabit) => void;
  close: () => void;
};

type Props = {
  onDeleteRequest?: (habit: LocalHabit) => void;
};

function toDefaults(habit: LocalHabit | null): HabitFormValues {
  if (!habit) {
    return {
      title: '',
      description: '',
      icon: DEFAULT_HABIT_ICON,
      color: DEFAULT_HABIT_COLOR,
      frequencyType: 'Daily',
      targetValue: 1,
      linkedRoutineEventIds: [],
    };
  }
  return {
    title: habit.title,
    description: habit.description ?? '',
    icon: habit.icon || DEFAULT_HABIT_ICON,
    color: (habit.color as HabitFormValues['color']) ?? DEFAULT_HABIT_COLOR,
    frequencyType:
      habit.frequencyType === 'daily'
        ? 'Daily'
        : habit.frequencyType === 'weekly'
          ? 'Weekly'
          : 'Monthly',
    targetValue: habit.targetValue,
    linkedRoutineEventIds: habit.linkedRoutineEventIdsParsed,
  };
}

export const HabitFormModal = forwardRef<HabitFormModalHandle, Props>(
  ({ onDeleteRequest }, ref) => {
    const colors = useColors();
    const sheetRef = useRef<BottomSheetModal>(null);
    const [editing, setEditing] = useState<LocalHabit | null>(null);

    const create = useCreateHabit();
    const update = useUpdateHabit();

    const {
      control,
      handleSubmit,
      reset,
      watch,
      setValue,
      formState: { isSubmitting },
    } = useForm<HabitFormValues>({
      resolver: zodResolver(habitFormSchema),
      defaultValues: toDefaults(null),
    });

    const selectedIcon = watch('icon');
    const selectedColor = watch('color');
    const targetValue = watch('targetValue');

    useImperativeHandle(ref, () => ({
      open: (habit) => {
        setEditing(habit ?? null);
        reset(toDefaults(habit ?? null));
        create.reset();
        update.reset();
        sheetRef.current?.present();
      },
      close: () => sheetRef.current?.dismiss(),
    }));

    const close = useCallback(() => sheetRef.current?.dismiss(), []);

    const onSubmit = async (values: HabitFormValues) => {
      const payload = {
        title: values.title.trim(),
        description: values.description?.trim() ? values.description.trim() : null,
        icon: values.icon,
        color: values.color,
        frequencyType: values.frequencyType,
        targetValue: values.targetValue,
        linkedRoutineEventIds: values.linkedRoutineEventIds ?? [],
      };
      try {
        if (editing) {
          await update.mutateAsync({
            localId: editing.localId,
            patch: payload,
          });
        } else {
          await create.mutateAsync(payload);
        }
        close();
      } catch {
        // banner abaixo
      }
    };

    const submissionError =
      create.isError || update.isError
        ? getErrorMessage(create.error ?? update.error)
        : null;
    const busy = isSubmitting || create.isPending || update.isPending;

    const adjustTarget = (delta: number) => {
      const next = Math.max(1, Math.min(99, targetValue + delta));
      setValue('targetValue', next);
    };

    return (
      <Sheet
        ref={sheetRef}
        title={editing ? 'Editar hábito' : 'Novo hábito'}
        snapPoints={['90%']}
      >
        <BottomSheetScrollView
          style={styles.scroll}
          contentContainerStyle={styles.form}
          keyboardShouldPersistTaps="handled"
        >
          {submissionError && <Banner tone="error" message={submissionError} />}

          <Controller
            name="title"
            control={control}
            render={({ field: { value, onChange, onBlur }, fieldState }) => (
              <TextField
                label="Título"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Ex: Beber água"
                error={fieldState.error?.message}
                maxLength={100}
              />
            )}
          />

          <Controller
            name="description"
            control={control}
            render={({ field: { value, onChange, onBlur }, fieldState }) => (
              <TextField
                label="Descrição (opcional)"
                value={value ?? ''}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Detalhes ou motivação"
                error={fieldState.error?.message}
                multiline
                numberOfLines={3}
                maxLength={500}
                style={{ minHeight: 72, textAlignVertical: 'top' }}
              />
            )}
          />

          <View style={styles.block}>
            <Text variant="smallMedium">Ícone</Text>
            <IconPickerGrid
              value={selectedIcon}
              onChange={(icon) => setValue('icon', icon)}
              tint={selectedColor}
            />
          </View>

          <View style={styles.block}>
            <Text variant="smallMedium">Cor</Text>
            <ColorSwatchPicker
              value={selectedColor}
              onChange={(c) => setValue('color', c)}
            />
          </View>

          <View style={styles.block}>
            <Text variant="smallMedium">Frequência</Text>
            <Controller
              name="frequencyType"
              control={control}
              render={({ field: { value, onChange } }) => (
                <SegmentedControl
                  value={value}
                  onChange={onChange}
                  options={[
                    { value: 'Daily', label: 'Diário' },
                    { value: 'Weekly', label: 'Semanal' },
                    { value: 'Monthly', label: 'Mensal' },
                  ]}
                />
              )}
            />
          </View>

          <View style={styles.block}>
            <Text variant="smallMedium">Meta por período</Text>
            <View style={styles.stepperRow}>
              <Pressable
                onPress={() => adjustTarget(-1)}
                style={[
                  styles.stepperBtn,
                  { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Diminuir meta"
              >
                <Feather name="minus" size={18} color={colors.text} />
              </Pressable>
              <View style={[styles.stepperValue, { borderColor: colors.border }]}>
                <Text variant="h2">{targetValue}</Text>
              </View>
              <Pressable
                onPress={() => adjustTarget(1)}
                style={[
                  styles.stepperBtn,
                  { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Aumentar meta"
              >
                <Feather name="plus" size={18} color={colors.text} />
              </Pressable>
            </View>
          </View>

          <View style={styles.block}>
            <Text variant="smallMedium">Vincular a eventos recorrentes (opcional)</Text>
            <Controller
              name="linkedRoutineEventIds"
              control={control}
              render={({ field: { value, onChange } }) => (
                <LinkedEventsPicker value={value ?? []} onChange={onChange} />
              )}
            />
          </View>

          {editing && (
            <Button
              label="Excluir hábito"
              variant="destructive"
              onPress={() => onDeleteRequest?.(editing)}
              disabled={busy}
            />
          )}

          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <Button
              label="Cancelar"
              variant="ghost"
              onPress={close}
              disabled={busy}
              style={{ flex: 1 }}
            />
            <Button
              label="Salvar"
              onPress={handleSubmit(onSubmit)}
              loading={create.isPending || update.isPending}
              disabled={busy}
              style={{ flex: 1 }}
            />
          </View>
        </BottomSheetScrollView>
      </Sheet>
    );
  }
);

HabitFormModal.displayName = 'HabitFormModal';

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  form: { gap: spacing.base, paddingBottom: spacing.xxl },
  block: { gap: spacing.xs },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  stepperBtn: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    minWidth: 64,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
  },
});
