
// [프론트 팀] 투표 폼 컴포넌트 (선택지, 투표·댓글 작성, 궁금해요)
// props로 투표 상태와 이벤트 함수를 받아 투표 화면을 표시

// 궁금해요 버튼 스타일
const secondaryButtonStyle = {
  padding: '10px 18px',
  border: '1px solid var(--border)',
  borderRadius: '10px',
  background: 'var(--card)',
  color: 'var(--ink)',
  font: 'inherit',
  cursor: 'pointer',
}

export default function VoteForm({
  options,
  selectedOptionId,
  setSelectedOptionId,
  comment,
  setComment,
  status,
  isLoggedIn,
  isSubmitting,
  isPeeking,
  handleSubmit,
  handlePeek,
  getVoteNotice,
}) {
  return (
    <>
      <h3 style={{ margin: '0 0 18px' }}>
        여러분이라면 어떻게 하시겠어요?
      </h3>

      {/* 아직 결과를 볼 수 없는 사용자에게만 선택지 표시 */}
      {options.map((option) => {
        const isSelected = selectedOptionId === option.id
        const canSelect =
          isLoggedIn && status.canVote && !isSubmitting && !isPeeking

        return (
          <button
            key={option.id}
            type="button"
            disabled={!canSelect}
            onClick={() => setSelectedOptionId(option.id)}
            aria-pressed={isSelected}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              width: '100%',
              minHeight: '52px',
              padding: '14px 16px',
              marginBottom: '10px',
              textAlign: 'left',
              border: isSelected
                ? '1px solid #777777'
                : '1px solid var(--border)',
              borderRadius: '12px',
              backgroundColor: isSelected
                ? 'color-mix(in srgb, var(--ink) 4%, var(--card))'
                : 'var(--card)',
              color: 'var(--ink)',
              font: 'inherit',
              fontWeight: isSelected ? 500 : 400,
              appearance: 'none',
              boxShadow: 'none',
              backdropFilter: 'blur(12px) saturate(130%)',
              WebkitBackdropFilter: 'blur(12px) saturate(130%)',
              opacity: canSelect ? 1 : 0.6,
              cursor: canSelect ? 'pointer' : 'default',
              transition: 'background-color 0.2s ease, border-color 0.2s ease',
            }}
          >
            <span style={{ flex: 1, overflowWrap: 'anywhere' }}>
              {option.label}
            </span>

            {/* 선택한 답변에만 체크 아이콘 표시 */}
            {isSelected && (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--ink-soft)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                style={{ flexShrink: 0 }}
              >
                <path d="m5 12 4 4L19 6" />
              </svg>
            )}
          </button>
        )
      })}

      {isLoggedIn && status.canVote ? (
        <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
          <label htmlFor="vote-comment" style={{ fontWeight: 700 }}>
            내 경험이나 의견
          </label>
          <textarea
            id="vote-comment"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="선택한 이유나 경험을 작성해 주세요."
            rows={4}
            style={{
              display: 'block',
              width: '100%',
              padding: '12px',
              margin: '10px 0 12px',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              background: 'var(--card)',
              color: 'var(--ink)',
              font: 'inherit',
              resize: 'vertical',
            }}
          />

          {/* PC에서는 가로 정렬, 좁은 화면에서는 자동 줄바꿈 */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'stretch',
              gap: '10px',
            }}
          >
            <button
              type="submit"
              disabled={isSubmitting || isPeeking}
              style={{
                flex: '3 1 220px',
                minHeight: '48px',
                padding: '12px 20px',
                border: '1px solid var(--primary)',
                borderRadius: '10px',
                background: 'var(--primary)',
                color: 'var(--on-primary)',
                font: 'inherit',
                fontWeight: 700,
                opacity: isSubmitting || isPeeking ? 0.7 : 1,
                cursor:
                  isSubmitting || isPeeking ? 'default' : 'pointer',
              }}
            >
              {isSubmitting ? '제출 중...' : '투표와 댓글 등록'}
            </button>

            {/* 미션 4: 투표하지 않은 사용자의 궁금해요 버튼 */}
            {isLoggedIn &&
              !status.isAuthor &&
              !status.hasResponded &&
              !status.hasPeeked &&
              !status.isClosed && (
                <button
                  type="button"
                  onClick={handlePeek}
                  disabled={isPeeking || isSubmitting}
                  style={{
                    ...secondaryButtonStyle,
                    flex: '1 1 130px',
                    minHeight: '48px',
                    backdropFilter: 'blur(12px) saturate(130%)',
                    WebkitBackdropFilter: 'blur(12px) saturate(130%)',
                    opacity: isPeeking || isSubmitting ? 0.7 : 1,
                    cursor:
                      isPeeking || isSubmitting ? 'default' : 'pointer',
                  }}
                >
                  {isPeeking ? '처리 중...' : '궁금해요'}
                </button>
              )}
          </div>

          {/* 투표 결과 및 댓글 블라인드 안내 */}
          <p
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              margin: '14px 0 0',
              color: 'var(--muted)',
              fontSize: '13px',
              lineHeight: 1.5,
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              style={{ flexShrink: 0 }}
            >
              <rect x="5" y="10" width="14" height="11" rx="2" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" />
            </svg>
            <span>
              투표하거나 궁금해요를 사용하면 결과와 댓글을 볼 수 있어요.
            </span>
          </p>
        </form>
      ) : (
        <p style={{ margin: '16px 0 0', color: 'var(--muted)' }}>
          {getVoteNotice()}
        </p>
      )}
    </>
  )
}
