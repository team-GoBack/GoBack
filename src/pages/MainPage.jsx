// [프론트 팀] 메인 페이지: 사연 목록
// 흐름: 화면이 열림 → getPosts()로 주문 → 받은 사연을 카드로 그림
import { useEffect, useState } from 'react'
import { getPosts } from '../api/posts.js'
import PostCard from '../components/PostCard.jsx'

const TAGS = ['전체', '연애', '입시', '기타']

export default function MainPage() {
  const [posts, setPosts] = useState([])     // 받아온 사연 목록을 기억하는 곳
  const [tag, setTag] = useState('전체')      // 지금 고른 카테고리

  // tag가 바뀔 때마다 주문 창구에 다시 주문
  useEffect(() => {
    getPosts(tag === '전체' ? null : tag).then(setPosts)
  }, [tag])

  return (
    <main>
      <div className="tags">
        {TAGS.map((t) => (
          <button key={t} onClick={() => setTag(t)} className={t === tag ? 'active' : ''}>
            {t}
          </button>
        ))}
      </div>

      {posts.length === 0 && <p>사연이 없어요.</p>}
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </main>
  )
}
