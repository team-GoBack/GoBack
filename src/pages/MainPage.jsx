
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

export default function MainPage() {
  const [posts, setPosts] = useState([])     // 받아온 사연 목록을 기억하는 곳
  const [loading, setLoading] = useState(true) // 지금 데이터를 기다리는 중인지 기억하는 곳
  const [hasLoaded, setHasLoaded] = useState(false) // 처음 한 번이라도 받아왔는지 기억하는 곳
  const [tag, setTag] = useState('전체')      // 지금 고른 카테고리
  const [sort, setSort] = useState('latest') // 지금 고른 정렬 방식

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

  // 투표 많은 순: 복사본을 response_count 기준으로 정렬 (원본 posts는 그대로 둠)
  // 최신순: API가 준 순서 그대로 보여 줌
  const sortedPosts =
    sort === 'popular'
      ? [...posts].sort((a, b) => (b.response_count || 0) - (a.response_count || 0))
      : posts

  return (
    <main>
      {/* 캐치프레이즈: 고백(告白) + Go back(되돌리다) */}
      <section className="hero">
        <h1>당신의 사연을 <em>고백</em>해주세요.</h1>
        <p>후회를 되돌려 드립니다.</p>
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
      {!loading && sortedPosts.length === 0 && <p>사연이 없어요.</p>}
      {sortedPosts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </main>
  )
}
