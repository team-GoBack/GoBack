// [프론트 팀] 사연 추천 버튼
import { useEffect, useState } from 'react'
import { getRecommend, toggleRecommend } from '../api/recommends.js'

export default function RecommendButton({ postId }) {
  const [count, setCount] = useState(0)
  const [recommended, setRecommended] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  // 현재 추천 수와 내가 추천했는지 확인
  useEffect(() => {
    let cancelled = false

    setIsLoading(true)
    setMessage('')

    getRecommend(postId)
      .then((data) => {
        if (cancelled) return

        setCount(data.count)
        setRecommended(data.recommended)
      })
      .catch((error) => {
        console.error('추천 정보 조회 실패:', error)
        if (!cancelled) {
          setMessage('추천 정보를 불러오지 못했습니다.')
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [postId])

  // 추천 등록 및 취소
  async function handleRecommend() {
    if (isLoading || isSubmitting) return

    setIsSubmitting(true)
    setMessage('')

    try {
      const data = await toggleRecommend(postId)

      if (data === null) {
        setMessage('로그인 후 추천할 수 있어요.')
        return
      }

      setCount(data.count)
      setRecommended(data.recommended)
    } catch (error) {
      console.error('추천 처리 실패:', error)
      setMessage('추천 처리에 실패했습니다. 다시 시도해 주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div style={{ textAlign: 'center', margin: '20px 0' }}>
      <button
        type="button"
        onClick={handleRecommend}
        disabled={isLoading || isSubmitting}
        aria-pressed={recommended}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          padding: '10px 20px',
          borderRadius: '999px',
          border: recommended
            ? '1px solid var(--accent)'
            : '1px solid var(--border)',
          background: recommended
            ? 'var(--accent-soft)'
            : 'var(--card)',
          color: recommended
            ? 'var(--accent)'
            : 'var(--muted)',
          fontSize: '14px',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill={recommended ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M7 10v12" />
          <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" />
        </svg>

        추천 {isLoading ? '…' : count}
      </button>

      {message && (
        <p
          role="status"
          style={{
            margin: '8px 0 0',
            color: 'var(--muted)',
            fontSize: '13px',
          }}
        >
          {message}
        </p>
      )}
    </div>
  )
}