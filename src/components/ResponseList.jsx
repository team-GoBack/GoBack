
// [프론트 팀] 댓글 목록 컴포넌트 (작성자, 선택한 답변, 작성 시각, 댓글 내용)
// props로 댓글 목록(responses)과 선택지 목록(options)을 받아 화면에 표시

// 댓글 작성 시각만 연도·오전/오후 없이 24시간제로 표시
function formatCommentDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${date.getMonth() + 1}월 ${date.getDate()}일 ${hour}:${minute}`
}

export default function ResponseList({ responses, options }) {
  // 선택지 ID로 선택지 이름 찾기
  function getOptionLabel(optionId) {
    return options.find((option) => option.id === optionId)?.label ?? '선택지'
  }

  return (
    <div style={{ borderTop: '1px solid var(--border)', marginTop: '26px' }}>
      <h3 style={{ margin: '24px 0 8px' }}>댓글 {responses.length}</h3>

      {responses.length === 0 ? (
        <p style={{ color: 'var(--muted)' }}>
          아직 작성된 댓글이 없습니다.
        </p>
      ) : (
        responses.map((response, index) => (
          <article
            key={response.id}
            style={{
              padding: '16px 0',
              borderBottom: index === responses.length - 1
                ? 'none'
                : '1px solid var(--border)',
            }}
          >
            {/* 작성자와 선택지 태그, 작성 시각을 같은 영역에 표시 */}
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
                  flex: '1 1 180px',
                  minWidth: 0,
                  gap: '8px',
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    display: 'inline-flex',
                    width: '28px',
                    height: '28px',
                    flexShrink: 0,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    background: 'var(--border)',
                    color: 'var(--muted)',
                  }}
                >
                  <svg
                    width="17"
                    height="17"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <circle
                      cx="12"
                      cy="8"
                      r="4"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    />
                    <path
                      d="M4.5 20c0-4.2 3.4-6.5 7.5-6.5s7.5 2.3 7.5 6.5"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>

                <strong style={{ fontSize: '16px' }}>
                  {response.is_mine ? '나' : '익명'}
                </strong>

                {/* 선택한 답변을 은은한 태그로 표시 */}
                <span
                  style={{
                    display: 'inline-block',
                    maxWidth: '100%',
                    padding: '5px 10px',
                    borderRadius: '999px',
                    background: 'color-mix(in srgb, var(--ink) 5%, var(--card))',
                    color: 'var(--ink)',
                    fontSize: '15px',
                    fontWeight: 500,
                    lineHeight: 1.3,
                    overflowWrap: 'anywhere',
                  }}
                >
                  {getOptionLabel(response.option_id)}
                </span>
              </div>

              {formatCommentDate(response.created_at) && (
                <time
                  dateTime={response.created_at}
                  style={{
                    fontSize: '13px',
                    color: 'var(--muted)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {formatCommentDate(response.created_at)}
                </time>
              )}
            </div>

            <p
              style={{
                margin: '16px 0 0',
                lineHeight: 1.65,
                whiteSpace: 'pre-wrap',
                overflowWrap: 'anywhere',
                color: 'var(--ink)',
              }}
            >
              {response.content}
            </p>
          </article>
        ))
      )}
    </div>
  )
}
