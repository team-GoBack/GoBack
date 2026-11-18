// [프론트 팀] 사연 카드 한 장 (화면 조각)
// props로 사연 하나(post)를 받아서 카드 모양으로 보여줌
import { Link } from 'react-router-dom'

// 마감 시각을 받아서 "3시간 남음" 같은 글자로 바꿔주는 함수
function getRemainingText(endsAt) {
  const diff = new Date(endsAt) - new Date() // 마감까지 남은 시간 (밀리초)

  if (diff <= 0) return '마감됨'

  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days >= 1) return `${days}일 남음`
  if (hours >= 1) return `${hours}시간 남음`
  if (minutes >= 1) return `${minutes}분 남음`
  return '곧 마감'
}

export default function PostCard({ post }) {
  return (
    <Link to={`/posts/${post.id}`} className="post-card">
      <span className="tag">{post.tag}</span>
      <h3>{post.title}</h3>
      <p>{post.content}</p>
      <small>투표 {post.response_count}명 · {getRemainingText(post.vote_ends_at)}</small>
    </Link>
  )
}
