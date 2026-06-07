import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8).max(100),
});

export const roadmapSchema = z.object({
  skill: z.string().min(2).max(200),
});

export const communityPostSchema = z.object({
  title: z.string().min(5).max(300),
  content: z.string().min(10),
  skill_domain: z.string().optional(),
});

export const answerSchema = z.object({
  content: z.string().min(10),
});

export const bookSessionSchema = z.object({
  expert_id: z.string().uuid(),
  skill_domain: z.string().optional(),
  scheduled_date: z.string().datetime(),
  duration_minutes: z.number().int().min(30).max(120).default(30),
  notes: z.string().max(500).optional(),
});
