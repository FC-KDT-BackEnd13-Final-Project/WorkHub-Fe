// 전역 페이지 하단 정보와 링크를 고정 표시하는 푸터
export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="min-h-[140px] bg-background/80 backdrop-blur flex flex-col justify-center gap-4 px-6 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
      <span>© {year} WorkHub. All rights reserved.</span>
      <span className="inline-flex gap-4">
        <a href="#privacy" className="hover:text-foreground transition-colors">Privacy</a>
        <a href="#terms" className="hover:text-foreground transition-colors">Terms</a>
      </span>
    </footer>
  );
}
