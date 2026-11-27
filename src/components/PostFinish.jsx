// [프론트 팀] 사연자 마무리 컴포넌트
// 마감된 내 사연에서 최종 선택 및 Best Pick 댓글 등록

import { useState } from 'react'
import { finishPost } from '../api/posts.js'

const choiceStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '12px',
  width: '100%',
  padding: '14px 16px',
  marginBottom: '10px',
  borderRadius: '12px',
  background: 'var(--card)',
  color: 'var(--ink)',
  font: 'inherit',
  textAlign: 'left',
  cursor: 'pointer',
  boxSizing: 'border-box',
  overflowWrap: 'anywhere',
}

// 선택 여부에 따른 버튼 스타일
function getChoiceStyle(isSelected) {
  return {
    ...choiceStyle,
    border: isSelected
      ? '1px solid var(--muted)'
      : '1px solid var(--border)',
    background: isSelected
      ? 'color-mix(in srgb, var(--ink) 4%, var(--card))'
      : 'var(--card)',
  }
}

// 선택 여부 표시 아이콘
function SelectionIcon({ isSelected }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--muted)"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <circle cx="12" cy="12" r="9" />
      {isSelected && <path d="m8 12 3 3 5-6" />}
    </svg>
  )
}

export default function PostFinish({
  postId,
  options,
  responses,
  onFinished,
}) {
  const [chosenOptionId, setChosenOptionId] = useState(null)
  const [bestResponseId, setBestResponseId] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  // 댓글이 없으면 최종 선택만으로 확정 가능
  const hasResponses = responses.length > 0
  const canSubmit =
    options.some((option) => option.id === chosenOptionId) &&
    (!hasResponses ||
      responses.some((response) => response.id === bestResponseId)) &&
    !isSubmitting

  // 선택지 ID로 선택지 이름 찾기
  function getOptionLabel(optionId) {
    return options.find((option) => option.id === optionId)?.label ?? '선택지'
  }

  // 미션 6: 최종 선택과 Best Pick 저장
  async function handleFinish(event) {
    event.preventDefault()

    if (!canSubmit) return

    const confirmed = window.confirm(
      '최종 선택을 확정하시겠습니까?\n확정 후에는 변경할 수 없습니다.'
    )

    if (!confirmed) return

    setIsSubmitting(true)
    setMessage('')

    const finalBestResponseId = hasResponses ? bestResponseId : null

    try {
      const success = await finishPost(
        postId,
        chosenOptionId,
        finalBestResponseId
      )

      if (success) {
        onFinished({
          chosen_option_id: chosenOptionId,
          best_response_id: finalBestResponseId,
        })
      } else {
        setMessage('마무리에 실패했습니다. 다시 시도해 주세요.')
      }
    } catch (error) {
      console.error('사연 마무리 실패:', error)
      setMessage('오류가 발생했습니다. 다시 시도해 주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleFinish}>
      <h3 style={{ margin: '0 0 12px' }}>
        사연자 마무리
      </h3>

      <p style={{ color: 'var(--muted)', lineHeight: 1.6 }}>
        고민 끝에 어떤 선택을 하셨나요?
        가장 도움이 된 댓글도 골라주세요.
      </p>

      {/* 사연 작성자의 최종 선택 */}
      <h4 style={{ margin: '24px 0 12px' }}>
        최종 선택
      </h4>

      {options.map((option) => {
        const isSelected = chosenOptionId === option.id

        return (
          <button
            key={option.id}
            type="button"
            disabled={isSubmitting}
            aria-pressed={isSelected}
            onClick={() => setChosenOptionId(option.id)}
            style={getChoiceStyle(isSelected)}
          >
            <span style={{ flex: 1, minWidth: 0 }}>
              {option.label}
            </span>

            <SelectionIcon isSelected={isSelected} />
          </button>
        )
      })}

      {/* Best Pick 댓글 선택 */}
      <div
        style={{
          marginTop: '24px',
          paddingTop: '20px',
          borderTop: '1px solid var(--border)',
        }}
      >
        <h4 style={{ margin: '0 0 12px' }}>
          Best Pick 댓글
        </h4>

        {!hasResponses ? (
          <p style={{ color: 'var(--muted)', fontSize: '14px' }}>
            작성된 댓글이 없어 Best Pick을 선택할 수 없습니다.
          </p>
        ) : (
          responses.map((response, index) => {
            const isSelected = bestResponseId === response.id

            return (
              <button
                key={response.id}
                type="button"
                disabled={isSubmitting}
                aria-pressed={isSelected}
                onClick={() => setBestResponseId(response.id)}
                style={{
                  ...getChoiceStyle(isSelected),
                  alignItems: 'flex-start',
                }}
              >
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '8px',
                      marginBottom: '10px',
                    }}
                  >
                    {/* 댓글 목록과 같은 번호 (같은 responses 배열, 같은 순서) */}
                    <strong>익명{index + 1}</strong>

                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '999px',
                        background: 'var(--border)',
                        color: 'var(--muted)',
                        fontSize: '13px',
                      }}
                    >
                      {getOptionLabel(response.option_id)}
                    </span>
                  </span>

                  <span
                    style={{
                      display: 'block',
                      lineHeight: 1.65,
                      whiteSpace: 'pre-wrap',
                      overflowWrap: 'anywhere',
                    }}
                  >
                    {response.content}
                  </span>
                </span>

                <SelectionIcon isSelected={isSelected} />
              </button>
            )
          })
        )}
      </div>

      {/* 최종 확정 버튼 */}
      <button
        type="submit"
        disabled={!canSubmit}
        style={{
          width: '100%',
          minHeight: '48px',
          marginTop: '14px',
          padding: '12px 20px',
          border: '1px solid var(--primary)',
          borderRadius: '10px',
          background: 'var(--primary)',
          color: 'var(--on-primary)',
          font: 'inherit',
          fontWeight: 700,
          opacity: canSubmit ? 1 : 0.5,
          cursor: canSubmit ? 'pointer' : 'default',
        }}
      >
        {isSubmitting ? '저장 중...' : '최종 선택 확정하기'}
      </button>

      <p
        style={{
          margin: '12px 0 0',
          textAlign: 'center',
          color: 'var(--muted)',
          fontSize: '13px',
        }}
      >
        확정 후에는 최종 선택과 Best Pick을 변경할 수 없습니다.
      </p>

      {message && (
        <p role="status" style={{ color: 'var(--muted)' }}>
          {message}
        </p>
      )}
    </form>
  )
}