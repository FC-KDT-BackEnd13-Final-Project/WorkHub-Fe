// 리스트의 총 아이템/페이지 크기를 받아 최소 1페이지 이상을 반환한다.
export function calculateTotalPages(totalItems: number, pageSize: number): number {
  const safePageSize = Math.max(1, Math.floor(pageSize));
  const safeTotal = Math.max(0, Math.floor(totalItems));
  return Math.max(1, Math.ceil(safeTotal / safePageSize));
}

// 페이지 번호가 1~totalPages 범위를 벗어나지 않도록 보정한다.
export function clampPage(page: number, totalPages: number): number {
  const safePage = Math.max(1, Math.floor(page));
  const safeTotalPages = Math.max(1, Math.floor(totalPages));
  return Math.min(Math.max(safePage, 1), safeTotalPages);
}

// 계산된 페이지 정보를 기반으로 목록 슬라이스를 반환한다.
export function paginate<T>(items: T[], page: number, pageSize: number): T[] {
  const safePageSize = Math.max(1, Math.floor(pageSize));
  const currentPage = clampPage(page, calculateTotalPages(items.length, safePageSize));
  const start = (currentPage - 1) * safePageSize;
  return items.slice(start, start + safePageSize);
}
