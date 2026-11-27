// 🌅 이스터에그: 해(日)가 지고 달(月)이 뜨는 노을 연출 → 해달 사이트로 이동
// 작성 페이지에서 제목·내용·선택지를 전부 "해달"로 쓰고 등록하면 나타남
// 애니메이션 모양은 index.css의 .haedal-* 클래스
import { useEffect } from 'react'

const HAEDAL_URL = 'https://www.knu-haedal-dev.com/#home'
const DURATION_MS = 3600 // 연출 길이 (index.css 애니메이션 시간과 맞춤)

export default function HaedalEasterEgg() {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.href = HAEDAL_URL
    }, DURATION_MS)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="haedal-egg" role="dialog" aria-label="해달 이스터에그">
      <div className="haedal-sky" />
      <div className="haedal-sun" aria-hidden="true" />
      <div className="haedal-moon" aria-hidden="true" />
      <div className="haedal-horizon" aria-hidden="true" />
      <p className="haedal-text">
        <span className="haedal-line1">해가 지고, 달이 뜹니다</span>
        <span className="haedal-line2">해달로 갑니다 🌙</span>
      </p>
      <a className="haedal-skip" href={HAEDAL_URL}>바로 가기</a>
    </div>
  )
}
