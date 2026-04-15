# Auto Trading Admin Panel

KRX 타겟 퀀트 자동매매 시스템의 관리자 대시보드. FastAPI 백엔드와 연동하여 계좌 현황, 주문 실행/관리, 전략 성과 분석을 제공한다.

## Tech Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS + shadcn/ui
- Recharts (차트)
- WebSocket (실시간 주문 상태)

## 페이지 구성

| 경로 | 페이지 | 설명 |
|------|--------|------|
| `/` | Order | 주문 실행(매수/매도), 정정/취소, Kill Switch, Dry Run |
| `/dashboard` | Dashboard | 계좌 요약, 보유종목, 당일 매매현황 |
| `/strategies` | Strategies | 리밸런싱 실행 지표, 포트폴리오 현황, 종목별 수익률 분포 |
| `/history` | History | (예정) |
| `/backtest` | Backtest | (예정) |
| `/settings` | Settings | (예정) |

## 환경변수

프로젝트 루트에 `.env` 파일 생성:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_WS_URL=ws://127.0.0.1:8000/ws/orders
```

> Vite는 `VITE_` 접두사가 붙은 변수만 클라이언트에 노출한다.
> 환경변수 변경 후 빌드 모드에서는 `npm run build`를 다시 실행해야 반영된다.

## 실행

### 개발 모드

```bash
npm install
npm run dev
```

`http://localhost:5173`에서 실행. HMR 지원.

### 프로덕션 빌드

```bash
npm run build
npm run preview
```

`http://localhost:4173`에서 빌드 결과 확인. `dist/` 폴더가 배포 대상.

## 백엔드 연동

FastAPI 서버가 실행 중이어야 한다. CORS 설정에 프론트 origin이 포함되어야 함:

```python
# main.py CORSMiddleware
allow_origins=[
    "http://localhost:5173",   # dev
    "http://127.0.0.1:5173",
    "http://localhost:4173",   # preview
    "http://127.0.0.1:4173",
]
```

## 주요 기능

### WebSocket 실시간 업데이트
- 단일 WebSocket 연결 (Context Provider)
- 자동 재연결 (exponential backoff: 3초 → 최대 30초)
- ping/pong 자동 응답
- 사이드바에 연결 상태 표시 (Connected / Connecting / Disconnected)

### 주문 페이지
- 매수/매도 → 정정/취소 (모달)
- 부모-자식 주문 트리 구조 (펼치기/접기)
- Dry Run 모드 (주문지만 생성, 브로커 미제출)
- Kill Switch (전체 주문 즉시 취소)
- WebSocket으로 주문 상태 실시간 반영

### 대시보드
- KIS API 잔고 조회 (페이지네이션 처리)
- 종목명 매핑 (DART corpCode.xml 캐시)

### 전략 성과 분석
- 리밸런스 이력 기반 실행 지표 (편입 실패율, 예수금 비율, 소요시간)
- 대시보드 + 리밸런스 데이터 조합으로 포트폴리오 현황, 승률, 종목별 수익률 분포
- 시계열 데이터 미확보 지표는 placeholder 표시 (Alpha, CAGR, MDD 등)

## 프로젝트 구조

```
src/
├── api/                # API 호출 모듈
│   ├── client.ts       # axios 인스턴스
│   ├── AccountApi.ts
│   ├── OrderApi.ts
│   └── RebalanceApi.ts
├── types/              # DTO 타입 정의
│   ├── Account.ts
│   ├── Order.ts
│   ├── Safety.ts
│   └── Rebalance.ts
├── contexts/
│   └── WebSocketContext.tsx
├── components/
│   ├── Layout.tsx
│   └── ui/             # shadcn/ui 컴포넌트
├── pages/
│   ├── OrderPage.tsx
│   ├── DashboardPage.tsx
│   └── StrategiesPage.tsx
└── routes.ts
```