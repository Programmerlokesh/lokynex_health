import axios from "axios";

type ApiErrorBody = {
  title?: string;
  // Our ExceptionHandlingMiddleware: string[]
  // ASP.NET automatic model validation: { Field: string[] }
  errors?: string[] | Record<string, string[]>;
};

export function getApiErrorMessage(
  error: unknown,
  fallback = "Something went wrong.",
): string {
  if (!axios.isAxiosError(error)) return fallback;

  if (!error.response) {
    return "Cannot reach the API. Check that it is running, NEXT_PUBLIC_API_BASE_URL is correct, and CORS allows this origin.";
  }

  const data = error.response.data as ApiErrorBody | undefined;

  if (Array.isArray(data?.errors)) return data.errors.join(" ");

  if (data?.errors && typeof data.errors === "object") {
    return Object.values(data.errors).flat().join(" ");
  }

  if (data?.title) return `${data.title} (HTTP ${error.response.status})`;
  return `${fallback} (HTTP ${error.response.status})`;
}