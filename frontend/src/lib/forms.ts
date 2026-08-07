import type { UseFormSetError, FieldValues, Path } from "react-hook-form";
import { ApiError } from "@/lib/api";

/**
 * Attach backend validation errors to their fields. Anything that does not
 * match a form field is returned so the caller can show it at form level —
 * never swallowed, or the user sees a form that refuses to submit and says
 * nothing about why.
 */
export function applyServerErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>
): string | null {
  if (!(error instanceof ApiError)) {
    return "Cannot reach the server. Check your connection.";
  }

  const fieldErrors = error.fieldErrors;
  if (fieldErrors && Object.keys(fieldErrors).length > 0) {
    for (const [field, message] of Object.entries(fieldErrors)) {
      setError(field as Path<T>, { type: "server", message });
    }
    return null;
  }

  return error.problem.detail ?? "Could not save your changes.";
}
