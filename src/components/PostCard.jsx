// [프론트 팀] 사연 카드 한 장 (화면 조각)
// props로 사연 하나(post)를 받아서 카드 모양으로 보여줌
import { Link } from 'react-router-dom'

export default function PostCard({ post }) {
  return (
    <Link to={`/posts/${post.id}`} className="post-card">
      <span className="tag">{post.tag}</span>
      <h3>{post.title}</h3>
      <p>{post.content}</p>
      <small>투표 {post.response_count}명 · 마감 {new Date(post.vote_ends_at).toLocaleString('ko-KR')}</small>
    </Link>
  )
}
