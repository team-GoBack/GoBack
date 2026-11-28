// [프론트 팀] 내 활동 페이지 (내가 쓴 사연 / 내가 투표한 사연)
// 담당: 유지민 — 기존 빈 페이지에 내 활동 화면 구현
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCurrentUser, onAuthChange } from '../api/auth.js'
import { getMyPosts, getMyVotedPosts } from '../api/posts.js'
import { formatDateTime } from '../utils/date.js'

// PostCard와 같은 방식으로 남은 시간 표시
function getRemainingText(diff) {
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days >= 1) return `${days}일 남음`
  if (hours >= 1) return `${hours}시간 남음`
  if (minutes >= 1) return `${minutes}분 남음`
  return '곧 마감'
}

// 탭과 마감·마무리 여부에 따른 상태 표시
function getPostStatus(post, tab, now) {
  const diff = new Date(post.vote_ends_at).getTime() - now

  if (diff > 0) {
    return { text: `진행 중 · ${getRemainingText(diff)}`, color: 'var(--muted)' }
  }

  if (tab === 'mine') {
    return post.finished
      ? { text: '후일담 쓰기', color: 'var(--info)' }
      : { text: '마무리 필요', color: 'var(--accent)' }
  }

  return post.finished
    ? { text: '최종 선택 공개', color: 'var(--info)' }
    : { text: '결과 공개', color: 'var(--success)' }
}

// 내 활동 전용 작은 사연 카드
function MyPostItem({ post, tab, now }) {
  const status = getPostStatus(post, tab, now)

  return (
    <Link
      to={`/posts/${post.id}`}
      className="post-card"
      style={{ margin: 0, padding: '14px 16px', borderRadius: 16 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px 8px' }}>
        <span className="tag" style={{ background: 'var(--card)' }}>{post.tag}</span>
        {post.created_at && (
          <time dateTime={post.created_at} style={{ color: 'var(--muted)', fontSize: 13, marginLeft: 'auto' }}>
            {formatDateTime(post.created_at)}
          </time>
        )}
      </div>

      <h3 style={{ margin: '10px 0', fontSize: 17, lineHeight: 1.5, wordBreak: 'keep-all', overflowWrap: 'anywhere' }}>
        {post.title}
      </h3>

      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px 12px', fontSize: 13 }}>
        <span style={{ color: 'var(--muted)' }}>투표 {post.response_count}명</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
          <span style={{ color: status.color, fontWeight: status.color === 'var(--muted)' ? 500 : 700 }}>
            {status.text}
          </span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
            <path d="m9 18 6-6-6-6" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </Link>
  )
}

export default function MyPage() {
  const [tab, setTab] = useState('mine')
  // undefined: 로그인 확인 중, null: 로그아웃, 문자열: 로그인한 사용자 ID
  const [userId, setUserId] = useState(undefined)
  const [authError, setAuthError] = useState(false)
  const [activity, setActivity] = useState(null)
  const [now, setNow] = useState(Date.now)

  // 첫 로그인 상태 확인 및 페이지를 보고 있는 동안 로그인·로그아웃 감지
  useEffect(() => {
    let active = true
    let authChanged = false

    const unsubscribe = onAuthChange((user) => {
      if (!active) return
      authChanged = true
      setAuthError(false)
      setUserId(user?.id ?? null)
    })

    getCurrentUser()
      .then((user) => {
        if (active && !authChanged) setUserId(user?.id ?? null)
      })
      .catch(() => {
        if (active && !authChanged) setAuthError(true)
      })

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  // 로그인한 사용자의 두 목록을 조회 (탭 전환 시에는 다시 조회하지 않음)
  useEffect(() => {
    let active = true
    setActivity(null)

    if (!userId) return

    Promise.all([getMyPosts(), getMyVotedPosts()])
      .then(([mine, voted]) => {
        if (active) setActivity({ userId, mine, voted })
      })
      .catch((error) => {
        console.error('내 활동 조회 실패:', error)
        if (active) setActivity({ userId, error: true })
      })

    return () => { active = false }
  }, [userId])

  // 화면에 머물러 있어도 남은 시간과 마감 상태 갱신
  useEffect(() => {
    if (!userId) return
    setNow(Date.now())
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [userId])

  const currentActivity = activity?.userId === userId ? activity : null
  const posts = currentActivity?.[tab] ?? []
  const messageStyle = { color: 'var(--muted)', textAlign: 'center', padding: '28px 12px' }

  function getTabStyle(value) {
    const selected = tab === value
    return {
      minWidth: 0,
      minHeight: 44,
      padding: '10px 8px',
      border: `1px solid ${selected ? 'var(--primary)' : 'var(--card-border)'}`,
      borderRadius: 12,
      background: selected ? 'var(--primary)' : 'var(--card)',
      color: selected ? 'var(--on-primary)' : 'var(--ink)',
      boxShadow: 'var(--shadow)',
      font: 'inherit',
      fontSize: 14,
      fontWeight: selected ? 700 : 500,
      cursor: 'pointer',
      wordBreak: 'keep-all',
    }
  }

  return (
    <main style={{ maxWidth: 680, margin: '0 auto' }}>
      <h2>내 활동</h2>

      {authError ? (
        <p style={messageStyle}>로그인 상태를 확인하지 못했어요. 새로고침해 주세요.</p>
      ) : userId === undefined ? (
        <p role="status" style={messageStyle}>불러오는 중...</p>
      ) : userId === null ? (
        <p style={messageStyle}>로그인하면 내 활동을 볼 수 있어요</p>
      ) : (
        <>
          <div role="group" aria-label="내 활동 유형" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8, marginBottom: 16 }}>
            <button type="button" aria-pressed={tab === 'mine'} onClick={() => setTab('mine')} style={getTabStyle('mine')}>
              내가 쓴 사연
            </button>
            <button type="button" aria-pressed={tab === 'voted'} onClick={() => setTab('voted')} style={getTabStyle('voted')}>
              내가 투표한 사연
            </button>
          </div>

          {!currentActivity ? (
            <p role="status" style={messageStyle}>불러오는 중...</p>
          ) : currentActivity.error ? (
            <p style={messageStyle}>내 활동을 불러오지 못했어요. 새로고침해 주세요.</p>
          ) : posts.length === 0 ? (
            <p style={messageStyle}>
              {tab === 'mine' ? '아직 쓴 사연이 없어요' : '아직 투표한 사연이 없어요'}
            </p>
          ) : (
            // main 바로 아래에 post-card를 두면 메인 페이지 벤토 그리드가 적용됨
            <section aria-label={tab === 'mine' ? '내가 쓴 사연 목록' : '내가 투표한 사연 목록'} style={{ display: 'grid', gap: 10 }}>
              {posts.map((post) => (
                <MyPostItem key={post.id} post={post} tab={tab} now={now} />
              ))}
            </section>
          )}
        </>
      )}
    </main>
  )
}
