// [공통] 알림 종 (내 활동 페이지 헤더)
// - 안 본 알림 수를 빨간 숫자로 표시
// - 누르면 최근 알림 기록(읽은 것 포함)을 펼쳐 보여 줌. 안 본 건 진하게
// - 배너와 같은 "읽음" 기록을 써서, 한쪽에서 지우면 다른 쪽도 같이 바뀜
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser } from '../api/auth.js'
import { getUnreadEpilogues, markEpiloguesRead } from '../api/epilogues.js'
import {
  getPendingFinishes,
  getUnreadFinishes,
  markFinishesRead,
  getNoticeHistory,
  loadDismissed,
  saveDismissed,
  noticeKey,
  notifyNoticesChanged,
  NOTICES_CHANGED,
} from '../api/notices.js'
import { formatDateTime } from '../utils/date.js'

function noticeIcon(item) {
  if (item.kind === 'pending') return '⏰'
  if (item.kind === 'epilogue') return '📮'
  return item.is_best ? '🏆' : '🗳️'
}

function noticeText(item) {
  const title = <strong>"{item.title}"</strong>
  if (item.kind === 'pending') return <>마감된 내 사연 {title}이 최종 선택을 기다려요</>
  if (item.kind === 'epilogue') return <>내가 투표한 사연 {title}에 새 후일담이 올라왔어요</>
  if (item.is_best) return <>내 댓글이 {title}의 Best Pick으로 뽑혔어요</>
  return <>내가 투표한 사연 {title}의 최종 선택이 공개됐어요</>
}

export default function NoticeBell() {
  const navigate = useNavigate()
  const wrapRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [userId, setUserId] = useState(null)
  const [history, setHistory] = useState([])
  const [unreadKeys, setUnreadKeys] = useState(new Set())
  const [version, setVersion] = useState(0)

  // 알림 기록 + 안 본 알림 불러오기
  useEffect(() => {
    let cancelled = false
    Promise.all([getCurrentUser(), getNoticeHistory(), getPendingFinishes(), getUnreadFinishes(), getUnreadEpilogues()])
      .then(([me, list, pending, finish, epilogue]) => {
        if (cancelled) return
        const id = me?.id ?? null
        const dismissed = id ? loadDismissed(id) : new Set()
        const keys = new Set(
          [
            ...pending.map((x) => noticeKey('pending', x)),
            ...finish.map((x) => noticeKey('finish', x)),
            ...epilogue.map((x) => noticeKey('epilogue', x)),
          ].filter((k) => !dismissed.has(k)),
        )
        setUserId(id)
        setHistory(list)
        setUnreadKeys(keys)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [version])

  // 배너에서 지우면 다시 확인
  useEffect(() => {
    const refresh = () => setVersion((n) => n + 1)
    window.addEventListener(NOTICES_CHANGED, refresh)
    return () => window.removeEventListener(NOTICES_CHANGED, refresh)
  }, [])

  // 바깥을 누르면 닫기
  useEffect(() => {
    if (!open) return
    const close = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  function forget(keys) {
    if (!userId) return
    const next = loadDismissed(userId)
    for (const k of keys) next.add(k)
    saveDismissed(userId, next)
  }

  function openItem(item) {
    const key = noticeKey(item.kind, item)
    if (unreadKeys.has(key)) {
      forget([key])
      notifyNoticesChanged()
    }
    setOpen(false)
    navigate(`/posts/${item.post_id}`)
  }

  async function readAll() {
    await Promise.all([markFinishesRead(), markEpiloguesRead()])
    forget([...unreadKeys])
    notifyNoticesChanged()
  }

  const count = unreadKeys.size

  return (
    <div className="notice-bell" ref={wrapRef}>
      <button
        type="button"
        className="reels-link notice-bell-btn"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={count > 0 ? `알림 ${count}개` : '알림'}
      >
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {count > 0 && <span className="notice-bell-count">{count > 99 ? '99+' : count}</span>}
      </button>

      {open && (
        <div className="notice-panel" role="dialog" aria-label="알림">
          <div className="notice-panel-head">
            <strong>알림</strong>
            {count > 0 && (
              <button type="button" className="notice-read-all" onClick={readAll}>
                모두 읽음
              </button>
            )}
          </div>
          {history.length === 0 ? (
            <p className="notice-empty">아직 알림이 없어요</p>
          ) : (
            <ul className="notice-list">
              {history.map((item) => {
                const unread = unreadKeys.has(noticeKey(item.kind, item))
                return (
                  <li key={`${item.kind}:${item.id ?? item.post_id}`}>
                    <button type="button" className={unread ? 'notice-item unread' : 'notice-item'} onClick={() => openItem(item)}>
                      <span aria-hidden="true">{noticeIcon(item)}</span>
                      <span>
                        {noticeText(item)}
                        <time dateTime={item.at}>{formatDateTime(item.at)}</time>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
