// 전역 페이지 하단 정보와 링크를 고정 표시하는 푸터
export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="min-h-[140px] bg-background/80 backdrop-blur px-6 py-8 text-sm text-muted-foreground">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-3 text-center md:flex-row md:items-center md:justify-between md:text-left">
        <span>© {year} WorkHub. All rights reserved.</span>
      </div>
    </footer>
  );
}
