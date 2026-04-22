import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Banner, Button, Sheet, TextField } from '@/components';
import { spacing } from '@/theme';
import { useAuthStore } from '@/features/auth/store';
import { editProfileSchema, type EditProfileValues } from '../schemas';
import { useUpdateProfile } from '../mutations';
import { getErrorMessage, isApiError } from '@/api/errors';

export type EditProfileModalHandle = {
  open: () => void;
  close: () => void;
};

export const EditProfileModal = forwardRef<EditProfileModalHandle>((_props, ref) => {
  const sheetRef = useRef<BottomSheetModal>(null);
  const user = useAuthStore((s) => s.user);
  const update = useUpdateProfile();

  const { control, handleSubmit, reset, formState, setError } = useForm<EditProfileValues>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: { name: user?.name ?? '', email: user?.email ?? '' },
  });

  useImperativeHandle(ref, () => ({
    open: () => {
      reset({ name: user?.name ?? '', email: user?.email ?? '' });
      update.reset();
      sheetRef.current?.present();
    },
    close: () => sheetRef.current?.dismiss(),
  }));

  useEffect(() => {
    if (user) reset({ name: user.name, email: user.email });
  }, [user, reset]);

  const onSubmit = async (values: EditProfileValues) => {
    try {
      await update.mutateAsync(values);
      sheetRef.current?.dismiss();
    } catch (err) {
      if (isApiError(err) && err.status === 409) {
        setError('email', { message: 'E-mail já em uso' });
      }
    }
  };

  const generalError =
    update.isError && !(isApiError(update.error) && update.error.status === 409)
      ? getErrorMessage(update.error)
      : null;

  return (
    <Sheet ref={sheetRef} title="Editar perfil" snapPoints={['60%']}>
      <View style={styles.form}>
        {generalError && <Banner tone="error" message={generalError} />}

        <Controller
          name="name"
          control={control}
          render={({ field: { value, onChange, onBlur }, fieldState }) => (
            <TextField
              label="Nome"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              autoCapitalize="words"
              error={fieldState.error?.message}
            />
          )}
        />

        <Controller
          name="email"
          control={control}
          render={({ field: { value, onChange, onBlur }, fieldState }) => (
            <TextField
              label="E-mail"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
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
            label="Salvar"
            onPress={handleSubmit(onSubmit)}
            loading={formState.isSubmitting || update.isPending}
            fullWidth
            style={{ flex: 1 }}
          />
        </View>
      </View>
    </Sheet>
  );
});

EditProfileModal.displayName = 'EditProfileModal';

const styles = StyleSheet.create({
  form: { gap: spacing.base },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});
