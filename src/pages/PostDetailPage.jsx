
 // [프론트 팀] 사연 상세 페이지 (선택지, 투표·댓글, 블라인드, 궁금해요 구현)
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getPost, getOptions } from '../api/posts.js'
import { getCurrentUser, onAuthChange } from '../api/auth.js'
import {
  getMyStatus,
  respond,
  peek,
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
  const [isPeeking, setIsPeeking] = useState(false)

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

    if (!isLoggedIn || !status?.canVote || isSubmitting || isPeeking) return

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

  // 미션 4: 궁금해요 사용 시 투표 권한 포기 후 결과 공개
  async function handlePeek() {
    if (!status || isPeeking || isSubmitting) return

    if (!isLoggedIn) {
      setMessage('로그인 후 이용해 주세요.')
      return
    }

    if (!status.canVote) {
      setMessage(getVoteNotice())
      return
    }

    // 궁금해요 사용 기록은 되돌릴 수 없으므로 먼저 확인
    const confirmed = window.confirm(
      '궁금해요를 사용하면 투표 결과와 댓글을 볼 수 있지만,\n' +
      '이 사연에는 더 이상 투표하거나 댓글을 작성할 수 없습니다.\n\n' +
      '계속하시겠습니까?'
    )

    if (!confirmed) return

    setIsPeeking(true)
    setMessage('')

    try {
      const result = await peek(id)

      if (result.ok) {
        setStatus((prev) => ({
          ...prev,
          hasPeeked: true,
          canVote: false,
          canSeeResponses: true,
        }))

        setSelectedOptionId(null)
        setComment('')
        setMessage('궁금해요를 사용했습니다. 투표 결과와 댓글을 확인할 수 있습니다.')
      } else {
        const errorMessages = {
          login: '로그인 후 이용해 주세요.',
          author: '본인이 작성한 사연에는 궁금해요를 사용할 수 없습니다.',
          already: '이미 투표했거나 궁금해요를 사용한 사연입니다.',
          error: '궁금해요 처리에 실패했습니다. 다시 시도해 주세요.',
        }

        setMessage(
          errorMessages[result.reason] ??
          '궁금해요 처리 중 오류가 발생했습니다.'
        )

        // 실패한 경우 서버의 최신 상태를 다시 확인
        const latestStatus = await getMyStatus(id)
        setStatus(latestStatus)

        if (result.reason === 'login') setIsLoggedIn(false)
      }
    } catch (error) {
      console.error('궁금해요 처리 실패:', error)
      setMessage('오류가 발생했습니다. 잠시 후 다시 시도해 주세요.')
    } finally {
      setIsPeeking(false)
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
            disabled={!isLoggedIn || !status?.canVote || isSubmitting || isPeeking}
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
              cursor: isLoggedIn && status?.canVote && !isPeeking
                ? 'pointer'
                : 'default',
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

            <button
              type="submit"
              disabled={isSubmitting || isPeeking}
            >
              {isSubmitting ? '제출 중...' : '투표와 댓글 등록'}
            </button>
          </form>
        ) : (
          <p>{getVoteNotice()}</p>
        )}

        {/* 미션 4: 투표하지 않은 사용자의 궁금해요 버튼 */}
        {status &&
          !status.isAuthor &&
          !status.hasResponded &&
          !status.hasPeeked &&
          !status.isClosed && (
            <button
              type="button"
              onClick={handlePeek}
              disabled={isPeeking || isSubmitting}
              style={{
                marginTop: '12px',
                padding: '10px 18px',
                border: '1px solid #aaa',
                borderRadius: '8px',
                backgroundColor: '#fff',
                color: '#222',
                cursor: isPeeking ? 'default' : 'pointer',
              }}
            >
              {isPeeking ? '처리 중...' : '궁금해요'}
            </button>
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
        TODO: 타이머
      </p>
    </main>
  )
}
