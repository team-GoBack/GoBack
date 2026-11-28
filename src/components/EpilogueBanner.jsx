// [공통] 알림 배너 (헤더 아래 한 줄)
// 알림이 여러 종류면 순서대로 하나씩 보여 줌: 마무리 필요 → 최종 선택 공개(Best Pick 포함) → 새 후일담
// 같은 종류가 여러 개면 "외 N개 ▾"를 눌러 전체 목록을 펼칠 수 있음
// 페이지를 옮길 때마다, 로그인·로그아웃할 때마다 다시 확인
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getUnreadEpilogues, markEpiloguesRead } from '../api/epilogues.js'
import { getPendingFinishes, getUnreadFinishes, markFinishesRead } from '../api/notices.js'
import { onAuthChange } from '../api/auth.js'

// 알림 종류별 모양 (icon, text는 알림 하나(item)를 받아서 정함)
const KINDS = {
  pending: {
    icon: () => '⏰',
    text: (item) => <>마감된 내 사연 <strong>"{item.title}"</strong>이 최종 선택을 기다려요</>,
    button: '마무리하러 가기',
    markRead: null, // 마무리하면 저절로 사라짐. 닫으면 이번 접속 동안만 숨김
  },
  finish: {
    icon: (item) => (item.is_best ? '🏆' : '🗳️'),
    text: (item) =>
      item.is_best ? (
        <>내 댓글이 <strong>"{item.title}"</strong>의 Best Pick으로 뽑혔어요</>
      ) : (
        <>내가 투표한 사연 <strong>"{item.title}"</strong>의 최종 선택이 공개됐어요</>
      ),
    button: '보러 가기',
    markRead: markFinishesRead,
  },
  epilogue: {
    icon: () => '📮',
    text: (item) => <>내가 투표한 사연 <strong>"{item.title}"</strong>에 새 후일담이 올라왔어요</>,
    button: '보러 가기',
    markRead: markEpiloguesRead,
  },
}
const ORDER = ['pending', 'finish', 'epilogue']

export default function EpilogueBanner() {
  const location = useLocation()
  const navigate = useNavigate()
  const [lists, setLists] = useState({ pending: [], finish: [], epilogue: [] })
  const [hidden, setHidden] = useState({}) // 이번 접속 동안 닫은 종류
  const [expanded, setExpanded] = useState(false) // 전체 목록 펼침
  const [authVersion, setAuthVersion] = useState(0) // 로그인 상태가 바뀌면 다시 확인하기 위한 숫자

  useEffect(() => {
    const unsubscribe = onAuthChange(() => {
      setHidden({})
      setAuthVersion((n) => n + 1)
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    let cancelled = false
    setExpanded(false)
    Promise.all([getPendingFinishes(), getUnreadFinishes(), getUnreadEpilogues()])
      .then(([pending, finish, epilogue]) => {
        if (!cancelled) setLists({ pending, finish, epilogue })
      })
      .catch(() => {
        if (!cancelled) setLists({ pending: [], finish: [], epilogue: [] })
      })
    return () => {
      cancelled = true
    }
  }, [location.pathname, authVersion])

  const kind = ORDER.find((k) => lists[k].length > 0 && !hidden[k])
  if (!kind) return null

  const info = KINDS[kind]
  const items = lists[kind]
  const latest = items[0]
  const extra = items.length - 1

  // 이 종류는 끝 → 다음 종류가 있으면 바로 보임
  async function dismiss() {
    setExpanded(false)
    if (info.markRead) {
      await info.markRead()
      setLists((prev) => ({ ...prev, [kind]: [] }))
    } else {
      setHidden((prev) => ({ ...prev, [kind]: true }))
    }
  }

  async function openPost(postId) {
    await dismiss()
    navigate(`/posts/${postId}`)
  }

  return (
    <div className="epilogue-banner-wrap">
      <div className="epilogue-banner" role="status">
        <span className="epilogue-banner-icon" aria-hidden="true">{info.icon(latest)}</span>
        <p className="epilogue-banner-text">
          {info.text(latest)}
          {extra > 0 && (
            <button
              type="button"
              className="epilogue-banner-more"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
            >
              외 {extra}개 {expanded ? '▴' : '▾'}
            </button>
          )}
        </p>
        <button type="button" className="epilogue-banner-open" onClick={() => openPost(latest.post_id)}>
          {info.button}
        </button>
        <button type="button" className="epilogue-banner-close" onClick={dismiss} aria-label="알림 닫기">
          ×
        </button>
      </div>

      {expanded && (
        <ul className="epilogue-banner-list">
          {items.map((item) => (
            <li key={`${item.post_id}-${item.id ?? ''}`}>
              <button type="button" onClick={() => openPost(item.post_id)}>
                <span aria-hidden="true">{info.icon(item)}</span>
                <span>{info.text(item)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
