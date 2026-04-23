import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { colors, spacing } from '@/theme';
import { Button } from './Button';
import { Sheet } from './Sheet';
import { Text } from './Text';

export type ConfirmSheetHandle = { open: () => void; close: () => void };

type Props = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'default' | 'destructive';
  loading?: boolean;
  onConfirm: () => void;
};

export const ConfirmSheet = forwardRef<ConfirmSheetHandle, Props>(
  ({ title, message, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', tone = 'default', loading, onConfirm }, ref) => {
    const sheetRef = useRef<BottomSheetModal>(null);

    useImperativeHandle(ref, () => ({
      open: () => sheetRef.current?.present(),
      close: () => sheetRef.current?.dismiss(),
    }));

    const isDestructive = tone === 'destructive';
    const iconName = isDestructive ? 'alert-triangle' : 'help-circle';
    const iconColor = isDestructive ? colors.error : colors.primary;

    return (
      <Sheet ref={sheetRef} snapPoints={['35%']}>
        <View style={styles.body}>
          <View style={[styles.iconWrap, isDestructive ? styles.iconWrapError : styles.iconWrapDefault]}>
            <Feather name={iconName} size={28} color={iconColor} />
          </View>
          <Text variant="h2" align="center">{title}</Text>
          <Text variant="body" color={colors.textMuted} align="center">{message}</Text>
        </View>
        <View style={styles.actions}>
          <Button
            label={cancelLabel}
            variant="ghost"
            onPress={() => sheetRef.current?.dismiss()}
            fullWidth
            style={{ flex: 1 }}
          />
          <Button
            label={confirmLabel}
            variant={isDestructive ? 'destructive' : 'primary'}
            onPress={() => {
              sheetRef.current?.dismiss();
              onConfirm();
            }}
            loading={loading}
            fullWidth
            style={{ flex: 1 }}
          />
        </View>
      </Sheet>
    );
  }
);

ConfirmSheet.displayName = 'ConfirmSheet';

const styles = StyleSheet.create({
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  iconWrapDefault: { backgroundColor: colors.primaryMuted },
  iconWrapError: { backgroundColor: colors.errorMuted },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
