// [상세 페이지] 후일담 카드
// - 마감 전: 사연자가 후일담을 약속했으면 "약속했어요" 안내
// - 마감 후: 후일담 타임라인 + (사연자만) 후일담 쓰기
// props: post ({ id, vote_ends_at, wants_epilogue }), status (getMyStatus 결과)
import { useEffect, useState } from 'react'
import { getEpilogues, writeEpilogue } from '../api/epilogues.js'

const cardStyle = {
  marginTop: '18px',
  padding: '24px',
  border: '1px solid var(--card-border)',
  borderRadius: '20px',
  background: 'var(--card)',
  boxShadow: 'var(--shadow)',
  backdropFilter: 'blur(14px) saturate(140%)',
  WebkitBackdropFilter: 'blur(14px) saturate(140%)',
}

const MAX_LENGTH = 1000

// "마감 후 3일" 같은 라벨 (쓴 시각 - 마감 시각)
function afterCloseLabel(createdAt, voteEndsAt) {
  const diff = new Date(createdAt).getTime() - new Date(voteEndsAt).getTime()
  if (!Number.isFinite(diff)) return ''
  const hours = Math.floor(diff / (60 * 60 * 1000))
  if (hours < 1) return '마감 직후'
  if (hours < 24) return `마감 후 ${hours}시간`
  const days = Math.floor(hours / 24)
  if (days < 30) return `마감 후 ${days}일`
  const months = Math.floor(days / 30)
  if (months < 12) return `마감 후 ${months}달`
  return `마감 후 ${Math.floor(months / 12)}년`
}

function formatDate(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('ko-KR', { month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export default function EpilogueSection({ post, status }) {
  const isClosed = Boolean(status?.isClosed)
  const isAuthor = Boolean(status?.isAuthor)

  const [epilogues, setEpilogues] = useState([])
  const [draft, setDraft] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  // 마감된 사연이면 후일담 불러오기
  useEffect(() => {
    if (!post?.id || !isClosed) {
      setEpilogues([])
      return
    }
    let cancelled = false
    getEpilogues(post.id).then((list) => {
      if (!cancelled) setEpilogues(list)
    })
    return () => {
      cancelled = true
    }
  }, [post?.id, isClosed])

  async function handleSubmit(event) {
    event.preventDefault()
    if (isSubmitting) return

    const text = draft.trim()
    if (!text) {
      setMessage('후일담 내용을 입력해 주세요.')
      return
    }

    // 후일담은 수정·삭제가 안 되니 한 번 더 확인
    const confirmed = window.confirm(
      '후일담은 올린 뒤 수정하거나 삭제할 수 없어요.\n이대로 올릴까요?'
    )
    if (!confirmed) return

    setIsSubmitting(true)
    setMessage('')
    try {
      const ok = await writeEpilogue(post.id, text)
      if (ok) {
        setDraft('')
        setEpilogues(await getEpilogues(post.id))
        setMessage('후일담을 올렸어요. 투표한 사람들에게 알림이 가요.')
      } else {
        setMessage('후일담 등록에 실패했습니다.')
      }
    } catch {
      setMessage('후일담 등록에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!post || !status) return null

  // 마감 전: 약속한 사연만 안내
  if (!isClosed) {
    if (!post.wants_epilogue) return null
    return (
      <section style={cardStyle} aria-label="후일담 약속">
        <p style={{ margin: 0, color: 'var(--ink)', lineHeight: 1.6 }}>
          <span aria-hidden="true">📮 </span>
          <strong>사연자가 후일담을 약속했어요.</strong>
        </p>
        <p style={{ margin: '6px 0 0', color: 'var(--muted)', fontSize: '14px', lineHeight: 1.6 }}>
          투표가 끝나면 실제로 어떻게 됐는지 알려 줄 거예요. 투표해 두면 후일담이 올라올 때 알림을 받아요.
        </p>
      </section>
    )
  }

  // 마감 후: 후일담이 없고, 사연자도 아니고, 약속도 안 했으면 카드 자체를 안 보여 줌
  if (epilogues.length === 0 && !isAuthor && !post.wants_epilogue) return null

  return (
    <section style={cardStyle} aria-label="후일담">
      <h3 style={{ margin: '0 0 16px' }}>
        <span aria-hidden="true">📮 </span>후일담
        {epilogues.length > 0 && (
          <span style={{ marginLeft: '6px', color: 'var(--muted)', fontSize: '15px', fontWeight: 'normal' }}>
            {epilogues.length}
          </span>
        )}
      </h3>

      {epilogues.length === 0 ? (
        <p style={{ margin: 0, color: 'var(--muted)' }}>
          {isAuthor
            ? '아직 후일담이 없어요. 실제로 어떻게 됐는지 알려 주세요.'
            : '아직 후일담이 없어요. 사연자가 약속했으니 곧 올라올 거예요.'}
        </p>
      ) : (
        <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {epilogues.map((item, index) => (
            <li
              key={item.id}
              style={{
                position: 'relative',
                paddingLeft: '22px',
                paddingBottom: index === epilogues.length - 1 ? 0 : '18px',
                borderLeft: '2px solid var(--border)',
                marginLeft: '6px',
              }}
            >
              {/* 타임라인 점 */}
              <span
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  left: '-7px',
                  top: '4px',
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: 'var(--ink-soft)',
                }}
              />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 10px', alignItems: 'baseline' }}>
                <strong style={{ fontSize: '15px' }}>{afterCloseLabel(item.created_at, post.vote_ends_at)}</strong>
                <time dateTime={item.created_at} style={{ color: 'var(--muted)', fontSize: '13px' }}>
                  {formatDate(item.created_at)}
                </time>
              </div>
              <p style={{ margin: '6px 0 0', lineHeight: 1.7, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', color: 'var(--ink)' }}>
                {item.content}
              </p>
            </li>
          ))}
        </ol>
      )}

      {/* 사연자만: 후일담 쓰기 (여러 번 가능) */}
      {isAuthor && (
        <form onSubmit={handleSubmit} style={{ marginTop: '20px', paddingTop: '18px', borderTop: '1px solid var(--border)' }}>
          <label htmlFor="epilogue-draft" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            {epilogues.length === 0 ? '후일담 쓰기' : '새 소식 더하기'}
          </label>
          <textarea
            id="epilogue-draft"
            value={draft}
            onChange={(event) => setDraft(event.target.value.slice(0, MAX_LENGTH))}
            placeholder="그래서 어떻게 됐나요? 결정한 뒤의 이야기를 들려주세요."
            rows={4}
            style={{
              display: 'block',
              width: '100%',
              boxSizing: 'border-box',
              padding: '12px',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              background: 'var(--card)',
              color: 'var(--ink)',
              font: 'inherit',
              resize: 'vertical',
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginTop: '10px' }}>
            <span style={{ color: 'var(--muted)', fontSize: '13px' }}>
              {draft.length}/{MAX_LENGTH} · 올린 후에는 수정·삭제할 수 없어요
            </span>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                minHeight: '44px',
                padding: '10px 20px',
                border: 'none',
                borderRadius: '10px',
                background: 'var(--primary)',
                color: 'var(--on-primary)',
                font: 'inherit',
                fontWeight: 700,
                opacity: isSubmitting ? 0.6 : 1,
                cursor: isSubmitting ? 'default' : 'pointer',
              }}
            >
              {isSubmitting ? '올리는 중...' : '후일담 올리기'}
            </button>
          </div>
        </form>
      )}

      {message && (
        <p role="status" style={{ margin: '12px 0 0', color: 'var(--muted)', fontSize: '14px' }}>
          {message}
        </p>
      )}
    </section>
  )
}
