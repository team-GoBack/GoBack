// [프론트 팀] 릴스 페이지: 랜덤 사연을 화면 가득 한 장씩 넘겨 보기 + 바로 투표 (담당: 박준석, 미션 5)
// 흐름: 화면이 열림 → getPosts()로 사연을 받음 → 섞어서 → 카드를 세로로 쌓고 한 장씩 딱딱 멈추며 스크롤
// 투표: 선택지 선택 → 댓글 작성 → respond()로 등록 → "투표 완료"만 표시 → 다음 카드로 이동
// ※ 투표 수·결과·다른 사람 댓글은 절대 가져오지도, 보여주지도 않기 (블라인드 규칙)
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPosts, getOptions } from '../api/posts.js'
import { getCurrentUser, onAuthChange } from '../api/auth.js'
import { respond } from '../api/responses.js'

// 헤더(약 81px) + 바깥 아래 여백(48px)을 합친 값(px). 창 맨 오른쪽 스크롤바가 남으면 이 숫자를 조절해요.
const RESERVED_HEIGHT = 160

// 투표 실패 이유별 안내 문구 (상세 페이지와 같은 문구)
const VOTE_ERRORS = {
  login: '로그인 후 이용해 주세요.',
  author: '본인이 작성한 사연에는 투표할 수 없습니다.',
  already: '이미 투표에 참여한 사연입니다.',
  peeked: '궁금해요를 사용한 사연에는 투표할 수 없습니다.',
  closed: '투표가 마감되었습니다.',
  empty: '댓글을 입력해 주세요.',
  error: '투표 등록에 실패했습니다. 다시 시도해 주세요.',
}

function shuffle(list) {
  const copy = [...list]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

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

// 카드 한 장: 사연 + 선택지 + 댓글 입력 + 투표 버튼
function ReelCard({ post, isLoggedIn, onVoted }) {
  const navigate = useNavigate()
  const [options, setOptions] = useState([])
  const [selectedOptionId, setSelectedOptionId] = useState(null)
  const [comment, setComment] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [voted, setVoted] = useState(false)

  const left = timeLeft(post.vote_ends_at)
  const closed = left === '마감됨'
  const canSelect = isLoggedIn && !closed && !voted && !isSubmitting

  // 이 사연의 선택지 불러오기
  useEffect(() => {
    let cancelled = false

    getOptions(post.id)
      .then((data) => {
        if (!cancelled) setOptions(data)
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [post.id])

  async function handleSubmit(event) {
    event.preventDefault()
    if (!canSelect) return

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
      const result = await respond(post.id, selectedOptionId, comment)

      if (result.ok) {
        setVoted(true) // 결과는 보여주지 않고 "투표 완료"만 표시
        onVoted()
      } else {
        setMessage(VOTE_ERRORS[result.reason] ?? '투표 처리 중 오류가 발생했습니다.')
      }
    } catch (error) {
      console.error('릴스 투표 실패:', error)
      setMessage('오류가 발생했습니다. 잠시 후 다시 시도해 주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      style={{
        height: '100%',
        boxSizing: 'border-box',
        background: 'var(--card)',
        border: '1px solid var(--card-border)',
        borderRadius: 20,
        boxShadow: 'var(--shadow)',
        backdropFilter: 'blur(14px) saturate(140%)',
        WebkitBackdropFilter: 'blur(14px) saturate(140%)',
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto', // 투표 칸이 길어져도 잘리지 않게 (스크롤바는 숨김)
        scrollbarWidth: 'none',
      }}
    >
      {/* margin: 'auto 0' → 내용이 짧으면 가운데, 길면 위부터 보이게 */}
      <div style={{ margin: 'auto 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* 사연 영역: 누르면 상세 페이지로 이동 */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => navigate(`/posts/${post.id}`)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') navigate(`/posts/${post.id}`)
          }}
          style={{ display: 'flex', flexDirection: 'column', gap: 12, cursor: 'pointer' }}
        >
          <span style={{ fontSize: 14, color: 'var(--muted)' }}>#{post.tag}</span>
          <h2 style={{ margin: 0 }}>{post.title}</h2>
          <p
            style={{
              margin: 0,
              display: '-webkit-box',
              WebkitLineClamp: 5,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {post.content}
          </p>
          <span style={{ fontSize: 14, color: 'var(--muted)' }}>{left}</span>
        </div>

        {/* 투표 영역 */}
        {options.length > 0 &&
          (voted ? (
            <strong>✅ 투표 완료</strong>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {options.map((option) => {
                const isSelected = selectedOptionId === option.id

                return (
                  <button
                    key={option.id}
                    type="button"
                    disabled={!canSelect}
                    aria-pressed={isSelected}
                    onClick={() => setSelectedOptionId(option.id)}
                    style={{
                      padding: '12px 16px',
                      borderRadius: 12,
                      border: '1px solid var(--border)',
                      background: isSelected
                        ? 'color-mix(in srgb, var(--ink) 8%, var(--card))'
                        : 'var(--card)',
                      color: 'var(--ink)',
                      font: 'inherit',
                      textAlign: 'left',
                      opacity: canSelect ? 1 : 0.6,
                      cursor: canSelect ? 'pointer' : 'default',
                    }}
                  >
                    {option.label}
                  </button>
                )
              })}

              {/* 선택지를 고르면 댓글 입력칸과 등록 버튼이 나옴 */}
              {canSelect && selectedOptionId !== null && (
                <>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="선택한 이유나 경험을 작성해 주세요."
                    rows={3}
                    aria-label="내 경험이나 의견"
                    style={{
                      display: 'block',
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: 12,
                      border: '1px solid var(--border)',
                      borderRadius: 12,
                      background: 'var(--card)',
                      color: 'var(--ink)',
                      font: 'inherit',
                      resize: 'none',
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      minHeight: 44,
                      padding: '10px 20px',
                      border: '1px solid var(--primary)',
                      borderRadius: 10,
                      background: 'var(--primary)',
                      color: 'var(--on-primary)',
                      font: 'inherit',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    투표와 댓글 등록
                  </button>
                </>
              )}

              {isSubmitting && <span style={{ fontSize: 14, color: 'var(--muted)' }}>제출 중...</span>}
              {closed && <span style={{ fontSize: 14, color: 'var(--muted)' }}>투표가 마감되었습니다.</span>}
              {!closed && !isLoggedIn && (
                <span style={{ fontSize: 14, color: 'var(--muted)' }}>로그인 후 투표하실 수 있습니다.</span>
              )}
              {message && (
                <span role="status" style={{ fontSize: 14, color: 'var(--muted)' }}>
                  {message}
                </span>
              )}
            </form>
          ))}
      </div>
    </div>
  )
}

export default function ReelsPage() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const sectionRefs = useRef([]) // 카드(section)들을 기억해 두는 곳 (다음 카드로 이동할 때 사용)

  // 사연 목록 불러오기
  useEffect(() => {
    let ignore = false

    getPosts()
      .then((result) => {
                if (!ignore) {
          // 투표가 마감된 사연은 릴스에서 제외
          const openPosts = (result || []).filter((post) => timeLeft(post.vote_ends_at) !== '마감됨')
          setPosts(shuffle(openPosts))
        }

      })
      .catch(() => {})
      .finally(() => {
        if (!ignore) setLoading(false)
      })

    return () => {
      ignore = true
    }
  }, [])

  // 로그인 상태 확인 + 로그인·로그아웃 변화 감지
  useEffect(() => {
    let cancelled = false

    getCurrentUser()
      .then((user) => {
        if (!cancelled) setIsLoggedIn(Boolean(user))
      })
      .catch(() => {})

    const unsubscribe = onAuthChange((user) => {
      setIsLoggedIn(Boolean(user))
    })

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])

  // 투표가 끝나면 0.8초 뒤 다음 카드로 부드럽게 이동
  function goNext(index) {
    setTimeout(() => {
      sectionRefs.current[index + 1]?.scrollIntoView({ behavior: 'smooth' })
    }, 800)
  }

  if (loading) return <main><p>불러오는 중...</p></main>
  if (posts.length === 0) return <main><p>사연이 없어요.</p></main>

  return (
    <main
      style={{
        height: `calc(100dvh - ${RESERVED_HEIGHT}px)`, // dvh: 폰 주소창 높이 변화에 대응
        overflowY: 'auto',
        scrollSnapType: 'y mandatory', // 한 장씩 딱딱 멈추게 함
      }}
    >
      {posts.map((post, index) => (
        <section
          key={post.id}
          ref={(el) => {
            sectionRefs.current[index] = el
          }}
          style={{
            height: '100%',
                      boxSizing: 'border-box',
            padding: 8,
            scrollSnapAlign: 'start',
            scrollSnapStop: 'always', // 세게 굴려도 한 장씩만 넘어감
          }}
        >
          <ReelCard post={post} isLoggedIn={isLoggedIn} onVoted={() => goNext(index)} />
        </section>
      ))}
    </main>
  )
}

