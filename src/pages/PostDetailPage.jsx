 // [프론트 팀] 사연 상세 페이지 (선택지, 투표·댓글, 블라인드, 궁금해요 구현)
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { formatDateTime } from '../utils/date.js'
import { getPost, getOptions, getFinish } from '../api/posts.js'
import { getCurrentUser, onAuthChange } from '../api/auth.js'
import {
  getMyStatus,
  respond,
  peek,
  getResults,
  getResponses,
} from '../api/responses.js'
import VoteResults from '../components/VoteResults.jsx'
import ResponseList from '../components/ResponseList.jsx'
import VoteForm from '../components/VoteForm.jsx'
import VoteTimer from '../components/VoteTimer.jsx'
import PostActions from '../components/PostActions.jsx'
import EpilogueSection from '../components/EpilogueSection.jsx'
import PostFinish from '../components/PostFinish.jsx'
import RecommendButton from '../components/RecommendButton.jsx'
import AiAnswerCard from '../components/AiAnswerCard.jsx'

const detailCardStyle = {
  padding: '24px',
  border: '1px solid var(--card-border)',
  borderRadius: '20px',
  background: 'var(--card)',
  boxShadow: 'var(--shadow)',
  backdropFilter: 'blur(14px) saturate(140%)',
  WebkitBackdropFilter: 'blur(14px) saturate(140%)',
}

// 상세 카드 상단의 카테고리·참여 상태 태그 공통 스타일
const detailTagStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '30px',
  padding: '6px 12px',
  border: '1px solid var(--border)',
  borderRadius: '999px',
  background: 'var(--card)',
  color: 'var(--muted)',
  fontSize: '13px',
  fontWeight: 500,
  lineHeight: 1.2,
  whiteSpace: 'nowrap',
}

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

  // 미션 6: 마감 후 사연자의 최종 선택 및 Best Pick 조회 결과
  const [finishState, setFinishState] = useState(null)
  const isFinishReady = Boolean(
    status?.isClosed &&
    finishState?.postId === id &&
    finishState?.authUserId === authUserId
  )
  const finish = isFinishReady ? finishState.data : null

  // 댓글 조회 실패를 실제 댓글 0개로 오인하지 않도록 결과와 비교
  const hasCompleteResults =
    options.length > 0 &&
    options.every((option) => results.some((result) => result.option_id === option.id)) &&
    results.reduce((sum, result) => sum + result.count, 0) === responses.length

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
    setFinishState(null)

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
      status?.isClosed ? getFinish(id) : Promise.resolve(null),
    ])
      .then(([resultData, responseData, finishData]) => {
        if (cancelled) return

        setResults(resultData)
        setResponses(responseData)
        if (status?.isClosed) {
          setFinishState({ postId: id, authUserId, data: finishData })
        }
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
  }, [id, status?.canSeeResponses, status?.isClosed, authUserId])

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

  // 미션 5: 마감 시각이 되면 서버에서 최신 참여 상태 확인
  async function handleVoteExpire() {
    try {
      const latestStatus = await getMyStatus(id)
      setStatus(latestStatus)
    } catch (error) {
      console.error('투표 마감 상태 갱신 실패:', error)
    }
  }

  // 투표할 수 없는 이유 안내
  function getVoteNotice() {
    // 마감된 사연은 로그인 여부보다 마감 안내를 우선 표시
    if (status.isClosed) return '투표가 마감되었습니다.'
    if (!isLoggedIn) return '로그인 후 투표하실 수 있습니다.'
    if (status.isAuthor) return '본인이 작성한 사연에는 투표할 수 없습니다.'
    if (status.hasResponded) return '이미 투표에 참여한 사연입니다.'
    if (status.hasPeeked) return '궁금해요를 사용한 사연에는 투표할 수 없습니다.'
    return '현재 투표할 수 없습니다.'
  }

  // 참여 상태 아이콘: 마감 상태를 우선하고 기존 참여 문구는 유지
  function getParticipationColor() {
    if (!status || status.isClosed) return 'var(--muted)'
    if (status.isAuthor) return 'var(--info)'
    if (status.hasResponded) return 'var(--success)'
    if (status.hasPeeked) return 'var(--warning)'
    return 'var(--muted)'
  }

  function getParticipationIcon() {
    if (!status) return null

    let shape = <circle cx="12" cy="12" r="9" strokeDasharray="2 3.65" />

    if (status.isClosed) {
      shape = (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M8 12h8" />
        </>
      )
    } else if (status.isAuthor) {
      shape = (
        <>
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="9" r="3" />
          <path d="M5.5 18c.8-3 3-4.5 6.5-4.5s5.7 1.5 6.5 4.5" />
        </>
      )
    } else if (status.hasResponded) {
      shape = (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="m8 12 2.5 2.5L16 9" />
        </>
      )
    } else if (status.hasPeeked) {
      shape = (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M9.1 9a3 3 0 1 1 5.8 1c-.8 1.5-2.9 1.9-2.9 3.8" />
          <path d="M12 17h.01" />
        </>
      )
    }

    return (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        style={{ flexShrink: 0 }}
      >
        {shape}
      </svg>
    )
  }

  // 사연에 참여한 기록과 마감 여부를 함께 표시
  function getParticipationNotice() {
    if (!status) return '참여 상태를 확인할 수 없습니다.'

    let participation = '미참여'
    if (status.isAuthor) participation = '내 사연'
    else if (status.hasResponded) participation = '투표 완료'
    else if (status.hasPeeked) participation = '궁금해요 사용'

    return status.isClosed ? `${participation} · 마감` : participation
  }

  if (isLoading) return <main><p>불러오는 중입니다...</p></main>
  if (!post) return <main><p>사연을 불러올 수 없습니다.</p></main>

  return (
    <main style={{ paddingBottom: '32px' }}>
      {/* 사연 본문 카드: 투표 마감 시각 및 남은 시간 표시 */}
      <section style={{ ...detailCardStyle, marginBottom: '18px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px 12px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '6px 10px',
              minWidth: 0,
            }}
          >
            <span className="tag" style={detailTagStyle}>{post.tag}</span>
            {/* 미션 7: 사연 작성 시각 표시 */}
            {post.created_at && (
              <time
                dateTime={post.created_at}
                style={{ color: 'var(--muted)', fontSize: '13px' }}
              >
                {formatDateTime(post.created_at)} 작성
              </time>
            )}
          </div>
          <span
            style={{
              ...detailTagStyle,
              padding: 0,
              border: 'none',
              background: 'transparent',
              gap: '6px',
              color: getParticipationColor(),
              fontSize: '14px',
              fontWeight: 600,
              marginLeft: 'auto',
            }}
          >
            {getParticipationIcon()}
            {getParticipationNotice()}
          </span>
        </div>
        <h2
          style={{
            margin: '14px 0 12px',
            lineHeight: 1.45,
            wordBreak: 'keep-all',
            overflowWrap: 'anywhere',
          }}
        >
          {post.title}
        </h2>
        <p
          style={{
            margin: '22px 0',
            lineHeight: 1.85,
            whiteSpace: 'pre-wrap',
            wordBreak: 'keep-all',
            overflowWrap: 'anywhere',
            color: 'var(--ink)',
          }}
        >
          {post.content}
        </p>
        <RecommendButton key={id} postId={id} />
        {/* 투표하면(결과를 볼 수 있게 되면) 다시 불러오도록 key에 포함 */}
        <AiAnswerCard
          key={`ai-${id}-${Boolean(status?.canSeeResponses)}`}
          postId={id}
          responseCount={post.response_count}
          isAuthor={Boolean(status?.isAuthor)}
        />
        {post.vote_ends_at && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '8px 16px',
              paddingTop: '14px',
              borderTop: '1px solid var(--border)',
            }}
          >
            {/* 남은 시간은 눈에 잘 띄게, 정확한 마감 시각은 보조 정보로 표시 */}
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--ink)',
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--muted)"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
              </svg>
              {status?.isClosed ? '마감됨' : <VoteTimer voteEndsAt={post.vote_ends_at} onExpire={handleVoteExpire} />}
            </span>
            <time
              dateTime={post.vote_ends_at}
              style={{ color: 'var(--muted)', fontSize: '13px' }}
            >
              {formatDateTime(post.vote_ends_at)} 마감
            </time>
          </div>
        )}

        <PostActions
          post={post}
          status={status}
          onUpdated={(changes) =>
            setPost((prev) => ({ ...prev, ...changes }))
          }
        />
      </section>

      <section style={detailCardStyle}>
        {!status ? (
          <p>투표 상태를 확인할 수 없습니다.</p>
        ) : !status.canSeeResponses ? (
          <VoteForm
            options={options}
            selectedOptionId={selectedOptionId}
            setSelectedOptionId={setSelectedOptionId}
            comment={comment}
            setComment={setComment}
            status={status}
            isLoggedIn={isLoggedIn}
            isSubmitting={isSubmitting}
            isPeeking={isPeeking}
            handleSubmit={handleSubmit}
            handlePeek={handlePeek}
            getVoteNotice={getVoteNotice}
          />
        ) : (
          <>
            {/* 미션 3: 투표 결과 및 댓글 블라인드 */}
            {isResultsLoading ? (
              <p>투표 결과와 댓글을 불러오는 중입니다...</p>
            ) : (
              <>
                <VoteResults
                  results={results}
                  authorOptionId={finish?.chosen_option_id}
                  myOptionId={
                    isLoggedIn && status?.hasResponded
                    ? responses.find((response) => response.is_mine)?.option_id
                    : undefined
                  }
              />

                <ResponseList
                  responses={responses}
                  options={options}
                  bestResponseId={finish?.best_response_id}
                />

                {/* 미션 6: 마감된 내 사연에서만 한 번 마무리 가능 */}
                {isLoggedIn && status.isAuthor && status.isClosed && !finish && (
                  <div
                    style={{
                      marginTop: '26px',
                      paddingTop: '24px',
                      borderTop: '1px solid var(--border)',
                    }}
                  >
                    {isFinishReady && hasCompleteResults ? (
                      <PostFinish
                        key={id}
                        postId={id}
                        options={options}
                        responses={responses}
                        onFinished={(data) =>
                          setFinishState({ postId: id, authUserId, data })
                        }
                      />
                    ) : (
                      <p style={{ color: 'var(--muted)', margin: 0 }}>
                        마무리 정보를 확인하지 못했습니다. 새로고침 후 다시 시도해 주세요.
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {message && (
          <p role="status" style={{ margin: '16px 0 0', color: 'var(--muted)' }}>
            {message}
          </p>
        )}
      </section>

      {/* 후일담: 마감 전엔 약속 안내, 마감 후엔 타임라인 + 사연자 쓰기 */}
      <EpilogueSection post={post} status={status} />
    </main>
  )
}
