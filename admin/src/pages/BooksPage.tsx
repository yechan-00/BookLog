import { useEffect, useState, type FormEvent } from 'react';

import { Pager } from '../components/Pager';
import { StatusMessage } from '../components/StatusMessage';
import { fetchBooks, updateBook, type BookPatch, type BookRow, type Page } from '../lib/api';

const SEARCH_DEBOUNCE_MS = 300;

interface BookDraft {
  title: string;
  author: string;
  publisher: string;
  totalPages: string;
}

function toDraft(book: BookRow): BookDraft {
  return {
    title: book.title,
    author: book.author,
    publisher: book.publisher,
    totalPages: book.totalPages === null ? '' : String(book.totalPages),
  };
}

/** 입력을 검증해 저장할 값으로 바꾼다. 문제가 있으면 사용자에게 보여줄 문장을 돌려준다. */
function parseDraft(draft: BookDraft): BookPatch | string {
  const title = draft.title.trim();
  if (!title) {
    return '제목은 비워둘 수 없습니다.';
  }

  const pagesText = draft.totalPages.trim();
  let totalPages: number | null = null;
  if (pagesText !== '') {
    totalPages = Number(pagesText);
    if (!Number.isSafeInteger(totalPages) || totalPages < 1) {
      return '총 페이지는 1 이상의 정수여야 합니다. 모르면 비워 두세요.';
    }
  }

  return { title, author: draft.author.trim(), publisher: draft.publisher.trim(), totalPages };
}

export function BooksPage() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [missingPagesOnly, setMissingPagesOnly] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [result, setResult] = useState<Page<BookRow> | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<BookDraft | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPageIndex(0);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let isCancelled = false;
    setErrorMessage(null);

    fetchBooks(search, missingPagesOnly, pageIndex)
      .then((page) => {
        if (!isCancelled) {
          setResult(page);
        }
      })
      .catch((error: unknown) => {
        if (!isCancelled) {
          setErrorMessage(error instanceof Error ? error.message : '도서 목록을 불러오지 못했습니다.');
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [search, missingPagesOnly, pageIndex, reloadToken]);

  function startEdit(book: BookRow) {
    setEditingId(book.id);
    setDraft(toDraft(book));
    setFormError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft(null);
    setFormError(null);
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingId || !draft || isSaving) {
      return;
    }

    const parsed = parseDraft(draft);
    if (typeof parsed === 'string') {
      setFormError(parsed);
      return;
    }

    setIsSaving(true);
    setFormError(null);
    try {
      await updateBook(editingId, parsed);
      cancelEdit();
      setReloadToken((token) => token + 1);
    } catch (error: unknown) {
      setFormError(error instanceof Error ? error.message : '저장하지 못했습니다.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <header className="page-head">
        <h2>도서 관리</h2>
        <div className="filters">
          <label className="inline">
            검색
            <input
              type="search"
              placeholder="제목·저자·ISBN"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </label>
          <label className="inline">
            <input
              type="checkbox"
              checked={missingPagesOnly}
              onChange={(event) => {
                setMissingPagesOnly(event.target.checked);
                setPageIndex(0);
              }}
            />
            페이지 수 누락만
          </label>
        </div>
      </header>

      {errorMessage ? <StatusMessage kind="error">{errorMessage}</StatusMessage> : null}
      {!result && !errorMessage ? <StatusMessage kind="loading">도서를 불러오는 중...</StatusMessage> : null}
      {result && result.rows.length === 0 ? <StatusMessage kind="empty">조건에 맞는 도서가 없습니다.</StatusMessage> : null}

      {result && result.rows.length > 0 ? (
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>제목</th>
                <th>저자</th>
                <th>출판사</th>
                <th>ISBN</th>
                <th className="num">총 페이지</th>
                <th aria-label="작업" />
              </tr>
            </thead>
            <tbody>
              {result.rows.map((book) =>
                editingId === book.id && draft ? (
                  <tr key={book.id} className="editing">
                    <td colSpan={6}>
                      <form className="edit-form" onSubmit={handleSave}>
                        <label>
                          제목
                          <input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} required />
                        </label>
                        <label>
                          저자
                          <input value={draft.author} onChange={(event) => setDraft({ ...draft, author: event.target.value })} />
                        </label>
                        <label>
                          출판사
                          <input
                            value={draft.publisher}
                            onChange={(event) => setDraft({ ...draft, publisher: event.target.value })}
                          />
                        </label>
                        <label>
                          총 페이지
                          <input
                            inputMode="numeric"
                            value={draft.totalPages}
                            onChange={(event) => setDraft({ ...draft, totalPages: event.target.value })}
                            placeholder="비워 두면 미입력"
                          />
                        </label>
                        <div className="edit-actions">
                          <button type="submit" className="primary" disabled={isSaving}>
                            {isSaving ? '저장 중...' : '저장'}
                          </button>
                          <button type="button" onClick={cancelEdit} disabled={isSaving}>
                            취소
                          </button>
                        </div>
                        {formError ? <StatusMessage kind="error">{formError}</StatusMessage> : null}
                      </form>
                    </td>
                  </tr>
                ) : (
                  <tr key={book.id}>
                    <td>{book.title}</td>
                    <td>{book.author || '-'}</td>
                    <td>{book.publisher || '-'}</td>
                    <td>{book.isbn ?? '-'}</td>
                    <td className="num">
                      {book.totalPages === null ? <span className="badge badge-warn">누락</span> : book.totalPages}
                    </td>
                    <td>
                      <button type="button" onClick={() => startEdit(book)}>
                        수정
                      </button>
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      ) : null}

      {result ? <Pager pageIndex={pageIndex} total={result.total} onChange={setPageIndex} /> : null}
    </>
  );
}
