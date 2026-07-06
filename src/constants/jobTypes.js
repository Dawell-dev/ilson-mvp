// 직종 분류 SSOT (Single Source of Truth)
// 구직자 희망직종(workers.job_types) / 기업 공고직종(jobs.job_type) / 관리자 매칭 /
// 일자리목록 필터가 모두 이 목록을 공유한다.
// 한쪽만 바꾸면 매칭·필터가 깨지므로 반드시 여기서만 수정한다.
export const JOB_TYPES = ['경비/보안', '미화', '기타'];

// 직종별 표시 아이콘. 키는 JOB_TYPES와 일치해야 한다.
export const JOB_ICONS = {
  '경비/보안': '🏢',
  '미화': '🧹',
  '기타': '🔧',
};
