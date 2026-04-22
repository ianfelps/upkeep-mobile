import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Banner, Button, Sheet, TextField } from '@/components';
import { spacing } from '@/theme';
import { changePasswordSchema, type ChangePasswordValues } from '../schemas';
import { useChangePassword } from '../mutations';
import { getErrorMessage, isApiError } from '@/api/errors';

export type ChangePasswordModalHandle = {
  open: () => void;
  close: () => void;
};

export const ChangePasswordModal = forwardRef<ChangePasswordModalHandle>((_props, ref) => {
  const sheetRef = useRef<BottomSheetModal>(null);
  const change = useChangePassword();

  const { control, handleSubmit, reset, formState, setError } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  useImperativeHandle(ref, () => ({
    open: () => {
      reset({ currentPassword: '', newPassword: '', confirmPassword: '' });
      change.reset();
      sheetRef.current?.present();
    },
    close: () => sheetRef.current?.dismiss(),
  }));

  const onSubmit = async (values: ChangePasswordValues) => {
    try {
      await change.mutateAsync({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      sheetRef.current?.dismiss();
    } catch (err) {
      if (isApiError(err) && err.status === 400) {
        setError('currentPassword', { message: err.message });
      }
    }
  };

  const generalError =
    change.isError && !(isApiError(change.error) && change.error.status === 400)
      ? getErrorMessage(change.error)
      : null;

  return (
    <Sheet ref={sheetRef} title="Alterar senha" snapPoints={['75%']}>
      <View style={styles.form}>
        {generalError && <Banner tone="error" message={generalError} />}

        <Controller
          name="currentPassword"
          control={control}
          render={({ field: { value, onChange, onBlur }, fieldState }) => (
            <TextField
              label="Senha atual"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              secureTextEntry
              autoCapitalize="none"
              error={fieldState.error?.message}
            />
          )}
        />

        <Controller
          name="newPassword"
          control={control}
          render={({ field: { value, onChange, onBlur }, fieldState }) => (
            <TextField
              label="Nova senha"
              helper="Mínimo de 6 caracteres"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              secureTextEntry
              autoCapitalize="none"
              error={fieldState.error?.message}
            />
          )}
        />

        <Controller
          name="confirmPassword"
          control={control}
          render={({ field: { value, onChange, onBlur }, fieldState }) => (
            <TextField
              label="Confirmar nova senha"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              secureTextEntry
              autoCapitalize="none"
              error={fieldState.error?.message}
            />
          )}
        />

        <View style={styles.actions}>
          <Button
            label="Cancelar"
            variant="ghost"
            onPress={() => sheetRef.current?.dismiss()}
            fullWidth
            style={{ flex: 1 }}
          />
          <Button
            label="Alterar"
            onPress={handleSubmit(onSubmit)}
            loading={formState.isSubmitting || change.isPending}
            fullWidth
            style={{ flex: 1 }}
          />
        </View>
      </View>
    </Sheet>
  );
});

ChangePasswordModal.displayName = 'ChangePasswordModal';

const styles = StyleSheet.create({
  form: { gap: spacing.base },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});
