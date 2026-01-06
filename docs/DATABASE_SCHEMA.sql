-- =====================================================
-- 일손 MVP - 시니어 채용 플랫폼 데이터베이스 스키마
-- Supabase SQL Editor에서 실행하세요
-- =====================================================

-- 1. 시니어 구직자 테이블
CREATE TABLE workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  phone VARCHAR(20) NOT NULL UNIQUE,
  address TEXT,
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  birth_year INTEGER,
  job_types TEXT[],
  available_times TEXT[],
  kakao_id VARCHAR(100),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 구인 기업 테이블
CREATE TABLE employers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name VARCHAR(100) NOT NULL,
  contact_name VARCHAR(50),
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(100),
  address TEXT,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 일자리 공고 테이블
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID REFERENCES employers(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  job_type VARCHAR(50),
  address TEXT NOT NULL,
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  hourly_wage INTEGER,
  work_hours VARCHAR(50),
  work_days VARCHAR(50),
  description TEXT,
  requirements TEXT,
  benefits TEXT,
  headcount INTEGER DEFAULT 1,
  status VARCHAR(20) DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 지원 내역 테이블
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  worker_id UUID REFERENCES workers(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending',
  memo TEXT,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(job_id, worker_id)
);

-- 5. 카카오 알림 로그 테이블
CREATE TABLE kakao_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID REFERENCES workers(id) ON DELETE SET NULL,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  template_code VARCHAR(50),
  message TEXT,
  phone VARCHAR(20),
  status VARCHAR(20) DEFAULT 'pending',
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- RLS (Row Level Security) 정책
-- =====================================================

-- RLS 활성화
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE employers ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE kakao_notifications ENABLE ROW LEVEL SECURITY;

-- 공개 읽기 정책 (MVP 단계에서는 간단하게)
CREATE POLICY "Anyone can read workers" ON workers FOR SELECT USING (true);
CREATE POLICY "Anyone can insert workers" ON workers FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update workers" ON workers FOR UPDATE USING (true);

CREATE POLICY "Anyone can read employers" ON employers FOR SELECT USING (true);
CREATE POLICY "Anyone can insert employers" ON employers FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update employers" ON employers FOR UPDATE USING (true);

CREATE POLICY "Anyone can read jobs" ON jobs FOR SELECT USING (true);
CREATE POLICY "Anyone can insert jobs" ON jobs FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update jobs" ON jobs FOR UPDATE USING (true);

CREATE POLICY "Anyone can read applications" ON applications FOR SELECT USING (true);
CREATE POLICY "Anyone can insert applications" ON applications FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update applications" ON applications FOR UPDATE USING (true);

CREATE POLICY "Anyone can read notifications" ON kakao_notifications FOR SELECT USING (true);
CREATE POLICY "Anyone can insert notifications" ON kakao_notifications FOR INSERT WITH CHECK (true);

-- =====================================================
-- 샘플 데이터
-- =====================================================

-- 샘플 기업
INSERT INTO employers (company_name, contact_name, phone, email, address) VALUES
('래미안 아파트 관리사무소', '김관리', '02-1234-5678', 'raemian@test.com', '서울시 강남구 삼성동 123'),
('푸르지오 빌딩관리', '이매니저', '02-2345-6789', 'prugio@test.com', '서울시 서초구 반포동 456'),
('자이 FM서비스', '박담당', '02-3456-7890', 'xi@test.com', '경기도 성남시 분당구 정자동 789');

-- 샘플 일자리
INSERT INTO jobs (employer_id, title, job_type, address, lat, lng, hourly_wage, work_hours, work_days, description, headcount) VALUES
((SELECT id FROM employers WHERE company_name = '래미안 아파트 관리사무소'), '아파트 경비원 모집', '경비', '서울시 강남구 삼성동 123', 37.5140, 127.0565, 10500, '18:00-06:00', '격일근무', '래미안 아파트 경비 업무입니다. 야간 근무 가능하신 분 우대합니다.', 2),
((SELECT id FROM employers WHERE company_name = '푸르지오 빌딩관리'), '사무실 청소 담당자', '청소', '서울시 서초구 반포동 456', 37.5045, 127.0055, 11000, '06:00-10:00', '월-금', '오피스 빌딩 청소 업무입니다. 오전 시간대 근무입니다.', 1),
((SELECT id FROM employers WHERE company_name = '자이 FM서비스'), '주차관리 요원', '주차관리', '경기도 성남시 분당구 정자동 789', 37.3595, 127.1086, 10000, '09:00-18:00', '월-금', '아파트 주차장 관리 업무입니다.', 1),
((SELECT id FROM employers WHERE company_name = '래미안 아파트 관리사무소'), '단지 미화원', '청소', '서울시 강남구 삼성동 123', 37.5140, 127.0565, 10500, '07:00-12:00', '월-토', '아파트 단지 내 청소 및 미화 업무입니다.', 2);

-- 샘플 구직자
INSERT INTO workers (name, phone, address, lat, lng, birth_year, job_types, available_times) VALUES
('홍길동', '010-1111-2222', '서울시 강남구 역삼동', 37.5000, 127.0500, 1960, ARRAY['경비', '주차관리'], ARRAY['야간', '격일']),
('김철수', '010-3333-4444', '서울시 서초구 서초동', 37.4900, 127.0100, 1958, ARRAY['청소', '미화'], ARRAY['오전', '주간']),
('이영희', '010-5555-6666', '경기도 성남시 분당구', 37.3600, 127.1100, 1962, ARRAY['청소', '경비'], ARRAY['오전', '오후']);
