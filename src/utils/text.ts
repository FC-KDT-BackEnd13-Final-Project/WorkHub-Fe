export const stripHtml = (value: string) =>
  value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

export const truncatePlainText = (value: string, limit = 50) => {
  if (!value) return "";
  const chars = Array.from(value);
  if (chars.length <= limit) {
    return value;
  }
  return `${chars.slice(0, limit).join("")}...`;
};
