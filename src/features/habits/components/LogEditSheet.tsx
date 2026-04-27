import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import {
  Button,
  SegmentedControl,
  Sheet,
  Text,
  TextField,
} from '@/components';
import { spacing } from '@/theme';
import { useColors } from '@/theme/useColors';
import { formatDayHeader } from '@/utils/date';
import { useDeleteHabitLog, useUpsertHabitLog } from '../mutations';
import type { LocalHabitLog } from '@/db/repositories/habitLogs';

export type LogEditSheetHandle = {
  open: (args: {
    habitLocalId: string;
    targetDate: string;
    existing: LocalHabitLog | null;
  }) => void;
  close: () => void;
};

type Status = 'Completed' | 'Skipped' | 'Missed';

const STATUS_FROM_DB: Record<string, Status> = {
  completed: 'Completed',
  skipped: 'Skipped',
  missed: 'Missed',
};

export const LogEditSheet = forwardRef<LogEditSheetHandle, object>((_props, ref) => {
  const colors = useColors();
  const sheetRef = useRef<BottomSheetModal>(null);
  const upsert = useUpsertHabitLog();
  const remove = useDeleteHabitLog();

  const [habitLocalId, setHabitLocalId] = useState<string>('');
  const [targetDate, setTargetDate] = useState<string>('');
  const [existing, setExisting] = useState<LocalHabitLog | null>(null);
  const [status, setStatus] = useState<Status>('Completed');
  const [notes, setNotes] = useState<string>('');

  useImperativeHandle(ref, () => ({
    open: ({ habitLocalId, targetDate, existing }) => {
      setHabitLocalId(habitLocalId);
      setTargetDate(targetDate);
      setExisting(existing);
      setStatus(existing ? STATUS_FROM_DB[existing.status] ?? 'Completed' : 'Completed');
      setNotes(existing?.notes ?? '');
      sheetRef.current?.present();
    },
    close: () => sheetRef.current?.dismiss(),
  }));

  const onSave = async () => {
    try {
      await upsert.mutateAsync({ habitLocalId, targetDate, status, notes });
      sheetRef.current?.dismiss();
    } catch {
      // toast feedback by mutation
    }
  };

  const onDelete = async () => {
    if (!existing) return;
    try {
      await remove.mutateAsync(existing.localId);
      sheetRef.current?.dismiss();
    } catch {
      // toast
    }
  };

  const busy = upsert.isPending || remove.isPending;

  return (
    <Sheet ref={sheetRef} title="Registrar dia" snapPoints={['65%']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
      >
        <Text variant="bodyMedium" color={colors.textMuted}>
          {targetDate ? formatDayHeader(targetDate) : ''}
        </Text>

        <View style={styles.block}>
          <Text variant="smallMedium">Status</Text>
          <SegmentedControl
            value={status}
            onChange={(s) => setStatus(s as Status)}
            options={[
              { value: 'Completed', label: 'Concluído' },
              { value: 'Skipped', label: 'Pulado' },
              { value: 'Missed', label: 'Perdido' },
            ]}
          />
        </View>

        <TextField
          label="Anotações (opcional)"
          value={notes}
          onChangeText={setNotes}
          placeholder="Como foi o dia?"
          multiline
          numberOfLines={3}
          maxLength={500}
          style={{ minHeight: 72, textAlignVertical: 'top' }}
        />

        {existing && (
          <Button
            label="Remover registro"
            variant="destructive"
            onPress={onDelete}
            disabled={busy}
          />
        )}
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <Button
          label="Cancelar"
          variant="ghost"
          onPress={() => sheetRef.current?.dismiss()}
          disabled={busy}
          style={{ flex: 1 }}
        />
        <Button
          label="Salvar"
          onPress={onSave}
          loading={upsert.isPending}
          disabled={busy}
          style={{ flex: 1 }}
        />
      </View>
    </Sheet>
  );
});

LogEditSheet.displayName = 'LogEditSheet';

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  body: { gap: spacing.base, paddingBottom: spacing.base },
  block: { gap: spacing.xs },
  footer: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
  },
});
