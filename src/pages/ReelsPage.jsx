// [프론트 팀] 릴스 페이지: 랜덤 사연을 한 장씩 넘겨 보기 (담당: 박준석, 미션 5)
// 흐름: 화면이 열림 → getPosts()로 사연을 받음 → 섞어서 한 장씩 보여줌
// ※ 카드에는 제목·내용·태그·남은 시간만. 투표 결과·댓글은 절대 넣지 않기 (블라인드 규칙)
export default function ReelsPage() {
  return (
    <main>
      <h2>릴스</h2>
      <p className="todo">TODO: 사연을 랜덤으로 섞어서 화면 꽉 찬 카드로 한 장씩, 위아래로 넘기기</p>
    </main>
  )
}
