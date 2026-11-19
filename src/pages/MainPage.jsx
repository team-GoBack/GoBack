// [프론트 팀] 메인 페이지: 사연 목록
// 흐름: 화면이 열림 → getPosts()로 주문 → 받은 사연을 정렬해서 카드로 그림
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
  const [tag, setTag] = useState('전체')      // 지금 고른 카테고리
  const [sort, setSort] = useState('latest') // 지금 고른 정렬 방식

  // tag가 바뀔 때마다 주문 창구에 다시 주문
  useEffect(() => {
    getPosts(tag === '전체' ? null : tag).then(setPosts)
  }, [tag])

  // 받아온 목록을 복사해서 순서만 바꿈 (원본 posts는 그대로 둠)
  const sortedPosts = [...posts].sort((a, b) => {
    if (sort === 'popular') {
      return (b.response_count || 0) - (a.response_count || 0)
    }
    return new Date(b.created_at) - new Date(a.created_at)
  })

  return (
    <main>
      <div className="tags">
        {TAGS.map((t) => (
          <button key={t} onClick={() => setTag(t)} className={t === tag ? 'active' : ''}>
            {t}
          </button>
        ))}
      </div>

      <div className="tags">
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

      {sortedPosts.length === 0 && <p>사연이 없어요.</p>}
      {sortedPosts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </main>
  )
}
