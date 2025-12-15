const httpErrorTranslations: { pattern: RegExp; message: string }[] = [
  {
    pattern: /Request failed with status code 403/i,
    message: "요청이 거부되었습니다. 접근 권한을 확인해주세요. (403)",
  },
];

export function localizeErrorMessage(message?: string | null) {
  if (!message) return null;
  for (const { pattern, message: translated } of httpErrorTranslations) {
    if (pattern.test(message)) {
      return translated;
    }
  }
  return null;
}

export function getErrorMessage(error: unknown, fallbackMessage: string) {
  if (typeof error === "string") {
    return localizeErrorMessage(error) ?? error;
  }
  if (error instanceof Error) {
    return localizeErrorMessage(error.message) ?? error.message;
  }
  if (error && typeof error === "object" && "message" in error && typeof (error as any).message === "string") {
    return localizeErrorMessage((error as any).message) ?? (error as any).message;
  }
  return fallbackMessage;
}
