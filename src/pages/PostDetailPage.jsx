
 // [프론트 팀] 사연 상세 페이지 (선택지 표시, 투표·댓글 작성 구현)
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getPost, getOptions } from '../api/posts.js'
import { getCurrentUser, onAuthChange } from '../api/auth.js'
import {
  getMyStatus,
  respond,
  getResults,
  getResponses,
} from '../api/responses.js'

export default function PostDetailPage() {
  const { id } = useParams()

  const [post, setPost] = useState(null)
  const [options, setOptions] = useState([])
  const [status, setStatus] = useState(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [authUserId, setAuthUserId] = useState(undefined)

  const [selectedOptionId, setSelectedOptionId] = useState(null)
  const [comment, setComment] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 블라인드 해제 후 보여줄 투표 결과와 댓글
  const [results, setResults] = useState([])
  const [responses, setResponses] = useState([])
  const [isResultsLoading, setIsResultsLoading] = useState(false)

  // 로그인·로그아웃 등 인증 상태 변경 감지
  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setIsLoggedIn(Boolean(user))
      setAuthUserId(user?.id ?? null)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  // 사연 정보와 현재 사용자의 투표 상태 불러오기
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
  }, [id, authUserId])

  // 결과를 볼 수 있는 경우에만 투표 결과와 댓글 불러오기
  useEffect(() => {
    let cancelled = false

    setResults([])
    setResponses([])

    if (!status?.canSeeResponses) {
      setIsResultsLoading(false)
      return () => {
        cancelled = true
      }
    }

    setIsResultsLoading(true)

    Promise.all([
      getResults(id),
      getResponses(id),
    ])
      .then(([resultData, responseData]) => {
        if (cancelled) return

        setResults(resultData)
        setResponses(responseData)
      })
      .catch((error) => {
        console.error('투표 결과 및 댓글 불러오기 실패:', error)
      })
      .finally(() => {
        if (!cancelled) setIsResultsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [id, status?.canSeeResponses, authUserId])

  // 선택지와 댓글을 함께 제출
  async function handleSubmit(event) {
    event.preventDefault()

    if (!isLoggedIn || !status?.canVote || isSubmitting) return

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
    // 마감된 사연은 로그인 여부보다 마감 안내를 우선 표시
    if (status.isClosed) return '투표가 마감되었습니다.'
    if (!isLoggedIn) return '로그인 후 이용해 주세요.'
    if (status.isAuthor) return '본인이 작성한 사연에는 투표할 수 없습니다.'
    if (status.hasResponded) return '이미 투표에 참여한 사연입니다.'
    if (status.hasPeeked) return '궁금해요를 사용한 사연에는 투표할 수 없습니다.'
    return '현재 투표할 수 없습니다.'
  }

  // 선택지 ID로 선택지 이름 찾기
  function getOptionLabel(optionId) {
    return options.find((option) => option.id === optionId)?.label ?? '선택지'
  }

  const totalVotes = results.reduce((sum, result) => sum + result.count, 0)

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
            disabled={!isLoggedIn || !status?.canVote || isSubmitting}
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
              cursor: isLoggedIn && status?.canVote ? 'pointer' : 'default',
            }}
          >
            {option.label}
          </button>
        ))}

        {!status ? (
          <p>투표 상태를 확인할 수 없습니다.</p>
        ) : isLoggedIn && status.canVote ? (
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

      {/* 미션 3: 투표 결과 및 댓글 블라인드 */}
      <section style={{ marginTop: '32px' }}>
        {!status ? (
          <p>투표 상태를 확인하는 중입니다.</p>
        ) : !status.canSeeResponses ? (
          <p>
            투표에 참여하면 다른 사람들의 선택과 댓글을 확인할 수 있습니다.
          </p>
        ) : isResultsLoading ? (
          <p>투표 결과와 댓글을 불러오는 중입니다...</p>
        ) : (
          <>
            <h3>투표 결과</h3>

            {results.length === 0 ? (
              <p>아직 투표 결과가 없습니다.</p>
            ) : (
              results.map((result) => {
                const percentage = totalVotes > 0
                  ? Math.round((result.count / totalVotes) * 100)
                  : 0

                return (
                  <div key={result.option_id} style={{ marginBottom: '16px' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '6px',
                      }}
                    >
                      <span>{result.label}</span>
                      <span>{result.count}표 ({percentage}%)</span>
                    </div>

                    <div
                      style={{
                        width: '100%',
                        height: '12px',
                        backgroundColor: '#e5e5e5',
                        borderRadius: '6px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        role="progressbar"
                        aria-label={`${result.label} 투표 비율`}
                        aria-valuenow={percentage}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        style={{
                          width: `${percentage}%`,
                          height: '100%',
                          backgroundColor: '#777',
                          borderRadius: '6px',
                        }}
                      />
                    </div>
                  </div>
                )
              })
            )}

            <h3 style={{ marginTop: '28px' }}>댓글</h3>

            {responses.length === 0 ? (
              <p>아직 작성된 댓글이 없습니다.</p>
            ) : (
              responses.map((response) => (
                <article
                  key={response.id}
                  style={{
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    padding: '14px',
                    marginBottom: '10px',
                  }}
                >
                  <p style={{ marginTop: 0, fontWeight: 'bold' }}>
                    {response.is_mine ? '나' : '익명'}
                    {' · '}
                    {getOptionLabel(response.option_id)}
                  </p>
                  <p style={{ marginBottom: 0 }}>
                    {response.content}
                  </p>
                </article>
              ))
            )}
          </>
        )}
      </section>

      <p className="todo">
        TODO: 궁금해요, 타이머
      </p>
    </main>
  )
}
