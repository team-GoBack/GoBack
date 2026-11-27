// [공통] 새 후일담 알림 배너
// 내가 투표한 사연에 새 후일담이 올라오면 헤더 아래에 한 줄로 알려 줌
// 페이지를 옮길 때마다, 로그인·로그아웃할 때마다 다시 확인
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getUnreadEpilogues, markEpiloguesRead } from '../api/epilogues.js'
import { onAuthChange } from '../api/auth.js'

export default function EpilogueBanner() {
  const location = useLocation()
  const navigate = useNavigate()
  const [unread, setUnread] = useState([])
  const [authVersion, setAuthVersion] = useState(0) // 로그인 상태가 바뀌면 다시 확인하기 위한 숫자

  useEffect(() => {
    const unsubscribe = onAuthChange(() => setAuthVersion((n) => n + 1))
    return unsubscribe
  }, [])

  useEffect(() => {
    let cancelled = false
    getUnreadEpilogues()
      .then((list) => {
        if (!cancelled) setUnread(list)
      })
      .catch(() => {
        if (!cancelled) setUnread([])
      })
    return () => {
      cancelled = true
    }
  }, [location.pathname, authVersion])

  if (unread.length === 0) return null

  const latest = unread[0]
  const extra = unread.length - 1

  async function handleOpen() {
    await markEpiloguesRead()
    setUnread([])
    navigate(`/posts/${latest.post_id}`)
  }

  async function handleClose() {
    await markEpiloguesRead()
    setUnread([])
  }

  return (
    <div className="epilogue-banner" role="status">
      <span className="epilogue-banner-icon" aria-hidden="true">📮</span>
      <p className="epilogue-banner-text">
        내가 투표한 사연 <strong>"{latest.title}"</strong>에 새 후일담이 올라왔어요
        {extra > 0 && <span className="epilogue-banner-extra"> 외 {extra}개</span>}
      </p>
      <button type="button" className="epilogue-banner-open" onClick={handleOpen}>
        보러 가기
      </button>
      <button
        type="button"
        className="epilogue-banner-close"
        onClick={handleClose}
        aria-label="알림 닫기"
      >
        ×
      </button>
    </div>
  )
}
