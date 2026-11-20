// [프론트 팀] 릴스 페이지: 랜덤 사연을 한 장씩 넘겨 보기 (담당: 박준석, 미션 5)
// 흐름: 화면이 열림 → getPosts()로 사연을 받음 → 섞어서 한 장씩 보여줌
// ※ 카드에는 제목·내용·태그·남은 시간만. 투표 결과·댓글은 절대 넣지 않기 (블라인드 규칙)
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPosts } from '../api/posts.js'

// 헤더가 차지하는 높이(px). 화면이 같이 스크롤되면 이 숫자를 조절해요.
const HEADER_HEIGHT = 60

// 배열을 랜덤으로 섞은 "복사본"을 돌려줌 (원본은 그대로)
function shuffle(list) {
  const copy = [...list]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

// 마감 시각을 "3시간 남음" 같은 사람 말로 바꿈
function timeLeft(endsAt) {
  if (!endsAt) return ''
  const diff = new Date(endsAt).getTime() - Date.now()
  if (Number.isNaN(diff)) return ''
  if (diff <= 0) return '마감됨'

  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${Math.max(minutes, 1)}분 남음`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}시간 남음`

  return `${Math.floor(hours / 24)}일 남음`
}

export default function ReelsPage() {
  const navigate = useNavigate()
  const [posts, setPosts] = useState([])       // 섞어 놓은 사연 목록
  const [loading, setLoading] = useState(true) // 지금 데이터를 기다리는 중인지

  // 화면이 처음 열릴 때 딱 한 번 주문하고, 받은 사연을 섞어서 기억해 둠
  useEffect(() => {
    let ignore = false // 화면을 떠난 뒤 늦게 온 답이 덮어쓰지 않게 하는 표시

    getPosts()
      .then((result) => {
        if (!ignore) setPosts(shuffle(result || []))
      })
      .catch(() => {
        if (!ignore) setPosts([])
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })

    return () => {
      ignore = true
    }
  }, [])

  if (loading) return <main><p>불러오는 중...</p></main>
  if (posts.length === 0) return <main><p>사연이 없어요.</p></main>

  return (
    <main
      style={{
        height: `calc(100vh - ${HEADER_HEIGHT}px)`, // 화면 높이만큼
        overflowY: 'auto',                          // 위아래로 스크롤
        scrollSnapType: 'y mandatory',              // 카드 단위로 딱딱 멈춤
      }}
    >
      {posts.map((post) => (
        <section
          key={post.id}
          style={{
            height: '100%',            // 카드 한 장 = 화면 한 장
            boxSizing: 'border-box',
            padding: 16,
            scrollSnapAlign: 'start',  // 카드 윗부분에 맞춰 멈춤
            scrollSnapStop: 'always',  // 빠르게 넘겨도 한 장씩만
          }}
        >
          <div
            role="button"
            tabIndex={0}
            onClick={() => navigate(`/posts/${post.id}`)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') navigate(`/posts/${post.id}`)
            }}
            style={{
              height: '100%',
              boxSizing: 'border-box',
              border: '1px solid #ddd',
              borderRadius: 16,
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: 16,
              cursor: 'pointer',
              overflow: 'hidden',
            }}
          >
            <span style={{ fontSize: 14, opacity: 0.7 }}>#{post.tag}</span>
            <h2 style={{ margin: 0 }}>{post.title}</h2>
            <p
              style={{
                margin: 0,
                display: '-webkit-box',
                WebkitLineClamp: 8,       // 너무 길면 8줄까지만
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {post.content}
            </p>
            <span style={{ fontSize: 14, opacity: 0.7 }}>{timeLeft(post.vote_ends_at)}</span>
          </div>
        </section>
      ))}
    </main>
  )
}
