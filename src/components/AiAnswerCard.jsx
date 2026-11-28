// [공통] AI 답변 카드 (사연 상세)
// - 저장된 AI 답변이 있고 볼 수 있으면 보여 줌
//   (작성자는 항상, 다른 사람은 투표·궁금해요·마감 후에만. DB 규칙(RLS)이 막아 줌)
// - 답변이 없고 투표가 0명이면 작성자에게만 "AI에게 먼저 물어보기" 버튼
import { useEffect, useState } from 'react'
import { getAiAnswer, requestAiAnswer } from '../api/ai.js'

const boxStyle = {
  margin: '20px 0',
  padding: '16px 18px',
  borderRadius: '16px',
  border: '1px solid color-mix(in srgb, var(--info) 25%, transparent)',
  background: 'color-mix(in srgb, var(--info) 6%, var(--card))',
}

export default function AiAnswerCard({ postId, responseCount, isAuthor }) {
  const [answer, setAnswer] = useState(null)
  const [loaded, setLoaded] = useState(false)
  const [asking, setAsking] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    let cancelled = false
    getAiAnswer(postId).then((data) => {
      if (cancelled) return
      setAnswer(data?.content ?? null)
      setLoaded(true)
    })
    return () => {
      cancelled = true
    }
  }, [postId])

  async function handleAsk() {
    if (asking) return
    setAsking(true)
    setMessage('')
    const result = await requestAiAnswer(postId)
    if (result.ok) setAnswer(result.content)
    else setMessage(result.message)
    setAsking(false)
  }

  if (!loaded) return null

  if (answer) {
    return (
      <section style={boxStyle} aria-label="AI의 한마디">
        <strong style={{ display: 'block', marginBottom: '8px', color: 'var(--info)', fontSize: '15px' }}>AI의 한마디</strong>
        <p style={{ margin: 0, lineHeight: 1.7, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', color: 'var(--ink)' }}>{answer}</p>
        <p style={{ margin: '10px 0 0', fontSize: '12px', color: 'var(--muted)' }}>
          AI가 쓴 참고 의견이에요. 실제 경험담은 투표 댓글에서 확인해 주세요.
        </p>
      </section>
    )
  }

  if (!isAuthor || responseCount > 0) return null

  return (
    <section style={{ ...boxStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
      <span style={{ color: 'var(--muted)', fontSize: '14px' }}>
        아직 투표가 없어요. AI 의견을 먼저 들어볼까요?
        {message && <span role="status" style={{ display: 'block', color: 'var(--accent)', marginTop: '4px' }}>{message}</span>}
      </span>
      <button
        type="button"
        onClick={handleAsk}
        disabled={asking}
        style={{
          padding: '8px 16px',
          border: 'none',
          borderRadius: '999px',
          background: 'var(--primary)',
          color: 'var(--on-primary)',
          font: 'inherit',
          fontSize: '14px',
          fontWeight: 700,
          cursor: asking ? 'default' : 'pointer',
          opacity: asking ? 0.6 : 1,
        }}
      >
        {asking ? 'AI가 생각 중…' : 'AI에게 먼저 물어보기'}
      </button>
    </section>
  )
}
