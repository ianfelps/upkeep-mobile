import React, { forwardRef, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
  type BottomSheetBackdropProps,
  type BottomSheetModalProps,
} from '@gorhom/bottom-sheet';
import { colors, radii, spacing } from '@/theme';
import { Text } from './Text';

type Props = Omit<BottomSheetModalProps, 'children' | 'backdropComponent'> & {
  title?: string;
  children: React.ReactNode;
  snapPoints?: Array<string | number>;
};

export const Sheet = forwardRef<BottomSheetModal, Props>(
  ({ title, children, snapPoints, ...rest }, ref) => {
    const defaultSnaps = useMemo(() => snapPoints ?? ['90%'], [snapPoints]);

    const renderBackdrop = (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
        opacity={0.45}
      />
    );

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={defaultSnaps}
        enablePanDownToClose
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
        backgroundStyle={styles.background}
        handleIndicatorStyle={styles.handle}
        backdropComponent={renderBackdrop}
        {...rest}
      >
        <BottomSheetView style={styles.content}>
          {title && (
            <View style={styles.header}>
              <Text variant="h2">{title}</Text>
            </View>
          )}
          {children}
        </BottomSheetView>
      </BottomSheetModal>
    );
  }
);

Sheet.displayName = 'Sheet';

const styles = StyleSheet.create({
  background: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
  },
  handle: {
    backgroundColor: colors.border,
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.lg,
    gap: spacing.base,
  },
  header: {
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
  },
});
