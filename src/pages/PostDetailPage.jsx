// [프론트 팀] 사연 상세 페이지 (지금은 본문만. 투표·댓글은 여기에 추가 예정)
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getPost } from '../api/posts.js'

export default function PostDetailPage() {
  const { id } = useParams()          // 주소 /posts/3 에서 3을 꺼냄
  const [post, setPost] = useState(null)

  useEffect(() => {
    getPost(id).then(setPost)
  }, [id])

  if (!post) return <main><p>불러오는 중...</p></main>

  return (
    <main>
      <span className="tag">{post.tag}</span>
      <h2>{post.title}</h2>
      <p>{post.content}</p>
      <p className="todo">TODO: 투표+댓글, 궁금해요, 타이머</p>
    </main>
  )
}
