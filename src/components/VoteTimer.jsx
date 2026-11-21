// [프론트 팀] 투표 남은 시간 컴포넌트 (실시간 카운트다운, 마감 알림)
// props로 마감 시각(voteEndsAt)과 마감 시 실행할 함수(onExpire)를 받음

import { useEffect, useRef, useState } from 'react'

export default function VoteTimer({ voteEndsAt, onExpire }) {
  const [now, setNow] = useState(Date.now())
  const onExpireRef = useRef(onExpire)

  // 부모에게 전달받은 최신 마감 처리 함수를 기억
  useEffect(() => {
    onExpireRef.current = onExpire
  }, [onExpire])

  // 1초마다 현재 시각을 확인하고 마감 시 부모에게 알림
  useEffect(() => {
    const endTime = new Date(voteEndsAt).getTime()

    if (!Number.isFinite(endTime)) return

    let hasNotified = false
    let timer

    function updateTime() {
      const current = Date.now()
      setNow(current)

      if (current >= endTime) {
        // 마감 알림은 한 번만 전달
        if (!hasNotified) {
          hasNotified = true
          onExpireRef.current?.()
        }

        clearInterval(timer)
      }
    }

    updateTime()

    if (!hasNotified) {
      timer = setInterval(updateTime, 1000)
    }

    return () => clearInterval(timer)
  }, [voteEndsAt])

  const endTime = new Date(voteEndsAt).getTime()

  if (!Number.isFinite(endTime)) return null

  const diff = endTime - now

  if (diff <= 0) return <span>마감됨</span>

  const totalMinutes = Math.ceil(diff / (1000 * 60))
  const days = Math.floor(totalMinutes / (60 * 24))
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60)
  const minutes = totalMinutes % 60

  let remainingText = ''

  if (days > 0) {
    remainingText = `${days}일 ${hours}시간 남음`
  } else if (hours > 0) {
    remainingText = `${hours}시간 ${minutes}분 남음`
  } else {
    remainingText = `${minutes}분 남음`
  }

  return <span>{remainingText}</span>
}
