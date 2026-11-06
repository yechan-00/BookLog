/** Supabase/PostgREST errors are plain objects, so wrap them to keep the stack and message. */
export function toError(error: { message: string }): Error {
  return new Error(error.message);
}
