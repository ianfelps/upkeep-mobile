import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Feather } from '@expo/vector-icons';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import {
  Banner,
  Button,
  DatePickerField,
  SegmentedControl,
  Sheet,
  Text,
  TextField,
  TimePickerField,
} from '@/components';
import { radii, spacing } from '@/theme';
import { useColors } from '@/theme/useColors';
import type { LocalEvent } from '@/db/repositories/routineEvents';
import { getErrorMessage } from '@/api/errors';
import { todayKey } from '../selectors';
import { eventFormSchema, type EventFormValues } from '../schemas';
import { EVENT_COLORS, DEFAULT_EVENT_COLOR } from '../constants';
import { DayOfWeekChips } from './DayOfWeekChips';
import { useCreateEvent, useUpdateEvent } from '../mutations';

export type EventFormModalHandle = {
  open: (event?: LocalEvent) => void;
  close: () => void;
};

type Props = {
  onDeleteRequest?: (event: LocalEvent) => void;
};

function toDefaults(event: LocalEvent | null): EventFormValues {
  if (!event) {
    return {
      title: '',
      description: '',
      startTime: '08:00:00',
      endTime: '',
      mode: 'once',
      eventDate: todayKey(),
      daysOfWeek: [],
      color: DEFAULT_EVENT_COLOR,
    };
  }
  return {
    title: event.title,
    description: event.description ?? '',
    startTime: event.startTime,
    endTime: event.endTime ?? '',
    mode: event.eventType,
    eventDate: event.eventDate ?? '',
    daysOfWeek: event.daysOfWeekParsed ?? [],
    color: event.color ?? DEFAULT_EVENT_COLOR,
  };
}

export const EventFormModal = forwardRef<EventFormModalHandle, Props>(({ onDeleteRequest }, ref) => {
  const colors = useColors();
  const sheetRef = useRef<BottomSheetModal>(null);
  const [editing, setEditing] = useState<LocalEvent | null>(null);

  const create = useCreateEvent();
  const update = useUpdateEvent();

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: toDefaults(null),
  });

  const mode = watch('mode');
  const selectedColor = watch('color');

  useImperativeHandle(ref, () => ({
    open: (event) => {
      setEditing(event ?? null);
      reset(toDefaults(event ?? null));
      create.reset();
      update.reset();
      sheetRef.current?.present();
    },
    close: () => sheetRef.current?.dismiss(),
  }));

  const close = useCallback(() => sheetRef.current?.dismiss(), []);

  const onSubmit = async (values: EventFormValues) => {
    const title = values.title.trim();
    const description = values.description?.trim() ? values.description.trim() : null;
    const endTime = values.endTime && values.endTime.length > 0 ? values.endTime : null;
    const daysOfWeek =
      values.mode === 'recurring' ? values.daysOfWeek ?? [] : null;
    const eventDate = values.mode === 'once' ? values.eventDate ?? null : null;
    const color = values.color ?? null;

    try {
      if (editing) {
        await update.mutateAsync({
          localId: editing.localId,
          patch: {
            title,
            description,
            startTime: values.startTime,
            endTime,
            daysOfWeek,
            eventDate,
            color,
          },
        });
      } else {
        await create.mutateAsync({
          title,
          description,
          startTime: values.startTime,
          endTime,
          daysOfWeek,
          eventDate,
          color,
        });
      }
      close();
    } catch {
      // erro exibido via Banner abaixo
    }
  };

  const confirmDelete = () => {
    if (!editing) return;
    onDeleteRequest?.(editing);
  };

  const submissionError =
    create.isError || update.isError
      ? getErrorMessage(create.error ?? update.error)
      : null;

  const busy = isSubmitting || create.isPending || update.isPending;

  return (
    <Sheet
      ref={sheetRef}
      title={editing ? 'Editar evento' : 'Novo evento'}
      snapPoints={['90%']}
    >
      <ScrollView
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
              placeholder="Ex: Consulta médica"
              error={fieldState.error?.message}
              maxLength={120}
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
              placeholder="Detalhes ou observações"
              error={fieldState.error?.message}
              multiline
              numberOfLines={3}
              maxLength={500}
              style={{ minHeight: 72, textAlignVertical: 'top' }}
            />
          )}
        />

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Controller
              name="startTime"
              control={control}
              render={({ field: { value, onChange }, fieldState }) => (
                <TimePickerField
                  label="Início"
                  value={value}
                  onChange={onChange}
                  error={fieldState.error?.message}
                />
              )}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Controller
              name="endTime"
              control={control}
              render={({ field: { value, onChange }, fieldState }) => (
                <TimePickerField
                  label="Término"
                  optional
                  value={value && value.length > 0 ? value : null}
                  onChange={onChange}
                  onClear={() => onChange('')}
                  error={fieldState.error?.message}
                />
              )}
            />
          </View>
        </View>

        <View style={styles.block}>
          <Text variant="smallMedium">Tipo</Text>
          <Controller
            name="mode"
            control={control}
            render={({ field: { value, onChange } }) => (
              <SegmentedControl
                value={value}
                onChange={(next) => {
                  onChange(next);
                  if (next === 'once') {
                    setValue('daysOfWeek', []);
                    if (!watch('eventDate')) setValue('eventDate', todayKey());
                  } else {
                    setValue('eventDate', '');
                  }
                }}
                options={[
                  { value: 'once', label: 'Único' },
                  { value: 'recurring', label: 'Recorrente' },
                ]}
              />
            )}
          />
        </View>

        {mode === 'once' ? (
          <Controller
            name="eventDate"
            control={control}
            render={({ field: { value, onChange }, fieldState }) => (
              <DatePickerField
                label="Data"
                value={value && value.length > 0 ? value : null}
                onChange={onChange}
                error={fieldState.error?.message}
              />
            )}
          />
        ) : (
          <View style={styles.block}>
            <Text variant="smallMedium">Dias da semana</Text>
            <Controller
              name="daysOfWeek"
              control={control}
              render={({ field: { value, onChange } }) => (
                <DayOfWeekChips value={value ?? []} onChange={onChange} />
              )}
            />
            {errors.daysOfWeek?.message && (
              <Text variant="small" color={colors.error}>
                {errors.daysOfWeek.message}
              </Text>
            )}
          </View>
        )}

        <View style={styles.block}>
          <Text variant="smallMedium">Cor</Text>
          <View style={styles.colorRow}>
            {EVENT_COLORS.map((c) => {
              const active = selectedColor === c;
              return (
                <Pressable
                  key={c}
                  onPress={() => setValue('color', c)}
                  style={[
                    styles.colorSwatch,
                    { backgroundColor: c },
                    active && [styles.colorSwatchActive, { borderColor: colors.text }],
                  ]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                >
                  {active && (
                    <Feather name="check" size={14} color="#fff" />
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        {editing && (
          <Button
            label="Excluir evento"
            variant="destructive"
            onPress={confirmDelete}
            disabled={busy}
          />
        )}
      </ScrollView>

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
    </Sheet>
  );
});

EventFormModal.displayName = 'EventFormModal';

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  form: {
    gap: spacing.base,
    paddingBottom: spacing.base,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  block: { gap: spacing.xs },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  colorSwatch: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorSwatchActive: {
    borderWidth: 3,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
  },
});
