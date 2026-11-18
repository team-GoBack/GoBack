// [프론트 팀] 사연 상세 페이지 (선택지 표시 완료, 투표·댓글 구현 예정)
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getPost, getOptions } from '../api/posts.js'

export default function PostDetailPage() {
  const { id } = useParams()

  const [post, setPost] = useState(null)
  const [options, setOptions] = useState([])

  useEffect(() => {
    getPost(id).then(setPost)
    getOptions(id).then(setOptions)
  }, [id])

  if (!post) return <main><p>불러오는 중...</p></main>

  return (
    <main>
      <span className="tag">{post.tag}</span>
      <h2>{post.title}</h2>
      <p>{post.content}</p>

      <section>
        <h3>여러분이라면 어떻게 하시겠어요?</h3>

        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            disabled
            style={{
              display: 'block',
              width: '100%',
              padding: '14px 16px',
              marginBottom: '10px',
              textAlign: 'left',
              border: '1px solid #ddd',
              borderRadius: '8px',
              backgroundColor: '#fff',
              color: '#222',
              opacity: 1,
            }}
          >
            {option.label}
          </button>
        ))}
      </section>

      <p className="todo">TODO: 투표+댓글, 궁금해요, 타이머</p>
    </main>
  )
}
