
// [프론트 팀] 투표 결과 컴포넌트 (득표수, 비율, 결과 그래프)
// props로 투표 결과 목록(results)을 받아 선택지별 결과를 화면에 표시

export default function VoteResults({ results }) {
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
        <span style={{ color: 'var(--muted)', fontSize: '13px' }}>
          총 {totalVotes}명 참여
        </span>
      </div>

      {results.length === 0 ? (
        <p style={{ color: 'var(--muted)' }}>아직 투표 결과가 없습니다.</p>
      ) : (
        results.map((result) => {
          const percentage = totalVotes > 0
            ? Math.round((result.count / totalVotes) * 100)
            : 0

          // 0표일 때는 강조하지 않고, 공동 1위는 모두 강조
          const isTopChoice = maxVotes > 0 && result.count === maxVotes

          return (
            <div key={result.option_id} style={{ marginBottom: '20px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '12px',
                  marginBottom: '8px',
                }}
              >
                <span style={{ overflowWrap: 'anywhere' }}>
                  {result.label}
                </span>
                <span style={{ whiteSpace: 'nowrap', color: 'var(--muted)' }}>
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
                    background: isTopChoice
                      ? 'var(--primary)'
                      : 'color-mix(in srgb, var(--muted) 45%, var(--card))',
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
