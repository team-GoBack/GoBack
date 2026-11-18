
 // [프론트 팀] 사연 상세 페이지 (선택지 표시, 투표·댓글 작성 구현)
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getPost, getOptions } from '../api/posts.js'
import { getCurrentUser } from '../api/auth.js'
import { getMyStatus, respond } from '../api/responses.js'

export default function PostDetailPage() {
  const { id } = useParams()

  const [post, setPost] = useState(null)
  const [options, setOptions] = useState([])
  const [status, setStatus] = useState(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const [selectedOptionId, setSelectedOptionId] = useState(null)
  const [comment, setComment] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false

    setIsLoading(true)
    setSelectedOptionId(null)
    setComment('')
    setMessage('')

    Promise.all([
      getPost(id),
      getOptions(id),
      getMyStatus(id),
      getCurrentUser(),
    ])
      .then(([postData, optionData, myStatus, user]) => {
        if (cancelled) return

        setPost(postData)
        setOptions(optionData)
        setStatus(myStatus)
        setIsLoggedIn(Boolean(user))
      })
      .catch((error) => {
        console.error('사연 상세 정보 불러오기 실패:', error)
        if (!cancelled) {
          setMessage('정보를 불러오지 못했습니다. 새로고침 후 다시 시도해 주세요.')
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [id])

  // 선택지와 댓글을 함께 제출
  async function handleSubmit(event) {
    event.preventDefault()

    if (!status?.canVote || isSubmitting) return

    if (selectedOptionId === null) {
      setMessage('선택지를 하나 선택해 주세요.')
      return
    }

    if (!comment.trim()) {
      setMessage('댓글을 입력해 주세요.')
      return
    }

    setIsSubmitting(true)
    setMessage('')

    try {
      const result = await respond(id, selectedOptionId, comment)

      if (result.ok) {
        setStatus((prev) => ({
          ...prev,
          hasResponded: true,
          canVote: false,
          canSeeResponses: true,
        }))
        setMessage('투표와 댓글이 정상적으로 등록되었습니다.')
      } else {
        const errorMessages = {
          login: '로그인 후 이용해 주세요.',
          author: '본인이 작성한 사연에는 투표할 수 없습니다.',
          already: '이미 투표에 참여한 사연입니다.',
          peeked: '궁금해요를 사용한 사연에는 투표할 수 없습니다.',
          closed: '투표가 마감되었습니다.',
          empty: '댓글을 입력해 주세요.',
          error: '투표 등록에 실패했습니다. 다시 시도해 주세요.',
        }

        setMessage(errorMessages[result.reason] ?? '투표 처리 중 오류가 발생했습니다.')

        const latestStatus = await getMyStatus(id)
        setStatus(latestStatus)
        if (result.reason === 'login') setIsLoggedIn(false)
      }
    } catch (error) {
      console.error('투표 제출 실패:', error)
      setMessage('오류가 발생했습니다. 잠시 후 다시 시도해 주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 투표할 수 없는 이유 안내
  function getVoteNotice() {
    if (!isLoggedIn) return '로그인 후 이용해 주세요.'
    if (status.isAuthor) return '본인이 작성한 사연에는 투표할 수 없습니다.'
    if (status.hasResponded) return '이미 투표에 참여한 사연입니다.'
    if (status.hasPeeked) return '궁금해요를 사용한 사연에는 투표할 수 없습니다.'
    if (status.isClosed) return '투표가 마감되었습니다.'
    return '현재 투표할 수 없습니다.'
  }

  if (isLoading) return <main><p>불러오는 중입니다...</p></main>
  if (!post) return <main><p>사연을 불러올 수 없습니다.</p></main>

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
            disabled={!status?.canVote || isSubmitting}
            onClick={() => setSelectedOptionId(option.id)}
            style={{
              display: 'block',
              width: '100%',
              padding: '14px 16px',
              marginBottom: '10px',
              textAlign: 'left',
              border: selectedOptionId === option.id
                ? '2px solid #555'
                : '1px solid #ddd',
              borderRadius: '8px',
              backgroundColor: selectedOptionId === option.id
                ? '#f1f1f1'
                : '#fff',
              color: '#222',
              opacity: 1,
              cursor: status?.canVote ? 'pointer' : 'default',
            }}
          >
            {option.label}
          </button>
        ))}

        {!status ? (
          <p>투표 상태를 확인할 수 없습니다.</p>
        ) : status.canVote ? (
          <form onSubmit={handleSubmit}>
            <label htmlFor="vote-comment">내 경험이나 의견</label>

            <textarea
              id="vote-comment"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="선택한 이유나 경험을 작성해 주세요."
              rows={4}
              style={{
                display: 'block',
                width: '100%',
                boxSizing: 'border-box',
                padding: '12px',
                marginTop: '10px',
                marginBottom: '10px',
              }}
            />

            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? '제출 중...' : '투표와 댓글 등록'}
            </button>
          </form>
        ) : (
          <p>{getVoteNotice()}</p>
        )}

        {message && <p role="status">{message}</p>}
      </section>

      <p className="todo">
        TODO: 투표 결과·댓글 목록, 궁금해요, 타이머
      </p>
    </main>
  )
}
