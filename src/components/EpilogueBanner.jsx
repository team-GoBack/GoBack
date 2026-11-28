// [공통] 알림 배너 (헤더 아래 한 줄)
// 알림이 여러 종류면 순서대로 하나씩 보여 줌: 마무리 필요 → 최종 선택 공개(Best Pick 포함) → 새 후일담
// 같은 종류가 여러 개면 "외 N개 ▾"를 눌러 전체 목록을 펼칠 수 있고, 목록에서 하나씩 지울 수 있음
// - 배너의 "보러 가기"·목록 항목 클릭·목록의 × → 그 알림 하나만 지움
// - 배너의 × → 그 종류 알림을 전부 지움
// 페이지를 옮길 때마다, 로그인·로그아웃할 때마다 다시 확인
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getUnreadEpilogues, markEpiloguesRead } from '../api/epilogues.js'
import { getPendingFinishes, getUnreadFinishes, markFinishesRead } from '../api/notices.js'
import { getCurrentUser, onAuthChange } from '../api/auth.js'

// 알림 종류별 모양 (icon, text는 알림 하나(item)를 받아서 정함)
const KINDS = {
  pending: {
    icon: () => '⏰',
    text: (item) => <>마감된 내 사연 <strong>"{item.title}"</strong>이 최종 선택을 기다려요</>,
    button: '마무리하러 가기',
    key: (item) => `pending:${item.post_id}`,
    markRead: null, // 마무리하면 저절로 사라짐. ×로 지우면 그 사연 알림은 다시 안 뜸
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
    key: (item) => `finish:${item.post_id}`,
    markRead: markFinishesRead,
  },
  epilogue: {
    icon: () => '📮',
    text: (item) => <>내가 투표한 사연 <strong>"{item.title}"</strong>에 새 후일담이 올라왔어요</>,
    button: '보러 가기',
    key: (item) => `epilogue:${item.id}`,
    markRead: markEpiloguesRead,
  },
}
const ORDER = ['pending', 'finish', 'epilogue']

// 지운 알림 기억 (이 브라우저, 계정마다 따로)
function dismissedKey(userId) {
  return `goback:notice-dismissed:${userId}`
}

function loadDismissed(userId) {
  try {
    return new Set(JSON.parse(localStorage.getItem(dismissedKey(userId)) || '[]'))
  } catch {
    return new Set()
  }
}

function saveDismissed(userId, set) {
  try {
    const saved = [...set].slice(-500) // 너무 쌓이지 않게
    localStorage.setItem(dismissedKey(userId), JSON.stringify(saved))
  } catch {
    // 저장이 안 되는 브라우저면 다음에 또 보일 뿐, 문제없음
  }
}

export default function EpilogueBanner() {
  const location = useLocation()
  const navigate = useNavigate()
  const [userId, setUserId] = useState(null)
  const [lists, setLists] = useState({ pending: [], finish: [], epilogue: [] })
  const [saved, setSaved] = useState(new Set()) // 하나씩 지운 알림 (브라우저에 저장된 것)
  const [expanded, setExpanded] = useState(false) // 전체 목록 펼침
  const [authVersion, setAuthVersion] = useState(0) // 로그인 상태가 바뀌면 다시 확인하기 위한 숫자

  useEffect(() => {
    const unsubscribe = onAuthChange(() => {
      setAuthVersion((n) => n + 1)
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    let cancelled = false
    setExpanded(false)
    Promise.all([getCurrentUser(), getPendingFinishes(), getUnreadFinishes(), getUnreadEpilogues()])
      .then(([me, pending, finish, epilogue]) => {
        if (cancelled) return
        const id = me?.id ?? null
        setUserId(id)
        setSaved(id ? loadDismissed(id) : new Set())
        setLists({ pending, finish, epilogue })
      })
      .catch(() => {
        if (!cancelled) setLists({ pending: [], finish: [], epilogue: [] })
      })
    return () => {
      cancelled = true
    }
  }, [location.pathname, authVersion])

  // 지운 알림을 뺀, 실제로 보일 목록
  const visible = {}
  for (const k of ORDER) visible[k] = lists[k].filter((item) => !saved.has(KINDS[k].key(item)))

  const kind = ORDER.find((k) => visible[k].length > 0)
  if (!kind) return null

  const info = KINDS[kind]
  const items = visible[kind]
  const latest = items[0]
  const extra = items.length - 1

  // 알림들을 지운 것으로 기억 (새로고침해도 다시 안 뜸)
  function forget(list) {
    const next = new Set(saved)
    for (const item of list) next.add(info.key(item))
    setSaved(next)
    if (userId) saveDismissed(userId, next)
  }

  // 알림 하나만 지우기
  function dismissOne(item) {
    forget([item])
    if (items.length <= 1) setExpanded(false)
  }

  // 이 종류 전부 지우기 → 다음 종류가 있으면 바로 보임
  async function dismissAll() {
    setExpanded(false)
    if (info.markRead) {
      await info.markRead()
      setLists((prev) => ({ ...prev, [kind]: [] }))
    } else {
      forget(items)
    }
  }

  function openItem(item) {
    dismissOne(item)
    navigate(`/posts/${item.post_id}`)
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
        <button type="button" className="epilogue-banner-open" onClick={() => openItem(latest)}>
          {info.button}
        </button>
        <button
          type="button"
          className="epilogue-banner-close"
          onClick={dismissAll}
          aria-label="이 종류 알림 모두 지우기"
          title="모두 지우기"
        >
          ×
        </button>
      </div>

      {expanded && (
        <ul className="epilogue-banner-list">
          {items.map((item) => (
            <li key={info.key(item)}>
              <button type="button" className="epilogue-banner-item" onClick={() => openItem(item)}>
                <span aria-hidden="true">{info.icon(item)}</span>
                <span>{info.text(item)}</span>
              </button>
              <button
                type="button"
                className="epilogue-banner-item-close"
                onClick={() => dismissOne(item)}
                aria-label="이 알림 지우기"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
