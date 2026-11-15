# GoBack 코드 규칙

## 폴더
- src/api/        : 데이터 주문 창구 (백엔드 팀). 화면 파일은 Supabase를 직접 부르지 말고 여기 함수만 부름
- src/pages/      : 페이지 하나 = 파일 하나 (프론트 팀)
- src/components/ : 여러 페이지에서 쓰는 화면 조각 (프론트 팀)
- src/App.jsx, src/main.jsx, src/index.css : 공통 파일, 팀장만 수정

## 규칙
- React + JavaScript (TypeScript 쓰지 않기)
- 컴포넌트 파일 이름은 대문자로 시작 (PostCard.jsx)
- api 함수의 이름 / 넣는 값 / 돌려주는 모양을 바꿔야 하면 단톡에 먼저 말하기
- 새 라이브러리 설치(npm install)가 필요하면 팀장한테 먼저 말하기
- 내가 맡은 파일만 수정하기
