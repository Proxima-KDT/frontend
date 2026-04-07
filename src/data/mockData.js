// ===== EduPilot Mock 데이터 =====
// 모든 페이지에서 사용하는 더미 데이터 통합 관리

// --- 사용자 ---
export const mockStudentUser = {
  id: 'uuid-student-001',
  email: 'student@edupilot.kr',
  name: '김민준',
  role: 'student',
  avatar_url: null,
  created_at: '2025-10-01',
};

export const mockTeacherUser = {
  id: 'uuid-teacher-001',
  email: 'teacher@edupilot.kr',
  name: '박서연',
  role: 'teacher',
  avatar_url: null,
  created_at: '2025-09-01',
};

export const mockAdminUser = {
  id: 'uuid-admin-001',
  email: 'admin@edupilot.kr',
  name: '이정우',
  role: 'admin',
  avatar_url: null,
  created_at: '2025-08-01',
};

// --- 커리큘럼 (6개월 과정) ---
export const mockCurriculum = [
  {
    id: 1,
    phase: 1,
    title: 'Python 기초',
    description: 'Python 문법, 자료형, 함수, 클래스, 파일 입출력 등 프로그래밍 기초를 학습합니다.',
    start_date: '2025-10-01',
    end_date: '2025-10-31',
    status: 'completed',
    progress: 100,
    tasks: [
      { name: '변수와 자료형', progress: 100 },
      { name: '조건문과 반복문', progress: 100 },
      { name: '함수와 모듈', progress: 100 },
      { name: '클래스와 OOP', progress: 100 },
      { name: '파일 입출력', progress: 100 },
    ],
  },
  {
    id: 2,
    phase: 2,
    title: 'JavaScript & React',
    description: 'JavaScript ES6+, React 18, 컴포넌트 설계, 상태 관리를 학습합니다.',
    start_date: '2025-11-01',
    end_date: '2025-12-15',
    status: 'completed',
    progress: 100,
    tasks: [
      { name: 'JS 기초 문법', progress: 100 },
      { name: 'DOM 조작', progress: 100 },
      { name: 'React 컴포넌트', progress: 100 },
      { name: 'Hooks & Context', progress: 100 },
      { name: '프로젝트 실습', progress: 100 },
    ],
  },
  {
    id: 3,
    phase: 3,
    title: 'DB & SQL',
    description: 'PostgreSQL, 데이터 모델링, SQL 쿼리, 인덱싱, 트랜잭션을 학습합니다.',
    start_date: '2025-12-16',
    end_date: '2026-01-31',
    status: 'completed',
    progress: 100,
    tasks: [
      { name: '관계형 DB 개념', progress: 100 },
      { name: 'SQL CRUD', progress: 100 },
      { name: 'JOIN과 서브쿼리', progress: 100 },
      { name: '인덱싱과 최적화', progress: 100 },
      { name: 'Supabase 실습', progress: 100 },
    ],
  },
  {
    id: 4,
    phase: 4,
    title: '알고리즘 & 자료구조',
    description: '배열, 연결리스트, 트리, 그래프, 정렬, 탐색 알고리즘을 학습합니다.',
    start_date: '2026-02-01',
    end_date: '2026-02-28',
    status: 'in_progress',
    progress: 65,
    tasks: [
      { name: '배열과 문자열', progress: 100 },
      { name: '스택과 큐', progress: 100 },
      { name: '트리와 그래프', progress: 100 },
      { name: '정렬 알고리즘', progress: 50 },
      { name: '동적 프로그래밍', progress: 0 },
    ],
  },
  {
    id: 5,
    phase: 5,
    title: '프로젝트 & 협업',
    description: '팀 프로젝트, Git 협업, CI/CD, 코드 리뷰, Agile 방법론을 실습합니다.',
    start_date: '2026-03-01',
    end_date: '2026-03-31',
    status: 'upcoming',
    progress: 0,
    tasks: [
      { name: 'Git & GitHub 협업', progress: 0 },
      { name: '프로젝트 설계', progress: 0 },
      { name: 'API 개발', progress: 0 },
      { name: '프론트엔드 개발', progress: 0 },
      { name: '배포와 발표', progress: 0 },
    ],
  },
  {
    id: 6,
    phase: 6,
    title: 'ML/DL 입문 & 취업준비',
    description: '머신러닝 기초, 딥러닝 입문, 포트폴리오 정리, 이력서 작성, 면접 준비를 합니다.',
    start_date: '2026-04-01',
    end_date: '2026-04-30',
    status: 'upcoming',
    progress: 0,
    tasks: [
      { name: 'ML 기초 이론', progress: 0 },
      { name: '사이킷런 실습', progress: 0 },
      { name: '딥러닝 입문', progress: 0 },
      { name: '포트폴리오 정리', progress: 0 },
      { name: '모의면접', progress: 0 },
    ],
  },
];

// --- 데일리 문제 ---
export const mockProblems = [
  {
    id: 1,
    title: 'Two Sum 문제',
    description: '정수 배열 nums와 정수 target이 주어질 때, 합이 target이 되는 두 수의 인덱스를 반환하세요.\n\n예시:\nInput: nums = [2, 7, 11, 15], target = 9\nOutput: [0, 1]\n\n제약 조건:\n- 2 <= nums.length <= 10^4\n- 각 입력에 대해 정확히 하나의 답이 존재합니다.',
    type: 'code',
    difficulty: '하',
    tags: ['배열', '해시맵'],
    date: '2026-04-07',
    submitted: false,
    score: null,
  },
  {
    id: 2,
    title: 'HTTP 상태 코드 의미',
    description: '다음 HTTP 상태 코드의 의미를 올바르게 연결하세요.\n\nA) 200\nB) 301\nC) 404\nD) 500',
    type: 'multiple_choice',
    difficulty: '하',
    tags: ['웹', 'HTTP'],
    date: '2026-04-07',
    submitted: true,
    score: 100,
    choices: [
      'A-OK, B-Moved Permanently, C-Not Found, D-Internal Server Error',
      'A-Created, B-Redirect, C-Forbidden, D-Bad Gateway',
      'A-OK, B-Found, C-Unauthorized, D-Server Error',
      'A-Accepted, B-Redirect, C-Not Found, D-Gateway Timeout',
    ],
    correctAnswer: 0,
  },
  {
    id: 3,
    title: 'React에서 useEffect의 역할',
    description: 'React의 useEffect 훅이 수행하는 역할과 사용 시 주의사항에 대해 설명하세요.',
    type: 'short_answer',
    difficulty: '중',
    tags: ['React', 'Hooks'],
    date: '2026-04-06',
    submitted: true,
    score: 85,
  },
  {
    id: 4,
    title: '이진 탐색 구현',
    description: '정렬된 배열에서 target 값의 인덱스를 반환하는 이진 탐색 함수를 구현하세요.\n\ntarget이 없으면 -1을 반환합니다.',
    type: 'code',
    difficulty: '중',
    tags: ['알고리즘', '이진탐색'],
    date: '2026-04-06',
    submitted: true,
    score: 90,
  },
  {
    id: 5,
    title: 'SQL JOIN 종류 비교',
    description: 'INNER JOIN, LEFT JOIN, RIGHT JOIN, FULL OUTER JOIN의 차이점을 설명하고, 각각의 사용 사례를 예시와 함께 서술하세요.',
    type: 'short_answer',
    difficulty: '중',
    tags: ['DB', 'SQL'],
    date: '2026-04-05',
    submitted: true,
    score: 75,
  },
  {
    id: 6,
    title: '스택을 이용한 괄호 검사',
    description: '주어진 문자열에서 괄호 (), {}, []가 올바르게 짝지어져 있는지 검사하는 함수를 작성하세요.',
    type: 'code',
    difficulty: '중',
    tags: ['자료구조', '스택'],
    date: '2026-04-05',
    submitted: false,
    score: null,
  },
  {
    id: 7,
    title: 'Git Rebase vs Merge',
    description: 'Git에서 rebase와 merge의 차이점은 무엇인가요?',
    type: 'multiple_choice',
    difficulty: '하',
    tags: ['Git', '협업'],
    date: '2026-04-04',
    submitted: true,
    score: 100,
    choices: [
      'Rebase는 커밋 히스토리를 선형으로 만들고, Merge는 병합 커밋을 생성한다',
      'Rebase와 Merge는 완전히 동일한 결과를 만든다',
      'Merge만 충돌이 발생할 수 있다',
      'Rebase는 원격 브랜치에서만 사용 가능하다',
    ],
    correctAnswer: 0,
  },
  {
    id: 8,
    title: 'BFS와 DFS 구현',
    description: '그래프의 인접 리스트가 주어질 때, BFS와 DFS를 모두 구현하세요.\n\nInput: graph = {0: [1,2], 1: [0,3], 2: [0,3], 3: [1,2]}, start = 0',
    type: 'code',
    difficulty: '상',
    tags: ['그래프', '탐색'],
    date: '2026-04-04',
    submitted: true,
    score: 70,
  },
  {
    id: 9,
    title: 'REST API 설계 원칙',
    description: 'RESTful API의 핵심 설계 원칙 5가지를 나열하고 각각을 간단히 설명하세요.',
    type: 'short_answer',
    difficulty: '중',
    tags: ['API', 'REST'],
    date: '2026-04-03',
    submitted: true,
    score: 80,
  },
  {
    id: 10,
    title: '동적 프로그래밍: 피보나치',
    description: 'n번째 피보나치 수를 DP 방식(bottom-up)으로 구하는 함수를 작성하세요.\n시간 복잡도 O(n), 공간 복잡도 O(1)로 구현하세요.',
    type: 'code',
    difficulty: '상',
    tags: ['DP', '알고리즘'],
    date: '2026-04-03',
    submitted: false,
    score: null,
  },
  {
    id: 11,
    title: 'CSS Flexbox vs Grid',
    description: 'CSS Flexbox와 Grid의 주요 차이점과 각각 적합한 사용 사례를 설명하세요.',
    type: 'short_answer',
    difficulty: '하',
    tags: ['CSS', '레이아웃'],
    date: '2026-04-02',
    submitted: true,
    score: 95,
  },
  {
    id: 12,
    title: 'LRU 캐시 구현',
    description: 'LRU(Least Recently Used) 캐시를 구현하세요.\n\nget(key): key가 존재하면 값을 반환하고 사용 순서를 갱신\nput(key, value): key-value를 저장하고, 용량 초과 시 가장 오래된 항목 삭제',
    type: 'code',
    difficulty: '상',
    tags: ['자료구조', '해시맵'],
    date: '2026-04-02',
    submitted: true,
    score: 60,
  },
];

// --- 스킬 점수 (레이더 차트용) ---
export const mockSkillScores = [
  { subject: 'Python', score: 78, fullMark: 100 },
  { subject: 'JavaScript', score: 65, fullMark: 100 },
  { subject: 'DB/SQL', score: 52, fullMark: 100 },
  { subject: '알고리즘', score: 58, fullMark: 100 },
  { subject: '프로젝트', score: 82, fullMark: 100 },
  { subject: 'ML/DL', score: 25, fullMark: 100 },
];

// --- 뱃지 ---
export const mockBadges = [
  { id: 1, name: '첫 걸음', icon: 'Footprints', description: '첫 문제 제출 완료', earned: true, earned_date: '2025-10-05' },
  { id: 2, name: '연속 7일', icon: 'Flame', description: '7일 연속 문제 제출', earned: true, earned_date: '2025-10-15' },
  { id: 3, name: '만점왕', icon: 'Crown', description: '100점 문제 5개 달성', earned: true, earned_date: '2025-12-20' },
  { id: 4, name: '알고리즘 마스터', icon: 'Trophy', description: '상 난이도 문제 10개 해결', earned: false, earned_date: null },
];

// --- 기여 그래프 (잔디) 365일 데이터 ---
const generateContributions = () => {
  const data = [];
  const today = new Date('2026-04-07');
  for (let i = 364; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dayOfWeek = date.getDay();
    let count = 0;
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count = Math.random() > 0.2 ? Math.floor(Math.random() * 4) + 1 : 0;
    }
    data.push({
      date: date.toISOString().split('T')[0],
      count,
    });
  }
  return data;
};
export const mockContributions = generateContributions();

// --- 취업 예측 ---
export const mockCareerPrediction = {
  probability: 78,
  avg_salary: 3200,
  recommended_field: '풀스택 개발',
  similar_graduates: 5,
  strengths: ['프로젝트 경험', 'Python 역량'],
  improvements: ['알고리즘 심화', 'ML/DL 학습'],
};

// --- 음성 피드백 키워드 ---
export const mockKeywords = [
  { id: 1, word: 'HTTP 프로토콜', status: 'correct' },
  { id: 2, word: 'TCP/IP', status: 'correct' },
  { id: 3, word: 'DNS 조회', status: 'inaccurate' },
  { id: 4, word: '3-way handshake', status: 'missing' },
  { id: 5, word: 'SSL/TLS', status: 'correct' },
  { id: 6, word: '로드밸런싱', status: 'missing' },
];

export const mockVoiceFeedbackResult = {
  score: 72,
  total_keywords: 6,
  correct: 3,
  inaccurate: 1,
  missing: 2,
  feedback: '핵심 개념인 HTTP 프로토콜과 TCP/IP에 대해 잘 설명했습니다. 하지만 3-way handshake와 로드밸런싱에 대한 언급이 없었습니다. DNS 조회 과정에 대한 설명이 부정확했으니 복습이 필요합니다.',
  topic: '웹 브라우저에 URL을 입력하면 일어나는 일',
};

// --- 모의면접 ---
export const mockInterviewMessages = [
  { id: 1, role: 'ai', content: '안녕하세요! AI 모의면접을 시작하겠습니다. 자기소개를 해주세요.' },
  { id: 2, role: 'user', content: '안녕하세요. 저는 6개월 IT 직업훈련 과정을 수강 중인 김민준입니다. Python과 JavaScript를 주로 다루며, 풀스택 개발자를 목표로 하고 있습니다.' },
  { id: 3, role: 'ai', content: '좋습니다. Python에서 리스트와 튜플의 차이점에 대해 설명해주세요.' },
  { id: 4, role: 'user', content: '리스트는 변경 가능(mutable)한 자료형이고, 튜플은 변경 불가능(immutable)한 자료형입니다. 리스트는 대괄호[]로, 튜플은 소괄호()로 생성합니다.' },
  { id: 5, role: 'ai', content: '정확합니다. 그렇다면 튜플을 사용하면 좋은 상황은 어떤 것이 있을까요?' },
  { id: 6, role: 'user', content: '딕셔너리의 키로 사용할 때, 함수에서 여러 값을 반환할 때, 그리고 데이터가 변경되지 않아야 할 때 튜플을 사용합니다.' },
  { id: 7, role: 'ai', content: 'REST API에서 GET과 POST 메서드의 차이를 설명해주세요.' },
];

export const mockInterviewReport = {
  total_score: 82,
  categories: [
    { name: '기술 지식', score: 85 },
    { name: '문제 해결', score: 78 },
    { name: '커뮤니케이션', score: 88 },
    { name: '구조화', score: 75 },
  ],
  summary: '전반적으로 기술 개념에 대한 이해도가 높고, 답변이 간결하고 명확합니다. 문제 해결 과정을 좀 더 단계적으로 설명하면 더 좋겠습니다.',
  improvements: [
    '답변 시 구체적인 예시를 더 추가하세요',
    '문제 해결 과정을 단계별로 나누어 설명하세요',
    '실무 경험과 연결지어 답변하면 좋습니다',
  ],
};

export const mockInterviewHistory = [
  { id: 1, company: '네이버', position: '프론트엔드 개발자', date: '2026-04-05', score: 82, mode: 'text' },
  { id: 2, company: '카카오', position: '백엔드 개발자', date: '2026-04-02', score: 75, mode: 'voice' },
  { id: 3, company: '라인', position: '풀스택 개발자', date: '2026-03-28', score: 88, mode: 'text' },
];

// --- 채용 매칭 ---
export const mockJobs = [
  { id: 1, company: '테크스타트', position: '주니어 프론트엔드 개발자', match_score: 92, tech_stack: ['React', 'TypeScript', 'Tailwind'], deadline: '2026-04-30', location: '서울 강남구', experience: '신입' },
  { id: 2, company: '데이터브릿지', position: '주니어 백엔드 개발자', match_score: 85, tech_stack: ['Python', 'FastAPI', 'PostgreSQL'], deadline: '2026-04-25', location: '서울 서초구', experience: '신입' },
  { id: 3, company: '클라우드나인', position: '풀스택 개발자', match_score: 78, tech_stack: ['React', 'Node.js', 'AWS'], deadline: '2026-05-15', location: '서울 마포구', experience: '신입~1년' },
  { id: 4, company: '에이아이랩', position: 'ML 엔지니어', match_score: 45, tech_stack: ['Python', 'PyTorch', 'Docker'], deadline: '2026-05-01', location: '성남 분당구', experience: '신입~2년' },
  { id: 5, company: '핀테크원', position: '웹 개발자', match_score: 88, tech_stack: ['JavaScript', 'React', 'Node.js'], deadline: '2026-04-20', location: '서울 영등포구', experience: '신입' },
  { id: 6, company: '헬스케어IT', position: '주니어 개발자', match_score: 72, tech_stack: ['Java', 'Spring', 'MySQL'], deadline: '2026-05-10', location: '서울 강서구', experience: '신입' },
  { id: 7, company: '에듀테크코리아', position: '프론트엔드 개발자', match_score: 90, tech_stack: ['React', 'Next.js', 'Tailwind'], deadline: '2026-04-28', location: '서울 성동구', experience: '신입' },
  { id: 8, company: '로보틱스랩', position: '임베디드 SW 개발자', match_score: 30, tech_stack: ['C++', 'Python', 'ROS'], deadline: '2026-05-20', location: '대전 유성구', experience: '신입~1년' },
];

// --- 출석 기록 ---
export const mockAttendance = [
  { date: '2026-04-01', status: 'present', time: '08:55' },
  { date: '2026-04-02', status: 'present', time: '08:58' },
  { date: '2026-04-03', status: 'late', time: '09:12' },
  { date: '2026-04-04', status: 'present', time: '08:50' },
  { date: '2026-04-05', status: 'absent', time: null },
  { date: '2026-04-06', status: 'present', time: '08:57' },
  { date: '2026-04-07', status: null, time: null },
];

export const mockAttendanceMonthly = {
  year: 2026,
  month: 4,
  total_days: 22,
  present: 15,
  late: 3,
  absent: 2,
  rate: 81.8,
};

// --- 장비 ---
export const mockEquipment = [
  { id: 1, name: 'MacBook Pro 14"', serial: 'MBP-2024-001', category: '노트북', status: 'available', borrower: null, borrowed_date: null },
  { id: 2, name: 'MacBook Pro 14"', serial: 'MBP-2024-002', category: '노트북', status: 'borrowed', borrower: '김민준', borrower_id: 'uuid-student-001', borrowed_date: '2026-03-15' },
  { id: 3, name: 'Dell Monitor 27"', serial: 'MON-2024-001', category: '모니터', status: 'available', borrower: null, borrowed_date: null },
  { id: 4, name: 'Dell Monitor 27"', serial: 'MON-2024-002', category: '모니터', status: 'borrowed', borrower: '이지호', borrower_id: 'uuid-student-003', borrowed_date: '2026-04-01' },
  { id: 5, name: '무선 키보드', serial: 'KB-2024-001', category: '주변기기', status: 'available', borrower: null, borrowed_date: null },
  { id: 6, name: '무선 마우스', serial: 'MS-2024-001', category: '주변기기', status: 'maintenance', borrower: null, borrowed_date: null },
  { id: 7, name: 'iPad Air', serial: 'IPA-2024-001', category: '태블릿', status: 'available', borrower: null, borrowed_date: null },
  { id: 8, name: 'Wacom 펜타블렛', serial: 'WAC-2024-001', category: '주변기기', status: 'borrowed', borrower: '박수현', borrower_id: 'uuid-student-005', borrowed_date: '2026-03-20' },
  { id: 9, name: 'USB-C 허브', serial: 'HUB-2024-001', category: '주변기기', status: 'retired', borrower: null, borrowed_date: null },
  { id: 10, name: 'MacBook Air', serial: 'MBA-2024-001', category: '노트북', status: 'available', borrower: null, borrowed_date: null },
];

export const mockEquipmentRequests = [
  { id: 1, student_name: '최유나', equipment_name: 'iPad Air', request_date: '2026-04-06', reason: '디자인 수업 실습용', status: 'pending' },
  { id: 2, student_name: '한도윤', equipment_name: 'Dell Monitor 27"', request_date: '2026-04-05', reason: '듀얼 모니터 개발 환경 구축', status: 'pending' },
  { id: 3, student_name: '정서율', equipment_name: 'MacBook Air', request_date: '2026-04-07', reason: '개인 노트북 고장으로 대체 필요', status: 'pending' },
];

// --- 질문 (익명) ---
export const mockQuestions = [
  { id: 1, content: 'Python에서 decorator는 언제 사용하나요? 실무에서 자주 쓰이나요?', is_anonymous: true, created_at: '2026-04-07 10:30', author: null },
  { id: 2, content: 'React에서 useMemo와 useCallback의 차이가 헷갈립니다. 간단한 예시를 들어 설명해주실 수 있나요?', is_anonymous: true, created_at: '2026-04-07 09:15', author: null },
  { id: 3, content: 'SQL에서 인덱스를 너무 많이 걸면 오히려 성능이 떨어진다고 했는데 이유가 뭔가요?', is_anonymous: false, created_at: '2026-04-06 16:45', author: '김민준' },
  { id: 4, content: 'Git에서 cherry-pick은 어떤 상황에서 쓰나요?', is_anonymous: true, created_at: '2026-04-06 14:20', author: null },
  { id: 5, content: '비동기 프로그래밍에서 Promise와 async/await의 내부 동작 원리가 궁금합니다.', is_anonymous: true, created_at: '2026-04-05 11:00', author: null },
  { id: 6, content: 'Docker 없이 개발해도 되나요? Docker를 왜 배워야 하나요?', is_anonymous: true, created_at: '2026-04-05 09:30', author: null },
  { id: 7, content: '포트폴리오에 어떤 프로젝트를 넣는 게 취업에 유리한가요?', is_anonymous: false, created_at: '2026-04-04 15:00', author: '이지호' },
];

export const mockQuestionClusters = [
  { id: 1, topic: 'React 심화 개념', count: 8, representative: 'useMemo, useCallback, React 렌더링 최적화 관련 질문이 많습니다.', questions: [2] },
  { id: 2, topic: '비동기 프로그래밍', count: 5, representative: 'Promise, async/await, 이벤트 루프 관련 질문입니다.', questions: [5] },
  { id: 3, topic: 'DevOps/배포', count: 4, representative: 'Docker, CI/CD, 배포 환경 관련 질문입니다.', questions: [6] },
  { id: 4, topic: '취업/커리어', count: 6, representative: '포트폴리오, 이력서, 면접 준비 관련 질문입니다.', questions: [7] },
  { id: 5, topic: 'Python 고급', count: 3, representative: 'decorator, generator, 메타클래스 관련 질문입니다.', questions: [1] },
];

// --- 학생 리스트 (강사 뷰) ---
export const mockStudents = [
  { id: 'uuid-student-001', name: '김민준', email: 'minjun@edupilot.kr', attendance_rate: 91, submission_rate: 88, accuracy: 76, is_at_risk: false, last_active: '2026-04-07', enrolled_at: '2025-10-01', skills: { Python: 78, JavaScript: 65, 'DB/SQL': 52, '알고리즘': 58, '프로젝트': 82, 'ML/DL': 25 } },
  { id: 'uuid-student-002', name: '이서윤', email: 'seoyun@edupilot.kr', attendance_rate: 95, submission_rate: 92, accuracy: 88, is_at_risk: false, last_active: '2026-04-07', enrolled_at: '2025-10-01', skills: { Python: 85, JavaScript: 78, 'DB/SQL': 70, '알고리즘': 72, '프로젝트': 90, 'ML/DL': 40 } },
  { id: 'uuid-student-003', name: '이지호', email: 'jiho@edupilot.kr', attendance_rate: 72, submission_rate: 55, accuracy: 62, is_at_risk: true, last_active: '2026-04-04', enrolled_at: '2025-10-01', skills: { Python: 50, JavaScript: 42, 'DB/SQL': 35, '알고리즘': 30, '프로젝트': 55, 'ML/DL': 10 } },
  { id: 'uuid-student-004', name: '박하은', email: 'haeun@edupilot.kr', attendance_rate: 88, submission_rate: 82, accuracy: 71, is_at_risk: false, last_active: '2026-04-07', enrolled_at: '2025-10-01', skills: { Python: 70, JavaScript: 60, 'DB/SQL': 55, '알고리즘': 48, '프로젝트': 75, 'ML/DL': 20 } },
  { id: 'uuid-student-005', name: '박수현', email: 'suhyun@edupilot.kr', attendance_rate: 93, submission_rate: 90, accuracy: 82, is_at_risk: false, last_active: '2026-04-07', enrolled_at: '2025-10-01', skills: { Python: 80, JavaScript: 72, 'DB/SQL': 68, '알고리즘': 65, '프로젝트': 85, 'ML/DL': 35 } },
  { id: 'uuid-student-006', name: '최유나', email: 'yuna@edupilot.kr', attendance_rate: 78, submission_rate: 48, accuracy: 55, is_at_risk: true, last_active: '2026-04-03', enrolled_at: '2025-10-01', skills: { Python: 40, JavaScript: 35, 'DB/SQL': 28, '알고리즘': 22, '프로젝트': 50, 'ML/DL': 8 } },
  { id: 'uuid-student-007', name: '정서율', email: 'seoyul@edupilot.kr', attendance_rate: 97, submission_rate: 95, accuracy: 91, is_at_risk: false, last_active: '2026-04-07', enrolled_at: '2025-10-01', skills: { Python: 90, JavaScript: 85, 'DB/SQL': 78, '알고리즘': 80, '프로젝트': 92, 'ML/DL': 50 } },
  { id: 'uuid-student-008', name: '한도윤', email: 'doyun@edupilot.kr', attendance_rate: 85, submission_rate: 78, accuracy: 68, is_at_risk: false, last_active: '2026-04-06', enrolled_at: '2025-10-01', skills: { Python: 65, JavaScript: 58, 'DB/SQL': 45, '알고리즘': 42, '프로젝트': 70, 'ML/DL': 15 } },
  { id: 'uuid-student-009', name: '강예린', email: 'yerin@edupilot.kr', attendance_rate: 68, submission_rate: 42, accuracy: 50, is_at_risk: true, last_active: '2026-04-01', enrolled_at: '2025-10-01', skills: { Python: 35, JavaScript: 30, 'DB/SQL': 20, '알고리즘': 18, '프로젝트': 40, 'ML/DL': 5 } },
  { id: 'uuid-student-010', name: '윤시우', email: 'siwoo@edupilot.kr', attendance_rate: 90, submission_rate: 85, accuracy: 79, is_at_risk: false, last_active: '2026-04-07', enrolled_at: '2025-10-01', skills: { Python: 75, JavaScript: 68, 'DB/SQL': 60, '알고리즘': 55, '프로젝트': 80, 'ML/DL': 30 } },
  { id: 'uuid-student-011', name: '임채원', email: 'chaewon@edupilot.kr', attendance_rate: 92, submission_rate: 88, accuracy: 84, is_at_risk: false, last_active: '2026-04-07', enrolled_at: '2025-10-01', skills: { Python: 82, JavaScript: 75, 'DB/SQL': 65, '알고리즘': 70, '프로젝트': 88, 'ML/DL': 38 } },
  { id: 'uuid-student-012', name: '조현우', email: 'hyunwoo@edupilot.kr', attendance_rate: 82, submission_rate: 72, accuracy: 65, is_at_risk: false, last_active: '2026-04-06', enrolled_at: '2025-10-01', skills: { Python: 60, JavaScript: 55, 'DB/SQL': 48, '알고리즘': 40, '프로젝트': 65, 'ML/DL': 18 } },
];

// --- 상담 기록 ---
export const mockCounselingRecords = [
  {
    id: 1,
    student_name: '이지호',
    date: '2026-04-03',
    duration: '25분',
    summary: '출석률 저하 원인 파악. 개인 사정(가족 건강 문제)으로 인한 불규칙 출석. 유연한 학습 계획 수립 논의.',
    action_items: ['출석 유연화 방안 검토', '온라인 보충학습 자료 제공', '다음 주 재상담 예약'],
    speakers: ['강사: 박서연', '학생: 이지호'],
  },
  {
    id: 2,
    student_name: '최유나',
    date: '2026-03-28',
    duration: '30분',
    summary: '학습 진도 부진 상담. Python 기초 부분에서 어려움 경험. 추가 튜터링 세션 배정.',
    action_items: ['Python 기초 보충 교재 제공', '주 2회 방과후 튜터링 배정', '학습 일지 작성 시작'],
    speakers: ['강사: 박서연', '학생: 최유나'],
  },
  {
    id: 3,
    student_name: '강예린',
    date: '2026-03-25',
    duration: '20분',
    summary: '동기부여 저하 상담. 목표 재설정 필요. 관심 분야(디자인+개발) 탐색 권유.',
    action_items: ['UI/UX 관련 부가 학습 자료 제공', '소규모 프로젝트 참여 기회 제공', '멘토 매칭'],
    speakers: ['강사: 박서연', '학생: 강예린'],
  },
];

// --- 사이드바 메뉴 ---
export const studentMenuItems = [
  { key: 'mypage', label: '마이페이지', icon: 'User', path: '/student', group: '내 정보' },
  { key: 'dashboard', label: '커리큘럼 로드맵', icon: 'Map', path: '/student/dashboard', group: '내 정보' },
  { key: 'attendance', label: '출석', icon: 'Calendar', path: '/student/attendance', group: '내 정보' },
  { key: 'problems', label: '일일문제', icon: 'FileText', path: '/student/problems', group: '학습' },
  { key: 'voice-feedback', label: '음성 피드백', icon: 'Mic', path: '/student/voice-feedback', group: '학습' },
  { key: 'questions', label: '익명 질문', icon: 'HelpCircle', path: '/student/questions', group: '학습' },
  { key: 'mock-interview', label: 'AI 모의면접', icon: 'MessageSquare', path: '/student/mock-interview', group: '취업' },
  { key: 'jobs', label: '채용 매칭', icon: 'Briefcase', path: '/student/jobs', group: '취업' },
  { key: 'equipment', label: '장비 대여', icon: 'Monitor', path: '/student/equipment', group: '기타' },
];

export const teacherMenuItems = [
  { key: 'dashboard', label: '대시보드', icon: 'LayoutDashboard', path: '/teacher', group: '홈' },
  { key: 'problems', label: '문제 관리', icon: 'FileEdit', path: '/teacher/problems', group: '수업 관리' },
  { key: 'questions', label: '질문 요약', icon: 'HelpCircle', path: '/teacher/questions', group: '학생 지원' },
  { key: 'counseling', label: '상담 기록', icon: 'Headphones', path: '/teacher/counseling', group: '학생 지원' },
];

export const adminMenuItems = [
  { key: 'dashboard', label: '대시보드', icon: 'LayoutDashboard', path: '/admin', group: '홈' },
  { key: 'students', label: '학생 관리', icon: 'Users', path: '/admin/students', group: '인원 관리' },
  { key: 'equipment', label: '장비 관리', icon: 'Monitor', path: '/admin/equipment', group: '운영 관리' },
];
