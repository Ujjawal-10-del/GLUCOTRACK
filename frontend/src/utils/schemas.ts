import { z } from 'zod';

// ── Login Schema ──
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// ── Register Schema ──
export const registerSchema = z
  .object({
    fullname: z
      .string()
      .min(1, 'Full name is required')
      .min(2, 'Name must be at least 2 characters'),
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Enter a valid email address'),
    password: z
      .string()
      .min(1, 'Password is required')
      .min(6, 'Password must be at least 6 characters')
      .regex(/[A-Z]/, 'Include at least one uppercase letter'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

// ── Predict Schema ──
export const predictSchema = z.object({
  pregnancies: z.preprocess(
    (v) => (v === '' ? undefined : Number(v)),
    z
      .number({ invalid_type_error: 'Enter a valid number', required_error: 'Pregnancies is required' })
      .min(0, 'Minimum value is 0')
      .max(17, 'Maximum value is 17')
  ),
  glucose: z.preprocess(
    (v) => (v === '' ? undefined : Number(v)),
    z
      .number({ invalid_type_error: 'Enter a valid number', required_error: 'Glucose Level is required' })
      .min(0, 'Minimum value is 0')
      .max(199, 'Maximum value is 199')
  ),
  blood_pressure: z.preprocess(
    (v) => (v === '' ? undefined : Number(v)),
    z
      .number({ invalid_type_error: 'Enter a valid number', required_error: 'Blood Pressure is required' })
      .min(0, 'Minimum value is 0')
      .max(122, 'Maximum value is 122')
  ),
  skin_thickness: z.preprocess(
    (v) => (v === '' ? undefined : Number(v)),
    z
      .number({ invalid_type_error: 'Enter a valid number', required_error: 'Skin Thickness is required' })
      .min(0, 'Minimum value is 0')
      .max(99, 'Maximum value is 99')
  ),
  insulin: z.preprocess(
    (v) => (v === '' ? undefined : Number(v)),
    z
      .number({ invalid_type_error: 'Enter a valid number', required_error: 'Insulin is required' })
      .min(0, 'Minimum value is 0')
      .max(846, 'Maximum value is 846')
  ),
  bmi: z.preprocess(
    (v) => (v === '' ? undefined : Number(v)),
    z
      .number({ invalid_type_error: 'Enter a valid number', required_error: 'BMI is required' })
      .min(0, 'Minimum value is 0')
      .max(67.1, 'Maximum value is 67.1')
  ),
  dpf: z.preprocess(
    (v) => (v === '' ? undefined : Number(v)),
    z
      .number({ invalid_type_error: 'Enter a valid number', required_error: 'Diabetes Pedigree is required' })
      .min(0.078, 'Minimum value is 0.078')
      .max(2.42, 'Maximum value is 2.42')
  ),
  age: z.preprocess(
    (v) => (v === '' ? undefined : Number(v)),
    z
      .number({ invalid_type_error: 'Enter a valid number', required_error: 'Age is required' })
      .min(21, 'Minimum value is 21')
      .max(81, 'Maximum value is 81')
  ),
});

export type PredictFormData = z.infer<typeof predictSchema>;

// ── Profile Schemas ──
export const profileSchema = z.object({
  fullname: z.string().min(1, 'Full name is required'),
  phone: z.string().optional(),
  gender: z.string().optional(),
  age: z.preprocess(
    (v) => (v === '' || v === undefined || v === null ? undefined : Number(v)),
    z.number().min(1, 'Age must be at least 1').max(120, 'Age must be 120 or under').optional()
  ),
  height: z.preprocess(
    (v) => (v === '' || v === undefined || v === null ? undefined : Number(v)),
    z.number().min(30, 'Height must be at least 30 cm').max(250, 'Height must be 250 cm or under').optional()
  ),
  weight: z.preprocess(
    (v) => (v === '' || v === undefined || v === null ? undefined : Number(v)),
    z.number().min(1, 'Weight must be at least 1 kg').max(300, 'Weight must be 300 kg or under').optional()
  ),
});

export type ProfileFormData = z.infer<typeof profileSchema>;

export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, 'Current password is required'),
    new_password: z
      .string()
      .min(1, 'New password is required')
      .min(6, 'New password must be at least 6 characters'),
    confirm_password: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: 'New passwords do not match',
    path: ['confirm_password'],
  });

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

// Helper function to extract field errors from ZodError
export const getZodFieldErrors = <T extends Record<string, any>>(error: z.ZodError<T>): Record<string, string> => {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const fieldName = issue.path[0] as string;
    if (fieldName && !errors[fieldName]) {
      errors[fieldName] = issue.message;
    }
  }
  return errors;
};
