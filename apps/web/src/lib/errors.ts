import i18n from '@/i18n';
import { ApiError } from './api';

/** Maps an API error code to a translated, user-facing message. */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const key = `errors.${error.code}`;
    return i18n.exists(key) ? i18n.t(key) : error.message;
  }
  return i18n.t('errors.UNKNOWN');
}
