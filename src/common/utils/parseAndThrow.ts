import { BadRequestException } from '@nestjs/common';
import { ZodTypeAny, infer as zInfer } from 'zod';

export function parseAndThrow<TSchema extends ZodTypeAny>(
  schema: TSchema,
  data: unknown,
): zInfer<TSchema> {
  const result = schema.safeParse(data);

  if (!result.success) {
    const zodErrors: Record<string, string> = {};

    for (const issue of result.error.issues) {
      const path = issue.path.join('.') || 'global';
      zodErrors[path] = issue.message;
    }

    throw new BadRequestException({
      success: false,
      message: zodErrors,
      data: null,
    });
  }

  return result.data;
}