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

// 마감됐지만 아직 마무리하지 않은 내 사연을 먼저 표시
function needsFinish(post, now) {
  return new Date(post.vote_ends_at).getTime() <= now && !post.finished
}

function hiddenKey(userId, tab) {
  return `goback:hidden:${userId}:${tab}`
}

// 계정·탭별 숨김 기록 (저장소가 막혀 있어도 화면은 정상 동작)
function readHidden(userId, tab) {
  try {
    const ids = JSON.parse(localStorage.getItem(hiddenKey(userId, tab)) ?? '[]')
    return Array.isArray(ids) ? ids : []
  } catch {
    return []
  }
}

function writeHidden(userId, tab, ids) {
  try {
    localStorage.setItem(hiddenKey(userId, tab), JSON.stringify(ids))
    return true
  } catch {
    return false
  }
}

// 두 페이지에서 같은 모양으로 사용하는 검색창 (공통 CSS 파일은 수정하지 않음)
const searchBoxStyle = {
  display: 'flex', alignItems: 'center', gap: 10, minWidth: 0,
  height: 44, padding: '0 14px', border: '1px solid color-mix(in srgb, var(--ink) 18%, transparent)', // 흰 배경 위에서 보이게 조금 진하게
  borderRadius: 999, background: 'var(--card)', color: 'var(--muted)',
}
const searchInputStyle = {
  flex: 1, width: '100%', minWidth: 0, height: '100%', padding: 0,
  border: 'none', background: 'transparent', color: 'var(--ink)',
  font: 'inherit', fontSize: 14, borderRadius: 999,
}

const smallButtonStyle = {
  font: 'inherit', fontSize: 13, color: 'var(--muted)',
  background: 'var(--card)', border: '1px solid var(--border)',
  borderRadius: 999, padding: '6px 12px', cursor: 'pointer',
}

// 내 활동 전용 작은 사연 카드
function MyPostItem({ post, tab, now, hidden, onToggleHidden }) {
  const status = getPostStatus(post, tab, now)
  const [menuOpen, setMenuOpen] = useState(false)
  const urgent = tab === 'mine' && needsFinish(post, now)

  return (
    <article
      className="post-card"
      style={{ margin: 0, padding: 0, borderRadius: 16, position: 'relative', minWidth: 0,
        border: urgent ? '1px solid var(--accent)' : '1px solid var(--card-border)',
        opacity: hidden ? 0.6 : 1, zIndex: menuOpen ? 2 : undefined }}
    >
      {/* 링크와 메뉴 버튼을 분리해 버튼 클릭 시 상세 페이지로 이동하지 않도록 함 */}
      <Link to={`/posts/${post.id}`} style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '14px 16px', borderRadius: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px 8px', paddingRight: 38, minHeight: 28 }}>
          <span className="tag" style={{ background: 'var(--card)' }}>{post.tag}</span>
          {post.created_at && (
            <time dateTime={post.created_at} style={{ color: 'var(--muted)', fontSize: 13, marginLeft: 'auto' }}>
              {formatDateTime(post.created_at)}
            </time>
          )}
        </div>

        <h3 style={{ margin: '10px 0', fontSize: 17, lineHeight: 1.5, wordBreak: 'keep-all', overflowWrap: 'anywhere', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {post.title}
        </h3>

        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px 12px', fontSize: 13, marginTop: 'auto' }}>
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
      <div
        style={{ position: 'absolute', top: 12, right: 12 }}
        onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setMenuOpen(false) }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.preventDefault()
            e.currentTarget.querySelector('button')?.focus()
            setMenuOpen(false)
          }
        }}
      >
        <button
          type="button"
          aria-label={`${post.title} 더보기`}
          aria-expanded={menuOpen}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setMenuOpen(!menuOpen)
          }}
          style={{ ...smallButtonStyle, border: 'none', background: 'transparent', padding: 0, width: 32, height: 32, display: 'grid', placeItems: 'center' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--muted)" aria-hidden="true">
            <circle cx="5" cy="12" r="1.8" />
            <circle cx="12" cy="12" r="1.8" />
            <circle cx="19" cy="12" r="1.8" />
          </svg>
        </button>
        {menuOpen && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setMenuOpen(false)
              onToggleHidden(post.id)
            }}
            style={{ ...smallButtonStyle, position: 'absolute', top: 38, right: 0, whiteSpace: 'nowrap',
              borderRadius: 10, background: 'var(--bg)', boxShadow: 'var(--shadow)', color: 'var(--ink)', padding: '10px 14px' }}
          >
            {hidden ? '다시 보이기' : '목록에서 숨기기'}
          </button>
        )}
      </div>
    </article>
  )
}

export default function MyPage() {
  const [tab, setTab] = useState('mine')
  const [search, setSearch] = useState('')
  // undefined: 로그인 확인 중, null: 로그아웃, 문자열: 로그인한 사용자 ID
  const [userId, setUserId] = useState(undefined)
  const [authError, setAuthError] = useState(false)
  const [activity, setActivity] = useState(null)
  const [now, setNow] = useState(Date.now)
  const [hiddenActivity, setHiddenActivity] = useState(null)
  const [showHidden, setShowHidden] = useState(false)
  const [storageError, setStorageError] = useState(false)
  const [narrow, setNarrow] = useState(() => window.matchMedia('(max-width: 720px)').matches)

  // 720px 이하에서는 1열, 그 외에는 2열
  useEffect(() => {
    const media = window.matchMedia('(max-width: 720px)')
    const update = () => setNarrow(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  // 로그인 계정이 바뀌면 해당 계정의 숨김 기록만 읽음
  useEffect(() => {
    setShowHidden(false)
    setSearch('')
    setStorageError(false)
    setHiddenActivity(userId ? {
      userId,
      mine: readHidden(userId, 'mine'),
      voted: readHidden(userId, 'voted'),
    } : null)
  }, [userId])

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
  const currentHidden = hiddenActivity?.userId === userId ? hiddenActivity : null
  const posts = currentActivity?.[tab] ?? []
  const hiddenIds = currentHidden?.[tab] ?? []
  const visiblePosts = posts.filter((post) => !hiddenIds.includes(post.id))
  const hiddenPosts = posts.filter((post) => hiddenIds.includes(post.id))
  const countVisible = (value) => (currentActivity?.[value] ?? [])
    .filter((post) => !(currentHidden?.[value] ?? []).includes(post.id)).length
  const ready = Boolean(currentActivity && currentHidden && !currentActivity.error)
  const selectedPosts = showHidden ? hiddenPosts : visiblePosts
  // 숨김 여부로 거른 목록에서 제목 또는 내용을 검색 (탭의 개수에는 영향 없음)
  const keyword = search.trim().toLowerCase()
  const searchedPosts = keyword
    ? selectedPosts.filter((post) => (post.title ?? '').toLowerCase().includes(keyword) || (post.content ?? '').toLowerCase().includes(keyword))
    : selectedPosts
  // 마무리 필요 사연을 먼저 표시하고 나머지 순서는 유지 (원본 배열 변경 금지)
  const displayedPosts = tab === 'mine'
    ? [...searchedPosts.filter((post) => needsFinish(post, now)), ...searchedPosts.filter((post) => !needsFinish(post, now))]
    : searchedPosts
  const messageStyle = { color: 'var(--muted)', textAlign: 'center', padding: '28px 12px' }

  function toggleHidden(postId) {
    if (!userId || !currentHidden) return
    const next = hiddenIds.includes(postId)
      ? hiddenIds.filter((id) => id !== postId)
      : [...hiddenIds, postId]
    setHiddenActivity({ ...currentHidden, [tab]: next })
    setStorageError(!writeHidden(userId, tab, next))
  }

  function changeTab(value) {
    if (value !== tab) setSearch('')
    setTab(value)
    setShowHidden(false)
  }

  return (
    <main style={{ maxWidth: 960, margin: '0 auto' }}>
      {/* 메인 캐치프레이즈와 같은 모양의 제목 */}
      <section className="hero">
        <h1>나의 <em>고백</em>과 선택</h1>
        <p>내가 쓴 사연과 투표한 사연을 한곳에서 확인해요.</p>
      </section>

      {authError ? (
        <p style={messageStyle}>로그인 상태를 확인하지 못했어요. 새로고침해 주세요.</p>
      ) : userId === undefined ? (
        <p role="status" style={messageStyle}>불러오는 중...</p>
      ) : userId === null ? (
        <p style={messageStyle}>로그인하면 내 활동을 볼 수 있어요</p>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
            <div className="tags" role="group" aria-label="내 활동 유형" style={{ marginBottom: 0 }}>
              <button type="button" className={tab === 'mine' ? 'active' : ''} aria-pressed={tab === 'mine'} onClick={() => changeTab('mine')}>
                내가 쓴 사연{ready ? ` ${countVisible('mine')}` : ''}
              </button>
              <button type="button" className={tab === 'voted' ? 'active' : ''} aria-pressed={tab === 'voted'} onClick={() => changeTab('voted')}>
                내가 투표한 사연{ready ? ` ${countVisible('voted')}` : ''}
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginLeft: 'auto' }}>
              {ready && (showHidden || hiddenPosts.length > 0) && (
                <button type="button" aria-pressed={showHidden} onClick={() => setShowHidden(!showHidden)} style={smallButtonStyle}>
                  {showHidden ? '← 전체 사연 보기' : `숨긴 사연 ${hiddenPosts.length}개 보기`}
                </button>
              )}
              {/* 검색창: 탭 줄 오른쪽에 짧게 */}
              <label style={{ ...searchBoxStyle, width: 260, maxWidth: '100%' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" aria-hidden="true" style={{ flexShrink: 0 }}>
                  <circle cx="11" cy="11" r="7" />
                  <path d="m16 16 4 4" />
                </svg>
                <input type="search" aria-label="제목이나 내용으로 검색" placeholder="제목·내용 검색" value={search} onChange={(e) => setSearch(e.target.value)} style={searchInputStyle} />
              </label>
            </div>
          </div>

          {!currentActivity || !currentHidden ? (
            <p role="status" style={messageStyle}>불러오는 중...</p>
          ) : currentActivity.error ? (
            <p style={messageStyle}>내 활동을 불러오지 못했어요. 새로고침해 주세요.</p>
          ) : (
            <>
              {storageError && (
                <p role="status" style={{ color: 'var(--muted)', fontSize: 13 }}>
                  숨김 기록을 브라우저에 저장하지 못했어요. 새로고침하면 변경 사항이 사라질 수 있어요.
                </p>
              )}
              {displayedPosts.length === 0 ? (
                <p style={messageStyle}>
                  {keyword ? '검색 결과가 없어요' : showHidden ? '숨긴 사연이 없어요' : posts.length > 0 ? '표시할 사연이 없어요' : tab === 'mine' ? '아직 쓴 사연이 없어요' : '아직 투표한 사연이 없어요'}
                </p>
              ) : (
                // main 바로 아래에 post-card를 두면 메인 페이지 벤토 그리드가 적용됨
                <section aria-label={showHidden ? '숨긴 사연 목록' : tab === 'mine' ? '내가 쓴 사연 목록' : '내가 투표한 사연 목록'} style={{ display: 'grid', gridTemplateColumns: narrow ? 'minmax(0, 1fr)' : 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
                  {displayedPosts.map((post) => (
                    <MyPostItem key={`${userId}:${tab}:${post.id}`} post={post} tab={tab} now={now} hidden={showHidden} onToggleHidden={toggleHidden} />
                  ))}
                </section>
              )}
            </>
          )}
        </>
      )}
    </main>
  )
}
