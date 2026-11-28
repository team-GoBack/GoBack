// [프론트 팀] 투표 결과 컴포넌트 (득표수, 비율, 결과 그래프)
// props로 투표 결과 목록(results)을 받아 선택지별 결과를 화면에 표시
// myOptionId를 받아 내가 투표한 선택지를 표시
// authorOptionId를 받아 사연 작성자의 최종 선택을 표시
import { optionColor, optionLetter } from '../utils/optionColor.js'

export default function VoteResults({ results, myOptionId, authorOptionId }) {
  const totalVotes = results.reduce((sum, result) => sum + result.count, 0)
  const maxVotes = Math.max(0, ...results.map((result) => result.count))

  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap',
          marginBottom: '20px',
        }}
      >
        <h3 style={{ margin: 0 }}>투표 결과</h3>
        <span style={{ color: 'var(--muted)', fontSize: '14px' }}>
          총 {totalVotes}명 참여
        </span>
      </div>

      {results.length === 0 ? (
        <p style={{ color: 'var(--muted)' }}>아직 투표 결과가 없습니다.</p>
      ) : (
        results.map((result, index) => {
          const percentage = totalVotes > 0
            ? Math.round((result.count / totalVotes) * 100)
            : 0

          // 0표일 때는 강조하지 않고, 공동 1위는 모두 강조
          const isTopChoice = maxVotes > 0 && result.count === maxVotes

          // 내가 투표한 선택지인지 확인
          const isMyChoice =
            myOptionId != null && result.option_id === myOptionId

          // 미션 6: 사연 작성자의 최종 선택인지 확인
          const isAuthorChoice =
            authorOptionId != null && result.option_id === authorOptionId

          return (
            <div key={result.option_id} style={{ marginBottom: '16px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  marginBottom: '8px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '6px',
                    minWidth: 0,
                  }}
                >
                  {/* 선택지 글자 배지 A, B, C… (댓글의 선택지 태그와 같은 색) */}
                  <span
                    aria-hidden="true"
                    style={{
                      display: 'inline-grid',
                      placeItems: 'center',
                      width: '24px',
                      height: '24px',
                      borderRadius: '7px',
                      background: `color-mix(in srgb, ${optionColor(index)} 14%, var(--card))`,
                      color: optionColor(index),
                      fontSize: '13px',
                      fontWeight: 800,
                      flexShrink: 0,
                    }}
                  >
                    {optionLetter(index)}
                  </span>
                  <span style={{ overflowWrap: 'anywhere' }}>
                    {result.label}
                  </span>

                  {/* 내가 투표한 선택지에만 내 선택 태그 표시 */}
                  {isMyChoice && (
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '999px',
                        background: 'var(--border)',
                        color: 'var(--muted)',
                        fontSize: '13px',
                        fontWeight: 500,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      내 선택
                    </span>
                  )}

                  {/* 사연 작성자가 확정한 최종 선택 표시 */}
                  {isAuthorChoice && (
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '999px',
                        background: 'color-mix(in srgb, var(--info) 10%, var(--card))',
                        color: 'var(--info)',
                        fontSize: '13px',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      사연자의 최종 선택
                    </span>
                  )}
                </div>

                <span style={{ whiteSpace: 'nowrap', color: optionColor(index), fontWeight: 700 }}>
                  {result.count}표 ({percentage}%)
                </span>
              </div>

              <div
                style={{
                  width: '100%',
                  height: '8px',
                  borderRadius: '999px',
                  background: 'var(--border)',
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
                    borderRadius: '999px',
                    // 선택지 색. 1위는 진하게, 나머지는 살짝 연하게
                    background: isTopChoice
                      ? optionColor(index)
                      : `color-mix(in srgb, ${optionColor(index)} 55%, var(--card))`,
                  }}
                />
              </div>
            </div>
          )
        })
      )}
    </>
  )
}