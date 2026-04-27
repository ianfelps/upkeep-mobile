import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { BottomSheetScrollView, type BottomSheetModal } from '@gorhom/bottom-sheet';
import { Button, Sheet, Text } from '@/components';
import { useColors, useIsDark } from '@/theme/useColors';
import { radii, spacing } from '@/theme';
import { dayjs, formatDayHeader, formatTime } from '@/utils/date';
import { resolveEventBg, resolveEventColor } from '../constants';
import type { EventOccurrence } from '../types';
import { EventLinkedHabits } from '@/features/habits/components/EventLinkedHabits';

export type EventActionsSheetHandle = {
  open: (occurrence: EventOccurrence) => void;
  close: () => void;
};

type Props = {
  onEdit?: (occurrence: EventOccurrence) => void;
};

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function durationLabel(start: string, end: string | null): string | null {
  if (!end) return null;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  if (sh === undefined || sm === undefined || eh === undefined || em === undefined) return null;
  const mins = eh * 60 + em - (sh * 60 + sm);
  if (mins <= 0) return null;
  if (mins < 60) return `${mins}min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h${m}min`;
}

export const EventActionsSheet = forwardRef<EventActionsSheetHandle, Props>(({ onEdit }, ref) => {
  const colors = useColors();
  const isDark = useIsDark();
  const sheetRef = useRef<BottomSheetModal>(null);
  const [occ, setOcc] = useState<EventOccurrence | null>(null);

  useImperativeHandle(ref, () => ({
    open: (o) => {
      setOcc(o);
      sheetRef.current?.present();
    },
    close: () => sheetRef.current?.dismiss(),
  }));

  const tint = occ ? resolveEventColor(occ.source.color) : colors.primary;
  const tintBg = occ ? resolveEventBg(occ.source.color, isDark) : colors.primaryMuted;

  const recurringDays = occ?.source.daysOfWeekParsed ?? [];
  const isRecurring = occ?.eventType === 'recurring';
  const dur = occ ? durationLabel(occ.startTime, occ.endTime) : null;

  return (
    <Sheet ref={sheetRef} snapPoints={['65%']}>
      {occ && (
        <BottomSheetScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.hero, { backgroundColor: tintBg, borderColor: tintBg }]}>
            <View style={[styles.iconWrap, { backgroundColor: tint }]}>
              <Feather
                name={isRecurring ? 'repeat' : 'calendar'}
                size={22}
                color="#fff"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="h2" numberOfLines={2}>
                {occ.title}
              </Text>
              <Text variant="small" color={colors.textMuted}>
                {isRecurring ? 'Evento recorrente' : 'Evento único'}
              </Text>
            </View>
          </View>

          <View style={styles.metaGrid}>
            <View style={[styles.metaCard, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
              <Feather name="clock" size={14} color={colors.textMuted} />
              <Text variant="smallMedium">
                {formatTime(occ.startTime)}
                {occ.endTime ? ` – ${formatTime(occ.endTime)}` : ''}
              </Text>
              {dur && (
                <Text variant="caption" color={colors.textMuted}>
                  {dur}
                </Text>
              )}
            </View>
            <View style={[styles.metaCard, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
              <Feather name="calendar" size={14} color={colors.textMuted} />
              <Text variant="smallMedium" numberOfLines={1}>
                {formatDayHeader(occ.dateKey)}
              </Text>
              {occ.dateKey === dayjs().format('YYYY-MM-DD') && (
                <Text variant="caption" color={tint}>
                  Hoje
                </Text>
              )}
            </View>
          </View>

          {isRecurring && recurringDays.length > 0 && (
            <View>
              <Text variant="smallMedium" color={colors.textMuted} style={styles.sectionLabel}>
                DIAS DA SEMANA
              </Text>
              <View style={styles.weekRow}>
                {WEEKDAY_LABELS.map((label, idx) => {
                  const active = recurringDays.includes(idx);
                  return (
                    <View
                      key={idx}
                      style={[
                        styles.weekChip,
                        {
                          backgroundColor: active ? tint : colors.surfaceAlt,
                          borderColor: active ? tint : colors.border,
                        },
                      ]}
                    >
                      <Text variant="caption" color={active ? '#fff' : colors.textMuted}>
                        {label}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {occ.description ? (
            <View>
              <Text variant="smallMedium" color={colors.textMuted} style={styles.sectionLabel}>
                DESCRIÇÃO
              </Text>
              <Text variant="body" color={colors.text}>
                {occ.description}
              </Text>
            </View>
          ) : null}

          <View>
            <Text variant="smallMedium" color={colors.textMuted} style={styles.sectionLabel}>
              HÁBITOS VINCULADOS
            </Text>
            <EventLinkedHabits eventRemoteId={occ.remoteId} dateKey={occ.dateKey} />
          </View>

          <Button
            label="Editar evento"
            variant="ghost"
            leadingIcon={<Feather name="edit-2" size={16} color={colors.text} />}
            onPress={() => {
              sheetRef.current?.dismiss();
              setTimeout(() => onEdit?.(occ), 200);
            }}
          />
        </BottomSheetScrollView>
      )}
    </Sheet>
  );
});

EventActionsSheet.displayName = 'EventActionsSheet';

const styles = StyleSheet.create({
  scroll: { gap: spacing.base, paddingBottom: spacing.xl },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderLeftWidth: 4,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  metaCard: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: 2,
  },
  sectionLabel: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  weekRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  weekChip: {
    flex: 1,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
    borderWidth: 1,
    alignItems: 'center',
  },
});
