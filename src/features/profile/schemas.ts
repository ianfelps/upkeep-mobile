import { z } from 'zod';

export const editProfileSchema = z.object({
  name: z.string().trim().min(2, 'Nome muito curto').max(100, 'Nome muito longo'),
  email: z.string().trim().email('E-mail inválido').max(200),
});
export type EditProfileValues = z.infer<typeof editProfileSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Obrigatório'),
    newPassword: z.string().min(6, 'Mínimo de 6 caracteres').max(100),
    confirmPassword: z.string().min(1, 'Obrigatório'),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas não coincidem',
  })
  .refine((v) => v.newPassword !== v.currentPassword, {
    path: ['newPassword'],
    message: 'A nova senha precisa ser diferente da atual',
  });
export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;
