import type { AttachmentDraft } from "@/components/RichTextDemo";

const decodeBase64 = (value: string): string => {
  if (typeof globalThis.atob === "function") {
    return globalThis.atob(value);
  }
  if (typeof Buffer !== "undefined") {
    return Buffer.from(value, "base64").toString("binary");
  }
  throw new Error("Base64 decoding을 지원하지 않는 환경입니다.");
};

const dataUrlToFile = (attachment: AttachmentDraft): File | null => {
  const { dataUrl, name } = attachment;
  if (!dataUrl || !dataUrl.startsWith("data:")) {
    return null;
  }

  const [metadata, base64Value] = dataUrl.split(",");
  if (!metadata || !base64Value) {
    return null;
  }

  const mimeMatch = metadata.match(/data:(.*);base64/);
  const mimeType = mimeMatch?.[1] ?? "application/octet-stream";

  try {
    const binary = decodeBase64(base64Value);
    const length = binary.length;
    const bytes = new Uint8Array(length);
    for (let index = 0; index < length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    const filename = name?.trim() || `attachment-${Date.now()}`;
    return new File([bytes], filename, { type: mimeType });
  } catch (error) {
    console.error("첨부 파일 변환 실패", error);
    return null;
  }
};

export const attachmentDraftsToFiles = (attachments?: AttachmentDraft[]): File[] => {
  if (!attachments || attachments.length === 0) {
    return [];
  }

  return attachments
    .map(dataUrlToFile)
    .filter((file): file is File => file instanceof File);
};
