import { PAGE_SIZE } from '../lib/api';

interface PagerProps {
  pageIndex: number;
  total: number;
  onChange: (pageIndex: number) => void;
}

export function Pager({ pageIndex, total, onChange }: PagerProps) {
  const lastPageIndex = Math.max(Math.ceil(total / PAGE_SIZE) - 1, 0);

  return (
    <div className="pager">
      <button type="button" disabled={pageIndex <= 0} onClick={() => onChange(pageIndex - 1)}>
        이전
      </button>
      <span>
        {pageIndex + 1} / {lastPageIndex + 1} 페이지 · 총 {total}건
      </span>
      <button type="button" disabled={pageIndex >= lastPageIndex} onClick={() => onChange(pageIndex + 1)}>
        다음
      </button>
    </div>
  );
}
