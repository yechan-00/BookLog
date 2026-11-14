import { useCallback, useEffect, useState } from 'react';

import { Pager } from '../components/Pager';
import { StatusMessage } from '../components/StatusMessage';
import { fetchMembers, setSuspended, type MemberRow, type Page } from '../lib/api';
import { formatDate } from '../lib/date';

const SEARCH_DEBOUNCE_MS = 300;

export function MembersPage() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [pageIndex, setPageIndex] = useState(0);
  const [result, setResult] = useState<Page<MemberRow> | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

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

    fetchMembers(search, pageIndex)
      .then((page) => {
        if (!isCancelled) {
          setResult(page);
        }
      })
      .catch((error: unknown) => {
        if (!isCancelled) {
          setErrorMessage(error instanceof Error ? error.message : '회원 목록을 불러오지 못했습니다.');
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [search, pageIndex, reloadToken]);

  const handleToggleSuspended = useCallback(async (member: MemberRow) => {
    const nextSuspended = !member.isSuspended;
    const message = nextSuspended
      ? `${member.nickname}님의 이용을 정지할까요? 정지된 회원은 앱에서 안내 화면에서 멈춥니다.`
      : `${member.nickname}님의 이용 정지를 해제할까요?`;
    if (!window.confirm(message)) {
      return;
    }

    setBusyId(member.id);
    setActionError(null);
    try {
      await setSuspended(member.id, nextSuspended);
      setReloadToken((token) => token + 1);
    } catch (error: unknown) {
      setActionError(error instanceof Error ? error.message : '처리하지 못했습니다.');
    } finally {
      setBusyId(null);
    }
  }, []);

  return (
    <>
      <header className="page-head">
        <h2>회원 관리</h2>
        <label className="inline">
          검색
          <input
            type="search"
            placeholder="닉네임 또는 이메일"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
        </label>
      </header>

      {errorMessage ? <StatusMessage kind="error">{errorMessage}</StatusMessage> : null}
      {actionError ? <StatusMessage kind="error">{actionError}</StatusMessage> : null}
      {!result && !errorMessage ? <StatusMessage kind="loading">회원을 불러오는 중...</StatusMessage> : null}
      {result && result.rows.length === 0 ? <StatusMessage kind="empty">조건에 맞는 회원이 없습니다.</StatusMessage> : null}

      {result && result.rows.length > 0 ? (
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>닉네임</th>
                <th>이메일</th>
                <th>가입일</th>
                <th className="num">세션 수</th>
                <th>마지막 독서일</th>
                <th>상태</th>
                <th aria-label="작업" />
              </tr>
            </thead>
            <tbody>
              {result.rows.map((member) => (
                <tr key={member.id}>
                  <td>{member.nickname || '-'}</td>
                  <td>{member.email ?? '-'}</td>
                  <td>{formatDate(member.createdAt)}</td>
                  <td className="num">{member.sessionCount}</td>
                  <td>{formatDate(member.lastReadOn)}</td>
                  <td>
                    <span className={member.isSuspended ? 'badge badge-warn' : 'badge'}>
                      {member.isSuspended ? '이용 정지' : '정상'}
                    </span>
                  </td>
                  <td>
                    <button type="button" disabled={busyId === member.id} onClick={() => handleToggleSuspended(member)}>
                      {member.isSuspended ? '정지 해제' : '이용 정지'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {result ? <Pager pageIndex={pageIndex} total={result.total} onChange={setPageIndex} /> : null}
    </>
  );
}
