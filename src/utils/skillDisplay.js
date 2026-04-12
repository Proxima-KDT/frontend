/** 학생·강사 역량 차트 공통 라벨·막대 색 (SkillRadarChart AXIS_COLORS와 동일 순서) */

export const SKILL_LABEL_MAP = {
  출석: '출결',
  출결: '출결',
  'AI 말하기': 'AI 말하기 학습',
};

export function toDisplaySkillLabel(subject) {
  const s = SKILL_LABEL_MAP[subject] || subject;
  if (s.includes('출결') || subject === '출석') return '출결';
  if (s.includes('말하기')) return 'AI 말하기';
  if (s.includes('면접')) return 'AI 면접';
  if (s.includes('포트폴리오')) return '포트폴리오';
  if (s.includes('프로젝트') || s.includes('과제') || s.includes('시험'))
    return '프로젝트·과제·시험';
  return String(subject);
}

export function displaySkillFromRaw(rawKey) {
  const mapped = SKILL_LABEL_MAP[rawKey] || rawKey;
  return toDisplaySkillLabel(mapped);
}

export const SKILL_BAR_BG_CLASSES = [
  'bg-[#2563ab]',
  'bg-[#2d7a52]',
  'bg-[#b45309]',
  'bg-[#a84868]',
  'bg-[#5b4d9a]',
  'bg-[#0d9488]',
  'bg-[#7c2d12]',
];
