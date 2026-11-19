// [공통 파일] 팀장만 수정
// 주소(URL)마다 어떤 페이지를 보여줄지 정하는 곳
import { Routes, Route, Link } from 'react-router-dom'
import MainPage from './pages/MainPage.jsx'
import PostDetailPage from './pages/PostDetailPage.jsx'
import WritePage from './pages/WritePage.jsx'
import ReelsPage from './pages/ReelsPage.jsx'
import LoginButton from './components/LoginButton.jsx'

export default function App() {
  return (
    <div className="app">
      <header className="header">
        <Link to="/" className="logo">GoBack</Link>
        <div className="header-actions">
          <Link to="/reels" className="reels-link" aria-label="릴스: 사연 넘겨 보기">
            {/* 세로 화면 안에 재생 버튼 모양 아이콘 */}
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="6" y="2.5" width="12" height="19" rx="3.5" />
              <path d="M10.5 9.2v5.6l4.4-2.8z" fill="currentColor" stroke="none" />
            </svg>
            <span>Swipe</span>
          </Link>
          <LoginButton />
          <Link to="/write" className="write-btn">사연 쓰기</Link>
        </div>
      </header>

      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/posts/:id" element={<PostDetailPage />} />
        <Route path="/write" element={<WritePage />} />
        <Route path="/reels" element={<ReelsPage />} />
      </Routes>
    </div>
  )
}
