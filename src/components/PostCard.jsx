// [프론트 팀] 사연 카드 한 장 (화면 조각)
// props로 사연 하나(post)를 받아서 카드 모양으로 보여줌
import { Link } from 'react-router-dom'
import { formatDateTime } from '../utils/date.js'

// HOT 사연이 되기 위한 최소 투표 수
const HOT_MIN = 3

// 마감 시각을 받아서 "3시간 남음" 같은 글자로 바꿔주는 함수
function getRemainingText(endsAt) {
  const diff = new Date(endsAt) - new Date() // 마감까지 남은 시간 (밀리초)

  if (diff <= 0) return '마감됨'

  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days >= 1) return `${days}일 남음`
  if (hours >= 1) return `${hours}시간 남음`
  if (minutes >= 1) return `${minutes}분 남음`
  return '곧 마감'
}

// 마감 시각을 받아서 사연의 상태를 알려주는 함수
// 'closed' = 마감됨, 'urgent' = 1시간도 안 남음(마감 임박), 'open' = 여유 있음
function getStatus(endsAt) {
  const diff = new Date(endsAt) - new Date() // 마감까지 남은 시간 (밀리초)

  if (diff <= 0) return 'closed'
  if (diff < 1000 * 60 * 60) return 'urgent'

  return 'open'
}

export default function PostCard({ post }) {
  const status = getStatus(post.vote_ends_at)
  // HOT 사연 = 아직 마감 전 + 투표가 HOT_MIN명 이상
  const isHot = status !== 'closed' && post.response_count >= HOT_MIN

  return (
    <Link
      to={`/posts/${post.id}`}
      className="post-card"
      style={{ opacity: status === 'closed' ? 0.5 : 1 }}
    >
      {/* 카테고리 및 작성일자 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '6px 8px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <span className="tag">{post.tag}</span>
          {isHot && <span className="badge badge-hot">🔥 HOT</span>}
          {post.wants_epilogue && (
            <span className="badge badge-epilogue" title="사연자가 후일담을 약속했어요">📮 후일담</span>
          )}
          {status === 'urgent' && (
            <span className="badge badge-urgent">마감 임박</span>
          )}
        </div>

        {post.created_at && (
          <time
            dateTime={post.created_at}
            style={{
              color: 'var(--muted)',
              fontSize: '13px',
              marginLeft: 'auto',
              whiteSpace: 'nowrap',
            }}
          >
            {formatDateTime(post.created_at)}
          </time>
        )}
      </div>

      <h3>{post.title}</h3>
      <p>{post.content}</p>
      <small>
        투표 {post.response_count}명 · {getRemainingText(post.vote_ends_at)}
      </small>
    </Link>
  )
}
