// [프론트 팀] 메인 페이지: 사연 목록
// 흐름: 화면이 열림 → getPosts()로 주문 → 처음 열 때만 "불러오는 중..." → 받은 사연을 정렬해서 카드로 그림
import { useEffect, useState } from 'react'
import { getPosts } from '../api/posts.js'
import PostCard from '../components/PostCard.jsx'

const TAGS = ['전체', '연애', '입시', '기타']
const SORTS = [
  { key: 'latest', label: '최신순' },
  { key: 'popular', label: '투표 많은 순' },
]

// 두 페이지에서 같은 모양으로 사용하는 검색창 (공통 CSS 파일은 수정하지 않음)
const searchBoxStyle = {
  display: 'flex', alignItems: 'center', gap: 10, minWidth: 0,
  height: 44, padding: '0 14px', border: '1px solid var(--border)',
  borderRadius: 999, background: 'var(--card)', color: 'var(--muted)',
}
const searchInputStyle = {
  flex: 1, width: '100%', minWidth: 0, height: '100%', padding: 0,
  border: 'none', background: 'transparent', color: 'var(--ink)',
  font: 'inherit', fontSize: 14, borderRadius: 999,
}

// HOT 사연이 되기 위한 최소 투표 수
const HOT_MIN = 3

// HOT 사연인지 알려주는 함수 = 아직 마감 전 + 투표가 HOT_MIN명 이상
function isHotPost(post) {
  const notClosed = new Date(post.vote_ends_at) > new Date()
  return notClosed && (post.response_count || 0) >= HOT_MIN
}

// 가장 HOT한 사연 하나를 맨 앞으로 옮긴 "새 배열"을 만들어 주는 함수 (원본 list는 그대로)
// 동점이면 목록에서 더 앞에 있는 사연을 고름. HOT 사연이 없으면 순서 그대로.
function moveHotFirst(list) {
  let topHot = null
  for (const post of list) {
    if (!isHotPost(post)) continue
    // ">" 라서 동점일 때는 먼저 나온(더 앞에 있는) 사연이 그대로 남음
    if (!topHot || (post.response_count || 0) > (topHot.response_count || 0)) {
      topHot = post
    }
  }

  if (!topHot) return list
  return [topHot, ...list.filter((post) => post.id !== topHot.id)]
}

export default function MainPage() {
  const [posts, setPosts] = useState([])     // 받아온 사연 목록을 기억하는 곳
  const [loading, setLoading] = useState(true) // 지금 데이터를 기다리는 중인지 기억하는 곳
  const [hasLoaded, setHasLoaded] = useState(false) // 처음 한 번이라도 받아왔는지 기억하는 곳
  const [tag, setTag] = useState('전체')      // 지금 고른 카테고리
  const [sort, setSort] = useState('latest') // 지금 고른 정렬 방식

  const [search, setSearch] = useState('')
  const [ongoingOnly, setOngoingOnly] = useState(false)
  const [narrow, setNarrow] = useState(() => window.matchMedia('(max-width: 760px)').matches)

  // 좁은 화면에서는 검색창을 캐치프레이즈 아래로 내림
  useEffect(() => {
    const media = window.matchMedia('(max-width: 760px)')
    const update = () => setNarrow(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  // tag가 바뀔 때마다 주문 창구에 다시 주문
  useEffect(() => {
    let ignore = false // 카테고리를 빨리 바꿨을 때 옛날 주문 결과가 덮어쓰지 않게 하는 표시
    setLoading(true)   // 주문 넣기 전에 "기다리는 중"으로 바꿈

    getPosts(tag === '전체' ? null : tag)
      .then((result) => {
        if (!ignore) setPosts(result || [])
      })
      .catch(() => {
        if (!ignore) setPosts([])
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false)   // 답이 오면(성공이든 실패든) "기다리는 중" 끝
          setHasLoaded(true)  // 처음 한 번은 받아왔다고 기억
        }
      })

    return () => {
      ignore = true
    }
  }, [tag])

  // 1. 제목 또는 내용 검색 (공백 제거, 대소문자 무시)
  const keyword = search.trim().toLowerCase()
  const searchedPosts = keyword
    ? posts.filter((post) => (post.title ?? '').toLowerCase().includes(keyword) || (post.content ?? '').toLowerCase().includes(keyword))
    : posts

  // 2. 진행 중인 사연만 보기
  const filteredPosts = ongoingOnly
    ? searchedPosts.filter((post) => new Date(post.vote_ends_at) > new Date())
    : searchedPosts

  // 투표 많은 순: 복사본을 response_count 기준으로 정렬 (원본 posts는 그대로 둠)
  // 최신순: API가 준 순서 그대로 보여 줌
  const sortedPosts =
    sort === 'popular'
      ? [...filteredPosts].sort((a, b) => (b.response_count || 0) - (a.response_count || 0))
      : filteredPosts

  // 정렬이 끝난 목록에서 가장 HOT한 사연을 맨 앞(큰 칸)으로
  // (나중에 검색·토글이 생겨도 "거르기 → 정렬 → HOT 맨 앞" 순서가 되도록 화면에 그리기 직전에 둠)
  const displayPosts = moveHotFirst(sortedPosts)

  return (
    <main style={{ maxWidth: 'none' }}>
      {/* 캐치프레이즈: 고백(告白) + Go back(되돌리다) */}
      <section className="hero" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ flex: '1 1 360px', minWidth: 0 }}>
          <h1>당신의 사연을 <em>고백</em>해주세요.</h1>
          <p>후회를 되돌려 드립니다.</p>
        </div>
        <label style={{ ...searchBoxStyle, flex: narrow ? '1 1 100%' : '0 1 320px', width: narrow ? '100%' : 320, maxWidth: '100%' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" aria-hidden="true" style={{ flexShrink: 0 }}>
            <circle cx="11" cy="11" r="7" />
            <path d="m16 16 4 4" />
          </svg>
          <input type="search" aria-label="제목이나 내용으로 검색" placeholder="제목이나 내용으로 검색" value={search} onChange={(e) => setSearch(e.target.value)} style={searchInputStyle} />
        </label>
      </section>

      {/* 카테고리 왼쪽, 정렬 버튼 오른쪽 배치 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '6px',
        }}
      >
        <div className="tags" style={{ marginBottom: 0 }}>
          {TAGS.map((t) => (
            <button key={t} onClick={() => setTag(t)} className={t === tag ? 'active' : ''}>
              {t}
            </button>
          ))}
        </div>

        <div className="tags" style={{ marginBottom: 0 }}>
          <button type="button" className={ongoingOnly ? 'active' : ''} aria-pressed={ongoingOnly} onClick={() => setOngoingOnly(!ongoingOnly)}>
            진행 중만
          </button>
          {SORTS.map((s) => (
            <button
              key={s.key}
              onClick={() => setSort(s.key)}
              className={s.key === sort ? 'active' : ''}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {loading && !hasLoaded && <p>불러오는 중...</p>}
      {!loading && displayPosts.length === 0 && <p>{keyword || ongoingOnly ? '검색 결과가 없어요' : '사연이 없어요.'}</p>}
      {displayPosts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </main>
  )
}
