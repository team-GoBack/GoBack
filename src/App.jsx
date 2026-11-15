// [공통 파일] 팀장만 수정
// 주소(URL)마다 어떤 페이지를 보여줄지 정하는 곳
import { Routes, Route, Link } from 'react-router-dom'
import MainPage from './pages/MainPage.jsx'
import PostDetailPage from './pages/PostDetailPage.jsx'
import WritePage from './pages/WritePage.jsx'

export default function App() {
  return (
    <div className="app">
      <header className="header">
        <Link to="/" className="logo">GoBack</Link>
        <Link to="/write" className="write-btn">사연 쓰기</Link>
      </header>

      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/posts/:id" element={<PostDetailPage />} />
        <Route path="/write" element={<WritePage />} />
      </Routes>
    </div>
  )
}
