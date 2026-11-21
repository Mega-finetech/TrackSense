import axios from 'axios';
export function errorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) return 'We could not connect. Check your connection and try again.';
    return error.response.data?.error || 'Something went wrong. Please try again.';
  }
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}
