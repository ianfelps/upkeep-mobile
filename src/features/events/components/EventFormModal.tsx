import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { Alert, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { colors, spacing } from '@/theme';
import type { LocalEvent } from '@/db/repositories/routineEvents';
import { getErrorMessage } from '@/api/errors';
import { todayKey } from '../selectors';
import { eventFormSchema, type EventFormValues } from '../schemas';
import { DayOfWeekChips } from './DayOfWeekChips';
import {
  useCreateEvent,
  useDeleteEvent,
  useUpdateEvent,
} from '../mutations';

export type EventFormModalHandle = {
  open: (event?: LocalEvent) => void;
  close: () => void;
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
      isActive: true,
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
    isActive: event.isActive,
  };
}

export const EventFormModal = forwardRef<EventFormModalHandle>((_props, ref) => {
  const sheetRef = useRef<BottomSheetModal>(null);
  const [editing, setEditing] = useState<LocalEvent | null>(null);

  const create = useCreateEvent();
  const update = useUpdateEvent();
  const remove = useDeleteEvent();

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

  useImperativeHandle(ref, () => ({
    open: (event) => {
      setEditing(event ?? null);
      reset(toDefaults(event ?? null));
      create.reset();
      update.reset();
      remove.reset();
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
            isActive: values.isActive,
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
          isActive: values.isActive,
        });
      }
      close();
    } catch {
      // erro exibido via Banner abaixo
    }
  };

  const confirmDelete = () => {
    if (!editing) return;
    Alert.alert(
      'Excluir evento',
      `Tem certeza que deseja excluir "${editing.title}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await remove.mutateAsync(editing.localId);
              close();
            } catch {
              // erro via Banner
            }
          },
        },
      ]
    );
  };

  const submissionError =
    create.isError || update.isError || remove.isError
      ? getErrorMessage(create.error ?? update.error ?? remove.error)
      : null;

  const busy =
    isSubmitting || create.isPending || update.isPending || remove.isPending;

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

        <Controller
          name="isActive"
          control={control}
          render={({ field: { value, onChange } }) => (
            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text variant="bodyMedium">Ativo</Text>
                <Text variant="small" color={colors.textMuted}>
                  Eventos inativos não aparecem na lista.
                </Text>
              </View>
              <Switch
                value={value}
                onValueChange={onChange}
                trackColor={{ true: colors.primary, false: colors.border }}
                thumbColor={colors.surface}
              />
            </View>
          )}
        />

        {editing && (
          <Button
            label="Excluir evento"
            variant="destructive"
            onPress={confirmDelete}
            loading={remove.isPending}
            disabled={busy}
          />
        )}
      </ScrollView>

      <View style={styles.footer}>
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
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
    paddingVertical: spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
