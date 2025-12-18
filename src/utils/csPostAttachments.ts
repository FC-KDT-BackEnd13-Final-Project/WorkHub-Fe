import type { AttachmentDraft } from "@/components/RichTextDemo";
import type { CsPostFileResponse } from "@/types/csPost";

export const mapCsPostFilesToAttachments = (
  files?: CsPostFileResponse[],
  idPrefix = "cs-file",
): AttachmentDraft[] => {
  if (!files || files.length === 0) {
    return [];
  }

  return files.map((file, index) => {
    const originalName = file.originalFileName?.trim();
    const fallbackName = `첨부-${file.csPostFileId ?? index + 1}`;
    return {
      id: `${idPrefix}-${file.csPostFileId ?? index}`,
      name: originalName || fallbackName,
      size: 0,
      dataUrl: "",
      // fileKey에 S3 fileName을 설정 - 클릭 시 fileApi.getDownloadUrls() 호출
      fileKey: file.fileName,
    };
  });
};
