/**
 * 변경 요약
 * ─ Phase A (2026-04-21): 이력서 강화 ─
 * - 마이페이지 → "내 이력서" 네이밍 전환 (헤더/하단 안내 문구)
 * - 자격증 섹션 신규 (추천 칩 + 바텀시트 모달, 만료없음 체크)
 * - 운전 가능 섹션 신규 (1종/2종/없음 단일 선택, 안내 문구)
 *
 * ─ Phase B (2026-04-22): 이력서 DB 영속화 ─
 * - workers 테이블: driver_license, bio 컬럼 hydrate/save 연결
 * - worker_careers 테이블 CRUD 연동 (경력 섹션)
 * - worker_certifications 테이블 CRUD 연동 (자격증 섹션)
 * - careers/certifications state를 MainScreen으로 hoisting하여 hydrate 지원
 * - triggerSave가 workerId를 반환하여, 프로필 첫 저장 전에도 경력/자격증
 *   추가 시 자동으로 worker 레코드 생성 후 insert
 *
 * ─ Phase C (2026-04-23): 위치 변경 기능 ─
 * - 위치바 클릭 시 LocationPickerModal 바텀시트 노출
 * - Nominatim forward search로 한국 동·읍·면 검색 (debounce 400ms, 한국만)
 * - "내 위치로 찾기" 버튼으로 GPS 재확인 가능
 * - 검색/선택 시 region state 즉시 갱신
 */
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { JOB_ICONS } from '../constants/jobTypes';
import { haversine, formatDistance, walkMinutes } from '../lib/distance';
// lucide-react 제거 — AppIcon을 커스텀 SVG로 교체

// ─── 데이터 유틸 ───

function formatJobFromDB(job, coords) {
  const icon = JOB_ICONS[job.job_type] || '💼';
  // wage_type/wage_amount 우선, 기존 hourly_wage는 fallback
  const wageAmount = job.wage_amount ?? job.hourly_wage;
  const wageType = job.wage_type || 'hourly';
  const wageLabelMap = { hourly: '시급', daily: '일급', weekly: '주급', monthly: '월급' };
  const wage = wageAmount
    ? `${wageLabelMap[wageType] || '급여'} ${Number(wageAmount).toLocaleString()}원`
    : '';
  const tags = [job.work_hours, job.work_days].filter(Boolean);
  const createdAt = new Date(job.created_at);
  const now = new Date();
  const isNew = (now - createdAt) < 3 * 24 * 60 * 60 * 1000; // 3일 이내
  const hasCoord = coords && job.lat != null && job.lng != null;
  const dist = hasCoord ? haversine(coords.lat, coords.lng, job.lat, job.lng) : null;

  return {
    id: job.id,
    jobType: job.job_type,
    icon,
    title: job.title,
    location: job.address,
    pay: wage,
    tags,
    company: job.employers?.company_name || job.company_name || '',
    isNew,
    distance: dist != null ? formatDistance(dist) : null,
    dist: dist ?? Infinity,
    walkTime: dist != null ? `${walkMinutes(dist)}분` : '',
  };
}


const DISTANCES = ['1km', '3km', '5km', '전체'];

// ─── 공통 SVG ───
function KakaoIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path d="M12 3C6.48 3 2 6.58 2 10.95c0 2.82 1.87 5.3 4.69 6.7-.15.53-.96 3.43-1 3.58 0 .05.02.1.06.13.04.02.09.01.13-.01.17-.03 3.18-2.1 3.68-2.44.79.12 1.6.18 2.44.18 5.52 0 10-3.58 10-7.95S17.52 3 12 3z" fill="#191919" />
    </svg>
  );
}

// 걷는 사람 + 위치핀 아이콘
function AppIcon() {
  return (
    <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
      <path d="M26 4C17.16 4 10 11.16 10 20C10 31.5 26 48 26 48C26 48 42 31.5 42 20C42 11.16 34.84 4 26 4Z"
        fill="rgba(255,255,255,0.2)" stroke="white" strokeWidth="1.5"/>
      <circle cx="26" cy="15" r="4" fill="white"/>
      <line x1="26" y1="19" x2="22" y2="27" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
      <line x1="26" y1="19" x2="30" y2="27" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
      <line x1="22" y1="23" x2="30" y2="23" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <line x1="22" y1="27" x2="19" y2="33" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
      <line x1="30" y1="27" x2="33" y2="33" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
    </svg>
  );
}

// ─── 유틸 ───
function formatPhone(e) {
  let v = e.target.value.replace(/[^0-9]/g, '');
  if (v.length > 3 && v.length <= 7) v = v.slice(0, 3) + '-' + v.slice(3);
  else if (v.length > 7) v = v.slice(0, 3) + '-' + v.slice(3, 7) + '-' + v.slice(7, 11);
  e.target.value = v;
}

function getFiltered(jobs, distance) {
  const max = distance === '1km' ? 1 : distance === '3km' ? 3 : distance === '5km' ? 5 : 999;
  return jobs.filter((j) => j.dist <= max);
}

// 🆕 Nominatim 결과 → 한국식 풀 주소 ("시/도 + 구/군 + 동/읍/면")
// 예) "서울특별시 강남구 삼성동", "경기도 수원시 팔달구"
function extractFullAddress(item) {
  const addr = item.address || {};

  // 1단계: 시/도
  const level1 = addr.state || addr.province || addr.region || '';

  // 2단계: 시/군/구
  //  - 서울/광역시: state=서울특별시, city_district=강남구
  //  - 경기도 등: state=경기도, city=수원시 또는 county=남양주시
  const level2 =
    addr.city_district ||
    addr.borough ||
    addr.county ||
    (addr.city && addr.city !== level1 ? addr.city : '');

  // 3단계: 동/읍/면
  const level3 =
    addr.suburb ||
    addr.village ||
    addr.town ||
    addr.neighbourhood ||
    addr.hamlet ||
    '';

  // 조합 후 중복 제거 (같은 값이 여러 단계에 들어간 경우 대비)
  const parts = [level1, level2, level3].filter(p => p && p.trim());
  const unique = [...new Set(parts)];

  if (unique.length > 0) return unique.join(' ');

  // fallback: display_name 역순 조립 (한국 주소는 일반적으로 "동, 구, 시, 대한민국" 순서)
  const tokens = (item.display_name || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .filter(t => t !== '대한민국' && t !== 'South Korea' && t !== 'Korea');
  return tokens.reverse().join(' ') || '알 수 없는 주소';
}




// ─────────────────────────────────────
// 1) 로그인 화면
// ─────────────────────────────────────
function LoginScreen({ onNext, onBack }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPhone, setShowPhone] = useState(false);

  const handleKakao = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: window.location.origin,
        scopes: 'profile_nickname profile_image account_email'
      }
    });
    if (error) {
      alert('로그인 중 오류가 발생했습니다.');
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#F5F0EB' }}>
      {onBack && (
        <button
          onClick={onBack}
          className="absolute top-4 left-4 z-10 w-11 h-11 rounded-full flex items-center justify-center bg-white/80 shadow-sm active:scale-90 transition-transform"
          style={{ color: '#888780', fontSize: '20px' }}
          aria-label="닫기"
        >
          ✕
        </button>
      )}
      {/* 상단 로고 + 슬로건 */}
      <div className="flex-1 flex flex-col justify-center items-center px-[30px] pt-[60px] pb-5">
        <div className="mb-7 animate-fade-up">
          <div className="flex flex-col items-center gap-3.5">
            <div className="w-[88px] h-[88px] rounded-[22px] flex items-center justify-center shadow-[0_8px_28px_rgba(232,92,30,0.35)]" style={{ background: '#E85C1E' }}>
              <AppIcon />
            </div>
            <div className="flex items-baseline gap-px">
              <span className="text-4xl font-black tracking-[-2px]" style={{ color: '#E85C1E' }}>일</span>
              <span className="text-4xl font-black text-[#212121] tracking-[-2px]">손</span>
            </div>
          </div>
        </div>
        <div className="animate-fade-up animation-delay-100 mt-1 mb-3">
          <span className="inline-block text-[14px] font-medium rounded-full py-1.5 px-4" style={{ background: '#FFF5F0', border: '1px solid #FDDCCC', color: '#993C1D' }}>
            걸어서 갈 수 있는 일자리
          </span>
        </div>
        <div className="animate-fade-up animation-delay-100 text-[22px] text-[#212121] font-extrabold text-center leading-snug">
          내 주변 일자리,<br />바로 알려드려요
        </div>
      </div>

      {/* 하단 버튼 영역 */}
      <div className="px-6 pb-12 pt-5">
        <button
          className="w-full py-[20px] px-6 border-none rounded-[28px] text-[19px] font-bold flex items-center justify-center gap-3 shadow-[0_4px_16px_rgba(254,229,0,0.35)] animate-fade-up animation-delay-200 active:scale-[0.97] transition-transform"
          style={{ background: '#FEE500', color: '#191919' }}
          onClick={handleKakao}
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="w-[22px] h-[22px] border-[3px] border-[rgba(25,25,25,0.15)] rounded-full animate-spin" style={{ borderTopColor: '#191919' }} />
              <span>로그인 중이에요...</span>
            </>
          ) : (
            <>
              <KakaoIcon />
              <span>카카오톡으로 바로 시작</span>
            </>
          )}
        </button>
        <div className="text-center mt-3 text-[15px] text-[#9E9E9E] leading-relaxed animate-fade-up animation-delay-250">
          터치 한 번이면 바로 시작돼요
        </div>

        {/* 기업 로그인 링크 */}
        <div className="text-center mt-4 text-[14px] text-[#888780] animate-fade-up animation-delay-300">
          기업 회원이신가요?{' '}
          <button
            onClick={() => navigate('/employer/login')}
            className="text-[#5F5E5A] underline font-medium ml-0.5"
          >
            로그인
          </button>
        </div>

        {/* 구분선 */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px" style={{ background: '#EDE8E2' }} />
          <span className="text-[13px] text-[#9E9E9E]">또는</span>
          <div className="flex-1 h-px" style={{ background: '#EDE8E2' }} />
        </div>

        {/* 전화번호 로그인 */}
        {!showPhone ? (
          <button
            className="w-full py-[18px] px-6 rounded-[28px] text-[17px] font-semibold text-[#424242] flex items-center justify-center gap-2.5"
            style={{ background: '#FBF9F7', border: '1px solid #EDE8E2' }}
            onClick={() => setShowPhone(true)}
          >
            <span className="text-[20px]">📱</span> 전화번호로 시작하기
          </button>
        ) : (
          <div className="rounded-[28px] p-5 animate-fade-in" style={{ background: '#FBF9F7', border: '2px solid #FDDCCC' }}>
            <div className="text-[17px] font-bold text-[#212121] mb-3.5">📱 전화번호를 알려주세요</div>
            <div className="flex gap-2.5 mb-2.5">
              <input
                type="tel"
                placeholder="010-0000-0000"
                onInput={formatPhone}
                className="flex-1 px-4 py-[16px] rounded-[22px] text-[19px] font-semibold tracking-wider outline-none text-[#212121]"
                style={{ border: '2px solid #EDE8E2', background: 'white' }}
              />
              <button className="px-[18px] py-[16px] text-white border-none rounded-[22px] text-[16px] font-bold whitespace-nowrap" style={{ background: '#E85C1E' }}>
                인증요청
              </button>
            </div>
            <div className="text-[14px] text-[#9E9E9E]">문자로 인증번호를 보내드릴게요</div>
          </div>
        )}

        {/* 고객센터 */}
        <div className="text-center mt-6 p-4 rounded-[18px]" style={{ background: '#FFF5F0', border: '1px solid #FDDCCC' }}>
          <div className="text-[16px] text-[#424242]">도움이 필요하시면 전화 주세요</div>
          <div className="text-[22px] font-extrabold mt-1" style={{ color: '#E85C1E' }}>☎ 1588-0000</div>
        </div>

        {/* 고지사항 */}
        <div className="mt-5 p-4 rounded-[18px]" style={{ background: '#F5F0EB' }}>
          <ul className="list-none p-0 m-0 flex flex-col gap-1">
            <li className="text-[12px] text-[#999] leading-relaxed">· 일손은 구인·구직 정보를 연결해주는 플랫폼이에요</li>
            <li className="text-[12px] text-[#999] leading-relaxed">· 근로계약은 구인업체와 직접 체결해야 해요</li>
          </ul>
        </div>

        {/* 약관 동의 */}
        <div className="text-center mt-4 text-[13px] text-[#9E9E9E] leading-relaxed">
          시작하면 <span className="underline cursor-pointer">이용약관</span> 및 <span className="underline cursor-pointer">개인정보처리방침</span>에 동의하게 돼요
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────
// 2) 위치 허용 화면
// ─────────────────────────────────────
function LocationScreen({ onGranted, onSkip }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [regionName, setRegionName] = useState('');

  const handleGrant = () => {
    setLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const { latitude, longitude } = pos.coords;
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=ko`
            );
            const data = await res.json();
            // 🆕 풀 주소로 저장 (예: "경기도 수원시 팔달구")
            const name = extractFullAddress(data) || '내 동네';
            setRegionName(name);
            setLoading(false);
            setDone(true);
            setTimeout(() => onGranted(name), 800);
          } catch {
            setRegionName('경기도 수원시 팔달구');
            setLoading(false);
            setDone(true);
            setTimeout(() => onGranted('경기도 수원시 팔달구'), 800);
          }
        },
        () => {
          setRegionName('경기도 수원시 팔달구');
          setLoading(false);
          setDone(true);
          setTimeout(() => onGranted('경기도 수원시 팔달구'), 800);
        },
        { timeout: 8000 }
      );
    } else {
      setRegionName('경기도 수원시 팔달구');
      setLoading(false);
      setDone(true);
      setTimeout(() => onGranted('경기도 수원시 팔달구'), 800);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white justify-center">
      <div className="px-7 py-10">
        {/* 지도 일러스트 */}
        <div className="w-full h-[220px] rounded-[28px] bg-gradient-to-b from-[#E8F5E9] to-[#C8E6C9] flex items-center justify-center mb-8 relative overflow-hidden">
          <div className="absolute top-1/4 left-1/4 text-xl animate-bounce" style={{ animationDelay: '0.3s' }}>📍</div>
          <div className="absolute top-[55%] left-[60%] text-xl animate-bounce" style={{ animationDelay: '0.5s' }}>📍</div>
          <div className="absolute top-[35%] left-[72%] text-xl animate-bounce" style={{ animationDelay: '0.7s' }}>📍</div>
          <div className="absolute top-[68%] left-[28%] text-xl animate-bounce" style={{ animationDelay: '0.9s' }}>📍</div>
          <div className="w-[60px] h-[60px] rounded-full bg-white shadow-[0_4px_16px_rgba(230,81,0,0.25)] flex items-center justify-center z-[2] relative">
            <div className="w-11 h-11 rounded-[22px] bg-primary flex items-center justify-center text-[22px]">📍</div>
            <div className="absolute w-[76px] h-[76px] rounded-full border-[3px] border-primary/20 animate-ping" />
          </div>
        </div>

        {/* 텍스트 */}
        <div className="text-center mb-8">
          {done ? (
            <>
              <div className="text-[46px] mb-3.5">✅</div>
              <div className="text-[23px] font-extrabold text-primary mb-2">위치 확인 완료!</div>
              <div className="text-base text-[#424242] leading-relaxed">
                <strong className="text-primary font-bold">{regionName}</strong> 근처<br />일자리를 찾고 있어요
              </div>
            </>
          ) : (
            <>
              <div className="text-[25px] font-extrabold text-[#212121] mb-2.5 leading-snug">
                내 근처 일자리를<br />바로 찾아볼까요?
              </div>
              <div className="text-base text-[#757575] leading-relaxed">
                위치를 허용하시면<br /><strong className="text-[#424242]">걸어서 갈 수 있는 가까운 일자리</strong>를<br />먼저 보여드려요
              </div>
            </>
          )}
        </div>

        {/* 혜택 목록 */}
        {!done && (
          <>
            <div className="bg-primary-soft rounded-[22px] p-[18px_20px] mb-7 border border-primary-bg">
              {[
                { emoji: '🚶', text: '집에서 가까운 일자리 우선 표시' },
                { emoji: '⏱️', text: '도보·교통 소요시간 안내' },
                { emoji: '🔔', text: '새 일자리가 근처에 올라오면 알림' },
              ].map((item, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3.5 py-[13px] ${i < 2 ? 'border-b border-primary-bg' : ''}`}
                >
                  <span className="text-2xl">{item.emoji}</span>
                  <span className="text-base font-semibold text-[#424242]">{item.text}</span>
                </div>
              ))}
            </div>

            <button
              className="w-full py-[18px] bg-primary text-white border-none rounded-[28px] text-lg font-bold flex items-center justify-center gap-2.5 shadow-[0_3px_12px_rgba(230,81,0,0.25)]"
              onClick={handleGrant}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-[3px] border-white/30 border-t-white rounded-full animate-spin" />
                  위치 확인 중...
                </>
              ) : (
                '📍 내 위치로 일자리 찾기'
              )}
            </button>
            <button
              className="w-full py-3.5 bg-transparent text-[#9E9E9E] border-none text-[15px] font-medium mt-2.5"
              onClick={onSkip}
            >
              나중에 할게요
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────
// 🆕 위치 변경 바텀시트 (Phase C)
// ─────────────────────────────────────
function LocationPickerModal({ isOpen, onClose, onSelect, currentRegion }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setError('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setError('');
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&accept-language=ko&countrycodes=kr&limit=8&addressdetails=1`
        );
        const data = await res.json();
        setResults(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error('위치 검색 실패:', e);
        setError('검색 중 문제가 생겼어요. 잠시 후 다시 시도해주세요.');
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  const handleGpsClick = () => {
    if (gpsLoading) return;
    setGpsLoading(true);
    setError('');

    if (!navigator.geolocation) {
      setGpsLoading(false);
      setError('브라우저가 위치 정보를 지원하지 않아요.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=ko`
          );
          const data = await res.json();
          const name = extractFullAddress(data) || '내 동네';
          onSelect(name);
          setGpsLoading(false);
          onClose();
        } catch {
          setGpsLoading(false);
          setError('위치를 가져오지 못했어요.');
        }
      },
      (err) => {
        setGpsLoading(false);
        if (err.code === 1) {
          setError('위치 권한이 거부됐어요. 브라우저 설정에서 허용해주세요.');
        } else {
          setError('위치 확인 시간이 초과됐어요.');
        }
      },
      { timeout: 8000 }
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300]">
      {/* 오버레이 */}
      <div
        className="absolute inset-0 animate-overlay-in"
        style={{ background: 'rgba(0,0,0,0.5)' }}
        onClick={onClose}
      />
      {/* 시트 */}
      <div
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[24px] animate-slide-up-sheet flex flex-col"
        style={{ maxHeight: '70vh' }}
      >
        {/* 드래그 핸들 */}
        <div className="flex justify-center pt-2 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: '#DDD' }} />
        </div>

        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-2 flex-shrink-0">
          <div className="text-[18px] font-extrabold" style={{ color: '#1A1A18' }}>위치 변경</div>
          <button
            className="w-11 h-11 rounded-full flex items-center justify-center active:scale-90 transition-transform"
            style={{ background: '#F7F5F2' }}
            onClick={onClose}
            aria-label="닫기"
          >
            <span className="text-[16px]" style={{ color: '#888780' }}>✕</span>
          </button>
        </div>

        {/* 현재 위치 — 검색창 위 얇은 라벨 */}
        {currentRegion && currentRegion !== '위치 미설정' && (
          <div className="px-5 pb-1.5 flex-shrink-0">
            <div className="text-[12px]" style={{ color: '#888780' }}>
              현재: <span style={{ color: '#1A1A18' }}>{currentRegion}</span>
            </div>
          </div>
        )}

        {/* 검색창 — 우측 GPS 아이콘 통합 */}
        <div className="px-5 pb-2 flex-shrink-0">
          <div className="flex items-center gap-2 px-3.5 py-3 rounded-xl" style={{ background: '#F7F5F2', border: '1.5px solid #EDE8E2' }}>
            <span className="text-[16px] flex-shrink-0">🔍</span>
            <input
              type="text"
              placeholder="주소 또는 지역 검색 (예: 강남구)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent outline-none text-[14px] min-w-0"
              style={{ color: '#1A1A18' }}
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform"
                style={{ background: '#DDD8D1' }}
                aria-label="검색어 지우기"
              >
                <span className="text-[11px]" style={{ color: '#fff' }}>✕</span>
              </button>
            )}
            <button
              onClick={handleGpsClick}
              disabled={gpsLoading}
              className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform"
              style={{ background: '#FFF5F0', border: '1.5px solid #FDDCCC' }}
              aria-label="내 위치로 찾기"
            >
              {gpsLoading ? (
                <div className="w-4 h-4 border-[2px] rounded-full animate-spin"
                  style={{ borderColor: 'rgba(232,92,30,0.2)', borderTopColor: '#E85C1E' }} />
              ) : (
                <span className="text-[18px]">📍</span>
              )}
            </button>
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="px-5 pb-2 flex-shrink-0">
            <div className="text-[13px] py-2 px-3 rounded-lg" style={{ background: '#FEE8E8', color: '#C62828' }}>
              ⚠️ {error}
            </div>
          </div>
        )}

        {/* 결과 — 메인 스크롤 영역 */}
        <div className="px-5 pb-6 overflow-y-auto flex-1">
          {loading && (
            <div className="py-6 text-center">
              <div className="inline-block w-5 h-5 border-[2px] rounded-full animate-spin"
                style={{ borderColor: 'rgba(232,92,30,0.2)', borderTopColor: '#E85C1E' }} />
              <div className="text-[13px] mt-2" style={{ color: '#888780' }}>검색 중...</div>
            </div>
          )}

          {!loading && query && results.length === 0 && !error && (
            <div className="py-6 text-center">
              <div className="text-[28px] mb-1.5">🔍</div>
              <div className="text-[14px]" style={{ color: '#888780' }}>
                일치하는 주소가 없어요
              </div>
              <div className="text-[12px] mt-1" style={{ color: '#B4B2A9' }}>
                지역명 또는 주소 일부로 다시 검색해보세요
              </div>
            </div>
          )}

          {!loading && results.length > 0 && (
            <>
              <div className="text-[12px] font-medium mt-1 mb-1" style={{ color: '#888780' }}>
                검색 결과 {results.length}개
              </div>
              <div className="flex flex-col">
                {results.map((item, idx) => {
                  const fullAddress = extractFullAddress(item);
                  return (
                    <button
                      key={item.place_id || idx}
                      onClick={() => { onSelect(fullAddress); onClose(); }}
                      className="flex items-center gap-2.5 py-3 px-2 text-left rounded-lg active:bg-[#FFF5F0] transition-colors"
                      style={{ borderBottom: idx < results.length - 1 ? '1px solid #F3EFEA' : 'none' }}
                    >
                      <span className="text-[16px] flex-shrink-0">📍</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[15px] font-bold leading-snug truncate" style={{ color: '#1A1A18' }}>
                          {fullAddress}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="text-[11px] mt-3 text-center" style={{ color: '#B4B2A9' }}>
                위치 정보: OpenStreetMap
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── 이력서 DB 유틸 (MainScreen / ProfileView 공용) ───
// workers 테이블의 driver_license / bio는 triggerSave payload에서 직접 처리.
// 경력·자격증은 별도 테이블이므로 아래 유틸로 CRUD.
const loadCareers = async (wId) => {
  if (!wId) return [];
  const { data, error } = await supabase
    .from('worker_careers')
    .select('*')
    .eq('worker_id', wId)
    .order('start_date', { ascending: false });
  if (error) {
    console.error('경력 로드 실패:', error);
    return [];
  }
  return (data || []).map(row => ({
    id: row.id,
    company: row.company,
    role: row.role,
    startDate: row.start_date || '',
    endDate: row.end_date || '',
  }));
};

const insertCareer = async (wId, career) => {
  const { data, error } = await supabase
    .from('worker_careers')
    .insert([{
      worker_id: wId,
      company: career.company,
      role: career.role,
      start_date: career.startDate || null,
      end_date: career.endDate || null,
    }])
    .select()
    .single();
  if (error) {
    console.error('경력 저장 실패:', error);
    return null;
  }
  return {
    id: data.id,
    company: data.company,
    role: data.role,
    startDate: data.start_date || '',
    endDate: data.end_date || '',
  };
};

const deleteCareer = async (id) => {
  const { error } = await supabase
    .from('worker_careers')
    .delete()
    .eq('id', id);
  if (error) console.error('경력 삭제 실패:', error);
  return !error;
};

const loadCertifications = async (wId) => {
  if (!wId) return [];
  const { data, error } = await supabase
    .from('worker_certifications')
    .select('*')
    .eq('worker_id', wId)
    .order('issued_date', { ascending: false });
  if (error) {
    console.error('자격증 로드 실패:', error);
    return [];
  }
  return (data || []).map(row => ({
    id: row.id,
    name: row.name,
    issuedDate: row.issued_date || '',
    expiryDate: row.expires_date || '',
  }));
};

const insertCertification = async (wId, cert) => {
  const { data, error } = await supabase
    .from('worker_certifications')
    .insert([{
      worker_id: wId,
      name: cert.name,
      issued_date: cert.issuedDate || null,
      expires_date: cert.expiryDate || null,
    }])
    .select()
    .single();
  if (error) {
    console.error('자격증 저장 실패:', error);
    return null;
  }
  return {
    id: data.id,
    name: data.name,
    issuedDate: data.issued_date || '',
    expiryDate: data.expires_date || '',
  };
};

const deleteCertification = async (id) => {
  const { error } = await supabase
    .from('worker_certifications')
    .delete()
    .eq('id', id);
  if (error) console.error('자격증 삭제 실패:', error);
  return !error;
};

// ─────────────────────────────────────
// 3) 메인 화면
// ─────────────────────────────────────
function MainScreen({ region, setRegion, initialTab = 'home', onRequireLogin }) {
  const navigate = useNavigate();
  const [currentDistance, setCurrentDistance] = useState('3km');
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [showLocationPicker, setShowLocationPicker] = useState(false); // 🆕 위치 변경 모달
  const [profile, setProfile] = useState({
    name: '',
    phone: '',
    avatar_url: '',
    days: ['월', '화', '수', '목', '금'],
    times: ['오전', '오후'],
    jobs: [],
    distance: '1km',
    driverLicense: 'none',
    bio: '',
  });
  const [workerId, setWorkerId] = useState(null);
  const [kakaoId, setKakaoId] = useState(null);
  const [careers, setCareers] = useState([]);
  const [certifications, setCertifications] = useState([]);

  // 카카오 로그인 + workers 테이블 프로필 로드
  useEffect(() => {
    const hydrateProfile = async (session) => {
      if (!session?.user) return;

      const meta = session.user.user_metadata;
      const kId = meta?.provider_id;
      setKakaoId(kId);

      // 카카오 기본 정보 먼저 반영
      setProfile(prev => ({
        ...prev,
        name: meta?.name || meta?.full_name || '사용자',
        phone: session.user.email || '',
        avatar_url: meta?.avatar_url || '',
      }));

      // workers 조회 및 병합
      const { data: worker } = await supabase
        .from('workers')
        .select('*')
        .eq('kakao_id', kId)
        .maybeSingle();

      if (worker) {
        setWorkerId(worker.id);
        setProfile(prev => ({
          ...prev,
          days: worker.available_times?.filter(t => ['월','화','수','목','금','토','일'].includes(t)) || [],
          times: worker.available_times?.filter(t => ['오전','오후','야간'].includes(t)) || [],
          jobs: worker.job_types || [],
          driverLicense: worker.driver_license || 'none',
          bio: worker.bio || '',
        }));

        const loadedCareers = await loadCareers(worker.id);
        setCareers(loadedCareers);

        const loadedCerts = await loadCertifications(worker.id);
        setCertifications(loadedCerts);
      } else {
        // 로그인했지만 프로필 미등록(신규) → 온보딩으로 유도
        navigate('/register');
      }
    };

    // 초기 세션 체크
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
      hydrateProfile(session);
    });

    // 세션 변화 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session);
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        hydrateProfile(session);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const [jobs, setJobs] = useState([]);
  const [jobCoords, setJobCoords] = useState(null);

  // 거리 계산용 사용자 위치 1회 획득 (미허용/실패 시 수원 시청 fallback)
  useEffect(() => {
    const FALLBACK = { lat: 37.263573, lng: 127.028601 };
    if (!navigator.geolocation) { setJobCoords(FALLBACK); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => setJobCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setJobCoords(FALLBACK),
      { timeout: 5000 }
    );
  }, []);

  // DB에서 일자리 가져오기 (위치 확보 후 거리 계산 + 가까운순 정렬)
  useEffect(() => {
    if (!jobCoords) return;
    const loadJobs = async () => {
      try {
        const { data, error } = await supabase
          .from('jobs')
          .select('*, employers(company_name)')
          .eq('status', 'open')
          .order('created_at', { ascending: false });

        if (!error && data) {
          const mapped = data
            .map((job) => formatJobFromDB(job, jobCoords))
            .sort((a, b) => a.dist - b.dist);
          setJobs(mapped);
        }
      } catch (e) {
        console.error('일자리 로딩 오류:', e);
      }
    };
    loadJobs();
  }, [jobCoords]);

  const toggleFav = (id) => setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  // 프로필에 희망 직종이 있으면 그 직종만(맞춤), 없으면 전체
  const matched = (profile.jobs && profile.jobs.length)
    ? jobs.filter((j) => profile.jobs.includes(j.jobType))
    : jobs;
  const filtered = getFiltered(matched, currentDistance);
  const isPersonalized = !!(profile.jobs && profile.jobs.length);

  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#F7F5F2' }}>
      {/* 헤더 */}
      <div className="px-5 py-3.5 flex justify-between items-center sticky top-0 z-50" style={{ background: 'rgba(250,250,248,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #EDE8E2' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-[36px] h-[36px] rounded-[10px] flex items-center justify-center shadow-sm" style={{ background: 'linear-gradient(135deg, #E85C1E 0%, #D14E15 100%)' }}>
            <svg width="20" height="20" viewBox="0 0 52 52" fill="none">
              <path d="M26 4C17.16 4 10 11.16 10 20C10 31.5 26 48 26 48C26 48 42 31.5 42 20C42 11.16 34.84 4 26 4Z" fill="rgba(255,255,255,0.2)" stroke="white" strokeWidth="1.5"/>
              <circle cx="26" cy="15" r="4" fill="white"/>
              <line x1="26" y1="19" x2="22" y2="27" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
              <line x1="26" y1="19" x2="30" y2="27" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
              <line x1="22" y1="23" x2="30" y2="23" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <line x1="22" y1="27" x2="19" y2="33" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
              <line x1="30" y1="27" x2="33" y2="33" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="text-[18px] font-extrabold tracking-tight"><span style={{ color: '#E85C1E' }}>일</span><span style={{ color: '#1A1A18' }}>손</span></span>
        </div>
        <button onClick={() => navigate('/notifications')} className="w-[36px] h-[36px] rounded-full flex items-center justify-center relative active:scale-95 transition-transform" style={{ background: '#FFF5F0', border: '1.5px solid #FDDCCC' }}>
          <span style={{ color: '#E85C1E', fontSize: '17px' }}>🔔</span>
          <div className="absolute -top-0.5 -right-0.5 w-[8px] h-[8px] rounded-full" style={{ background: '#E85C1E', border: '2px solid white' }} />
        </button>
      </div>

      {/* 위치 바 — 홈탭에서만 표시 */}
      {activeTab === 'home' && (
        <div className="px-5 py-2.5 flex items-center justify-between" style={{ background: '#FAFAF8', borderBottom: '1px solid #EDE8E2' }}>
          {/* 🆕 onClick으로 위치 변경 모달 오픈 */}
          <button
            className="flex items-center gap-2.5 cursor-pointer active:opacity-70 transition-opacity bg-transparent border-none p-0"
            onClick={() => setShowLocationPicker(true)}
          >
            <div className="w-[32px] h-[32px] rounded-full flex items-center justify-center" style={{ background: '#FFF5F0' }}>
              <span style={{ fontSize: '16px' }}>📍</span>
            </div>
            <div className="text-left">
              <div className="text-[15px] font-bold" style={{ color: '#1A1A18' }}>
                {region || '경기도 수원시 팔달구'} <span className="text-[13px] font-medium" style={{ color: '#B4B2A9' }}>▾</span>
              </div>
              <div className="text-[11px] font-medium mt-px" style={{ color: '#888780' }}>
                {region && region !== '위치 미설정' ? '눌러서 위치 변경' : '눌러서 위치 설정'}
              </div>
            </div>
          </button>
          <div className="text-[12px] font-medium px-2.5 py-1 rounded-full" style={{ background: '#E8F5E9', color: '#2E7D32' }}>
            실시간
          </div>
        </div>
      )}

      {/* 스크롤 영역 */}
      <div className="flex-1 overflow-y-auto pb-24 [-webkit-overflow-scrolling:touch]">
        {activeTab === 'home' && (
          <ListView filtered={filtered} currentDistance={currentDistance} setCurrentDistance={setCurrentDistance} favorites={favorites} toggleFav={toggleFav} listTitle={isPersonalized ? `${profile.name || '회원'}님께 맞는 일자리` : '가까운 일자리'} />
        )}
        {activeTab === 'favorites' && <FavoritesView favorites={favorites} toggleFav={toggleFav} jobs={jobs} />}
        {activeTab === 'history' && <HistoryView />}
{activeTab === 'profile' && <ProfileView region={region} profile={profile} setProfile={setProfile} kakaoId={kakaoId} workerId={workerId} setWorkerId={setWorkerId} careers={careers} setCareers={setCareers} certifications={certifications} setCertifications={setCertifications} />}
      </div>

      {/* 하단 탭 */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-app flex justify-around pt-2 pb-7 z-[100]" style={{ background: 'rgba(250,250,248,0.97)', backdropFilter: 'blur(12px)', borderTop: '1px solid #EDE8E2' }}>
        {[
          { key: 'home', label: '홈', emoji: '🏠' },
          { key: 'favorites', label: '관심', emoji: '❤️' },
          { key: 'history', label: '지원내역', emoji: '📋' },
          { key: 'profile', label: '내정보', emoji: '👤' },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              className="flex flex-col items-center gap-[2px] bg-transparent border-none py-1.5 px-4 active:scale-90 transition-transform"
              onClick={() => {
                // 공고(home)는 비로그인도 허용. 나머지는 로그인 필요.
                if (tab.key !== 'home' && !isLoggedIn) { onRequireLogin(); return; }
                setActiveTab(tab.key);
              }}
            >
              <div className="relative">
                <span className="text-[22px]" style={{ opacity: isActive ? 1 : 0.45 }}>{tab.emoji}</span>
                {isActive && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full" style={{ background: '#E85C1E' }} />}
              </div>
              <span className="text-[11px] mt-0.5" style={{ color: isActive ? '#E85C1E' : '#B4B2A9', fontWeight: isActive ? 700 : 400 }}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* 🆕 위치 변경 바텀시트 */}
      <LocationPickerModal
        isOpen={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        onSelect={(name) => setRegion(name)}
        currentRegion={region}
      />
    </div>
  );
}

// ─── 리스트 뷰 ───
function ListView({ filtered, currentDistance, setCurrentDistance, favorites, toggleFav, listTitle }) {
  return (
    <div>
      {/* 거리 필터 */}
      <div className="px-4 pb-3 pt-3 flex gap-2 overflow-x-auto">
        {DISTANCES.filter(d => d !== '전체').map((d) => (
          <button
            key={d}
            className="py-2.5 px-5 rounded-full text-[14px] font-bold whitespace-nowrap transition-all active:scale-95"
            style={currentDistance === d
              ? { background: '#E85C1E', border: '1.5px solid #E85C1E', color: '#FFFFFF', boxShadow: '0 2px 8px rgba(232,92,30,0.25)' }
              : { background: '#FFFFFF', border: '1.5px solid #EDE8E2', color: '#888780' }
            }
            onClick={() => setCurrentDistance(d)}
          >
            {d} 이내
          </button>
        ))}
      </div>

      {/* 섹션 헤더 */}
      <div className="px-4 pb-3 pt-1 flex justify-between items-center">
        <h2 className="text-[16px] font-extrabold" style={{ color: '#1A1A18' }}>
          {listTitle}
        </h2>
        <span className="text-[13px] font-bold px-2.5 py-1 rounded-full" style={{ background: '#FFF5F0', color: '#E85C1E' }}>{filtered.length}건</span>
      </div>

      {/* 일자리 목록 */}
      <div className="pb-5">
        <div className="flex flex-col gap-3.5 px-4">
          {filtered.length > 0 ? (
            filtered.map((job, i) => (
              <JobCard key={job.id} job={job} index={i} isFav={favorites.includes(job.id)} toggleFav={toggleFav} />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-16 animate-fade-up">
              <div className="text-[52px] mb-4">🔍</div>
              <div className="text-[18px] font-bold mb-2" style={{ color: '#1A1A18' }}>아직 일자리가 없어요</div>
              <div className="text-[14px] text-center leading-relaxed" style={{ color: '#888780' }}>
                거리를 늘려서 찾아보시거나<br />곧 새로운 일자리가 올라올 거예요
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── 잡 카드 ───
function JobCard({ job, index, isFav, toggleFav }) {
  const payParts = job.pay.split(' ');
  const payType = payParts[0];
  const payAmount = payParts.slice(1).join(' ');
  const firstTag = job.tags[0] || '';

  return (
    <div
      className="rounded-[18px] p-[18px] w-full animate-fade-up active:scale-[0.98] transition-transform"
      style={{ background: '#FFFFFF', border: '1px solid #EDE8E2', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', animationDelay: `${Math.min(index, 6) * 0.06}s` }}
    >
      {/* 상단: 뱃지 + 하트 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-1.5 items-center flex-wrap">
          <span className="text-[12px] font-bold py-[4px] px-2.5 rounded-full" style={{ background: '#FFF5F0', color: '#E85C1E' }}>
            🚶 {job.distance} · {job.walkTime}
          </span>
          {job.isNew && (
            <span className="text-[11px] font-bold py-[4px] px-2.5 rounded-full text-white" style={{ background: 'linear-gradient(135deg, #E85C1E, #FF7043)' }}>NEW</span>
          )}
        </div>
        <button
          className="w-[36px] h-[36px] border-none rounded-full flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform"
          style={{ background: isFav ? '#FFF5F0' : '#F7F5F2' }}
          onClick={() => toggleFav(job.id)}
        >
          <span className="text-[20px]">{isFav ? '❤️' : '🤍'}</span>
        </button>
      </div>

      {/* 본문 */}
      <div className="flex gap-3.5 items-start">
        <div className="w-[44px] h-[44px] rounded-[12px] flex items-center justify-center text-[22px] flex-shrink-0" style={{ background: '#F7F5F2' }}>
          {job.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[17px] font-bold leading-snug" style={{ color: '#1A1A18' }}>{job.title}</div>
          <div className="text-[13px] mt-1 truncate" style={{ color: '#888780' }}>{job.company} · {job.location}</div>
        </div>
      </div>

      {/* 급여 */}
      <div className="mt-3 py-2.5 px-3.5 rounded-[12px] flex items-center justify-between" style={{ background: '#FFF8F5' }}>
        <div className="flex items-baseline gap-1.5">
          <span className="text-[21px] font-extrabold" style={{ color: '#E85C1E', letterSpacing: '-0.5px' }}>{payType} {payAmount}</span>
          {firstTag && <span className="text-[13px] font-medium" style={{ color: '#888780' }}>/ {firstTag}</span>}
        </div>
      </div>

      {/* 태그 */}
      {job.tags.length > 1 && (
        <div className="flex gap-1.5 flex-wrap mt-2.5">
          {job.tags.slice(1).map((t) => (
            <span key={t} className="py-[4px] px-2.5 rounded-full text-[12px] font-medium" style={{ background: '#F7F5F2', color: '#5F5E5A' }}>
              {t}
            </span>
          ))}
        </div>
      )}

      {/* 버튼 */}
      <div className="mt-3.5 flex gap-2">
        <button className="flex-1 h-[50px] text-white border-none rounded-[14px] text-[16px] font-bold active:scale-[0.97] transition-transform shadow-sm" style={{ background: 'linear-gradient(135deg, #E85C1E 0%, #D14E15 100%)' }}>
          바로 지원하기
        </button>
        <button className="w-[50px] h-[50px] border-none rounded-[14px] flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform shadow-sm" style={{ background: '#FEE500' }}>
          <KakaoIcon size={20} />
        </button>
      </div>
    </div>
  );
}


// ─── 마이페이지 ───
const PROFILE_DAYS = ['월', '화', '수', '목', '금', '토', '일'];
const PROFILE_TIMES = ['오전', '오후', '야간'];
const PROFILE_JOBS = ['아파트 경비', '상가·건물 청소'];
const PROFILE_DISTS = ['500m', '1km', '2km', '3km', '5km', '10km', '20km', '무관'];
const CERT_SUGGESTIONS = ['경비원 신임교육', '건물관리사', '조경기능사', '전기기능사', '지게차운전기능사'];
const DRIVER_LICENSES = [
  { key: 'type1', label: '1종 보통', hint: '🚛 대형 차량·트럭 운전 가능' },
  { key: 'type2', label: '2종 보통', hint: '🚗 승용차·소형 화물 운전 가능' },
  { key: 'none', label: '없음', hint: '도보 출퇴근만 가능해요' },
];

function ProfileCheckMark() {
  return (
    <div style={{ width: 12, height: 8, borderLeft: '2px solid #fff', borderBottom: '2px solid #fff', transform: 'rotate(-45deg) translate(1px, -1px)' }} />
  );
}

function ProfileSection({ icon, iconBg, title, badge, children }) {
  return (
    <div className="rounded-[12px] overflow-hidden" style={{ background: '#FAFAF8', border: '1px solid #EDE8E2' }}>
      <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: '1px solid #EDE8E2' }}>
        <span className="w-7 h-7 rounded-lg flex items-center justify-center text-[14px]" style={{ background: iconBg }}>{icon}</span>
        <span className="text-[15px] font-medium flex-1" style={{ color: '#1A1A18' }}>{title}</span>
        {badge && <span className="text-[11px]" style={{ color: '#E85C1E' }}>{badge}</span>}
      </div>
      <div className="p-4 flex flex-col gap-3">{children}</div>
    </div>
  );
}

function ProfileView({ region, profile, setProfile, kakaoId, workerId, setWorkerId, careers, setCareers, certifications, setCertifications }) {
  const toggleArr = (key, val) => {
    setProfile(p => {
      const arr = p[key] || [];
      const newArr = arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val];
      const next = { ...p, [key]: newArr };
      triggerSave(next);
      return next;
    });
  };

  const [showCareerForm, setShowCareerForm] = useState(false);
  const [newCareer, setNewCareer] = useState({ company: '', role: '', startDate: '', endDate: '' });
  const [isCurrentJob, setIsCurrentJob] = useState(false);
  const [startYear, setStartYear] = useState('');
  const [startMonth, setStartMonth] = useState('');
  const [endYear, setEndYear] = useState('');
  const [endMonth, setEndMonth] = useState('');

  // 자격증
  const [showCertForm, setShowCertForm] = useState(false);
  const [newCert, setNewCert] = useState({ name: '' });
  const [certYear, setCertYear] = useState('');
  const [certMonth, setCertMonth] = useState('');
  const [certNoExpiry, setCertNoExpiry] = useState(true);
  const [certExpYear, setCertExpYear] = useState('');
  const [certExpMonth, setCertExpMonth] = useState('');

  const openCertForm = () => {
    setNewCert({ name: '' });
    setCertYear('');
    setCertMonth('');
    setCertNoExpiry(true);
    setCertExpYear('');
    setCertExpMonth('');
    setShowCertForm(true);
  };
  const closeCertForm = () => setShowCertForm(false);
  const canSubmitCert = newCert.name && certYear && certMonth;
  const addCertification = async () => {
    if (!canSubmitCert) return;
    let wId = workerId;
    if (!wId) {
      wId = await triggerSave();
      if (!wId) {
        alert('프로필 저장에 실패했어요. 다시 시도해주세요.');
        return;
      }
    }
    const issued = `${certYear}.${String(certMonth).padStart(2, '0')}`;
    const expiry = certNoExpiry
      ? ''
      : certExpYear && certExpMonth ? `${certExpYear}.${String(certExpMonth).padStart(2, '0')}` : '';
    const saved = await insertCertification(wId, {
      name: newCert.name,
      issuedDate: issued,
      expiryDate: expiry,
    });
    if (!saved) {
      alert('자격증 저장에 실패했어요.');
      return;
    }
    setCertifications(prev => [saved, ...prev]);
    closeCertForm();
  };
  const removeCertification = async (id) => {
    const ok = await deleteCertification(id);
    if (!ok) {
      alert('자격증 삭제에 실패했어요.');
      return;
    }
    setCertifications(prev => prev.filter(c => c.id !== id));
  };

  const currentYear = new Date().getFullYear();
  const yearOptions = [];
  for (let y = currentYear; y >= 2000; y--) yearOptions.push(y);
  const monthOptions = [];
  for (let m = 1; m <= 12; m++) monthOptions.push(m);

  const openCareerForm = () => {
    setNewCareer({ company: '', role: '', startDate: '', endDate: '' });
    setStartYear('');
    setStartMonth('');
    setEndYear('');
    setEndMonth('');
    setIsCurrentJob(false);
    setShowCareerForm(true);
  };

  const closeCareerForm = () => {
    setShowCareerForm(false);
  };

  const canSubmitCareer = newCareer.company && newCareer.role && startYear && startMonth;

  const addCareer = async () => {
    if (!canSubmitCareer) return;
    let wId = workerId;
    if (!wId) {
      wId = await triggerSave();
      if (!wId) {
        alert('프로필 저장에 실패했어요. 다시 시도해주세요.');
        return;
      }
    }
    const sd = `${startYear}.${String(startMonth).padStart(2, '0')}`;
    const ed = isCurrentJob ? '' : (endYear && endMonth ? `${endYear}.${String(endMonth).padStart(2, '0')}` : '');
    const saved = await insertCareer(wId, {
      company: newCareer.company,
      role: newCareer.role,
      startDate: sd,
      endDate: ed,
    });
    if (!saved) {
      alert('경력 저장에 실패했어요.');
      return;
    }
    setCareers(prev => [saved, ...prev]);
    closeCareerForm();
  };

  const removeCareer = async (id) => {
    const ok = await deleteCareer(id);
    if (!ok) {
      alert('경력 삭제에 실패했어요.');
      return;
    }
    setCareers(prev => prev.filter(c => c.id !== id));
  };

  const calcDuration = (start, end) => {
    if (!start) return '';
    const [sy, sm] = start.split('.').map(Number);
    const endDate = end || `${new Date().getFullYear()}.${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    const [ey, em] = endDate.split('.').map(Number);
    const months = (ey - sy) * 12 + (em - sm);
    const y = Math.floor(months / 12);
    const m = months % 12;
    return y > 0 ? `${y}년 ${m}개월` : `${m}개월`;
  };

  const [toastVisible, setToastVisible] = useState(false);
  const triggerSave = async (overrideProfile = null) => {
    const current = overrideProfile || profile;

    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 1800);

    // workers 테이블에 저장
    if (!kakaoId) return null;

    const payload = {
      name: current.name,
      phone: current.phone || `kakao_${kakaoId}`,
      address: region || '',
      job_types: current.jobs,
      available_times: [...(current.days || []), ...(current.times || [])],
      kakao_id: kakaoId,
      driver_license: current.driverLicense || 'none',
      bio: current.bio || '',
    };

    try {
      if (workerId) {
        await supabase.from('workers').update(payload).eq('id', workerId);
        return workerId;
      }
      const { data } = await supabase.from('workers').insert([payload]).select().single();
      if (data) {
        setWorkerId(data.id);
        return data.id;
      }
    } catch (e) {
      console.error('프로필 저장 오류:', e);
    }
    return null;
  };

  const selectStyle = {
    border: '1.5px solid #EDE8E2',
    background: '#fff',
    color: '#1A1A18',
    WebkitAppearance: 'none',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%23888780' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 14px center',
    backgroundSize: '12px',
  };

  const selectDisabledStyle = {
    ...selectStyle,
    background: '#F7F5F2',
    color: '#B4B2A9',
    borderColor: '#EDE8E2',
  };

  return (
    <div className="relative">
      {/* 토스트 */}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 py-2 px-5 rounded-full text-[13px] text-white transition-opacity" style={{ background: 'rgba(0,0,0,0.75)', opacity: toastVisible ? 1 : 0, pointerEvents: 'none' }}>
        저장됐어요
      </div>

      {/* 헤더 */}
      <div className="px-5 py-5" style={{ background: 'linear-gradient(135deg, #E85C1E 0%, #D14E15 100%)' }}>
        <div className="text-[22px] font-extrabold text-white">내 이력서</div>
        <div className="text-[13px] text-white/70 mt-1">지원할 때 자동으로 전달돼요</div>
      </div>

      <div className="p-4 flex flex-col gap-3">

        {/* 기본 정보 — 카카오 */}
        <ProfileSection icon="😊" iconBg="#FEE500" title="기본 정보" badge="카카오 연동">
          <div className="flex items-center gap-3">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="프로필" className="w-12 h-12 rounded-full object-cover" style={{ border: '2px solid #FEE500' }} />
            ) : (
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-[20px]" style={{ background: '#FEE500' }}>👤</div>
            )}
            <div className="flex-1">
              <div className="text-[16px] font-medium" style={{ color: '#1A1A18' }}>{profile.name || '로그인 필요'}</div>
              <div className="text-[13px] mt-0.5" style={{ color: '#888780' }}>{profile.phone}</div>
            </div>
            <span className="text-[11px] font-medium py-1 px-2 rounded-full" style={{ background: '#FEE500', color: '#3C1E1E' }}>자동입력</span>
          </div>
          <div>
            <div className="text-[13px] mb-1" style={{ color: '#888780' }}>거주 지역</div>
            <div className="text-[15px] px-3 py-2.5 rounded-lg" style={{ background: '#F7F5F2', border: '1px solid #EDE8E2', color: region ? '#1A1A18' : '#B4B2A9' }}>
              {region || '위치 동의 후 자동 설정'}
            </div>
          </div>
        </ProfileSection>

        {/* 일할 수 있는 날 */}
        <ProfileSection icon="📅" iconBg="#E8F5E9" title="일할 수 있는 날">
          <div className="grid grid-cols-7 gap-1.5">
            {PROFILE_DAYS.map(d => {
              const on = (profile.days || []).includes(d);
              return (
                <button key={d} className="py-2 rounded-lg text-[14px] font-medium text-center"
                  style={on ? { background: '#E85C1E', color: '#fff', border: '1px solid #E85C1E' } : { background: '#F7F5F2', color: '#888780', border: '1px solid #EDE8E2' }}
                  onClick={() => toggleArr('days', d)}
                >{d}</button>
              );
            })}
          </div>
          <div>
            <div className="text-[13px] mb-2" style={{ color: '#888780' }}>선호 시간대</div>
            <div className="flex gap-2">
              {PROFILE_TIMES.map(t => {
                const on = (profile.times || []).includes(t);
                return (
                  <button key={t} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[14px]"
                    style={{ background: '#F7F5F2', border: '1px solid #EDE8E2', color: on ? '#1A1A18' : '#888780' }}
                    onClick={() => toggleArr('times', t)}
                  >
                    <span className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                      style={on ? { background: '#E85C1E', border: '1.5px solid #E85C1E' } : { background: '#fff', border: '1.5px solid #EDE8E2' }}
                    >{on && <ProfileCheckMark />}</span>
                    {t}
                  </button>
                );
              })}
            </div>
          </div>
        </ProfileSection>

        {/* 원하는 일 */}
        <ProfileSection icon="💼" iconBg="#FBE9E7" title="원하는 일">
          <div className="flex flex-col">
            {PROFILE_JOBS.map((job, i) => {
              const on = (profile.jobs || []).includes(job);
              return (
                <button key={job} className="flex items-center gap-3 py-3 text-left"
                  style={{ borderBottom: i < PROFILE_JOBS.length - 1 ? '1px solid #EDE8E2' : 'none' }}
                  onClick={() => toggleArr('jobs', job)}
                >
                  <span className="w-[22px] h-[22px] rounded-md flex items-center justify-center flex-shrink-0"
                    style={on ? { background: '#E85C1E', border: '1.5px solid #E85C1E' } : { background: '#F7F5F2', border: '1.5px solid #EDE8E2' }}
                  >{on && <ProfileCheckMark />}</span>
                  <span className="text-[15px]" style={{ color: '#1A1A18' }}>{job}</span>
                </button>
              );
            })}
          </div>
          <div>
            <div className="text-[13px] mb-2" style={{ color: '#888780' }}>이동 가능 거리</div>
            <select
              value={profile.distance || ''}
              onChange={(e) => setProfile(p => {
                const next = { ...p, distance: e.target.value };
                triggerSave(next);
                return next;
              })}
              className="w-full px-4 py-3 rounded-lg text-[15px] outline-none"
              style={selectStyle}
            >
              {PROFILE_DISTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </ProfileSection>

        {/* 자격증 */}
        <ProfileSection icon="🏅" iconBg="#FFF3E0" title="자격증" badge={`${certifications.length}건`}>
          {certifications.map((c) => (
            <div key={c.id} className="flex items-start gap-2">
              <div className="flex-1 px-3 py-2.5 rounded-lg" style={{ background: '#F7F5F2', border: '1px solid #EDE8E2' }}>
                <div className="text-[14px] font-medium" style={{ color: '#1A1A18' }}>{c.name}</div>
                <div className="text-[12px] mt-0.5" style={{ color: '#888780' }}>
                  취득 {c.issuedDate}{c.expiryDate ? ` · 만료 ${c.expiryDate}` : ' · 만료없음'}
                </div>
              </div>
              <button
                className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-1.5 active:scale-90 transition-transform"
                style={{ background: '#F7F5F2', border: '1px solid #EDE8E2' }}
                onClick={() => removeCertification(c.id)}
              >
                <span className="text-[13px]" style={{ color: '#888780' }}>✕</span>
              </button>
            </div>
          ))}
          <button
            className="w-full py-3.5 rounded-xl text-center text-[15px] font-bold active:scale-[0.97] transition-transform"
            style={{ border: 'none', color: '#FFFFFF', background: '#E85C1E', boxShadow: '0 2px 8px rgba(232,92,30,0.3)' }}
            onClick={openCertForm}
          >
            + 자격증 추가하기
          </button>
        </ProfileSection>

        {/* 운전 가능 */}
        <ProfileSection icon="🚗" iconBg="#E3F2FD" title="운전 가능">
          <div className="flex gap-1.5">
            {DRIVER_LICENSES.map(({ key, label }) => {
              const on = profile.driverLicense === key;
              return (
                <button
                  key={key}
                  className="flex-1 flex items-center justify-center py-2.5 rounded-lg text-[14px] font-medium"
                  style={on
                    ? { background: '#E85C1E', color: '#fff', border: '1px solid #E85C1E' }
                    : { background: '#F7F5F2', color: '#888780', border: '1px solid #EDE8E2' }}
                  onClick={() => setProfile(p => {
                    const next = { ...p, driverLicense: key };
                    triggerSave(next);
                    return next;
                  })}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <div className="text-[13px] mt-1" style={{ color: '#888780' }}>
            {DRIVER_LICENSES.find(d => d.key === profile.driverLicense)?.hint || DRIVER_LICENSES[2].hint}
          </div>
        </ProfileSection>

        {/* 경력 (선택) */}
        <ProfileSection icon="📋" iconBg="#E3F2FD" title="경력" badge={`${careers.length}건`}>
          {careers.map((c) => (
            <div key={c.id} className="flex items-start gap-2">
              <div className="flex-1 px-3 py-2.5 rounded-lg" style={{ background: '#F7F5F2', border: '1px solid #EDE8E2' }}>
                <div className="text-[14px] font-medium" style={{ color: '#1A1A18' }}>{c.company} — {c.role}</div>
                <div className="text-[12px] mt-0.5" style={{ color: '#888780' }}>
                  {c.startDate} ~ {c.endDate || '현재'} ({calcDuration(c.startDate, c.endDate)})
                </div>
              </div>
              <button
                className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-1.5 active:scale-90 transition-transform"
                style={{ background: '#F7F5F2', border: '1px solid #EDE8E2' }}
                onClick={() => removeCareer(c.id)}
              >
                <span className="text-[13px]" style={{ color: '#888780' }}>✕</span>
              </button>
            </div>
          ))}
          <button
            className="w-full py-3.5 rounded-xl text-center text-[15px] font-bold active:scale-[0.97] transition-transform"
            style={{ border: 'none', color: '#FFFFFF', background: '#E85C1E', boxShadow: '0 2px 8px rgba(232,92,30,0.3)' }}
            onClick={openCareerForm}
          >
            + 경력 추가하기
          </button>
        </ProfileSection>

        {/* 한 줄 소개 (선택) */}
        <ProfileSection icon="✏️" iconBg="#F3E5F5" title="한 줄 소개" badge="선택">
          <textarea
            className="w-full text-[14px] leading-relaxed px-3 py-2.5 rounded-lg min-h-[64px] outline-none resize-none"
            style={{ background: '#F7F5F2', border: '1px solid #EDE8E2', color: '#1A1A18' }}
            placeholder="간단한 자기소개를 입력해주세요"
            value={profile.bio || ''}
            onChange={(e) => setProfile(p => ({ ...p, bio: e.target.value }))}
            onBlur={() => triggerSave()}
          />
        </ProfileSection>

      </div>

      {/* 자동저장 안내 */}
      <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: '#FAFAF8', borderTop: '1px solid #EDE8E2' }}>
        <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
        <span className="text-[13px]" style={{ color: '#888780' }}>이력서가 자동으로 업데이트돼요</span>
      </div>

      {/* ── 바텀시트 모달: 경력 추가 ── */}
      {showCareerForm && (
        <div className="fixed inset-0 z-[200]">
          {/* 오버레이 */}
          <div
            className="absolute inset-0 animate-overlay-in"
            style={{ background: 'rgba(0,0,0,0.5)' }}
            onClick={closeCareerForm}
          />
          {/* 시트 */}
          <div
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[28px] animate-slide-up-sheet"
            style={{ maxHeight: '85vh', overflowY: 'auto' }}
          >
            {/* 드래그 핸들 */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: '#DDD' }} />
            </div>

            {/* 헤더 */}
            <div className="flex items-center justify-between px-6 py-3">
              <div className="text-[20px] font-extrabold" style={{ color: '#1A1A18' }}>경력 추가</div>
              <button
                className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-transform"
                style={{ background: '#F7F5F2' }}
                onClick={closeCareerForm}
              >
                <span className="text-[18px]" style={{ color: '#888780' }}>✕</span>
              </button>
            </div>

            {/* 본문 */}
            <div className="px-6 pb-4 flex flex-col gap-3.5">
              {/* 회사명 */}
              <div>
                <label className="block text-[14px] font-bold mb-1.5" style={{ color: '#1A1A18' }}>
                  회사명 <span style={{ color: '#E85C1E' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="예) 삼성물산, 대림관리"
                  value={newCareer.company}
                  onChange={(e) => setNewCareer(p => ({ ...p, company: e.target.value }))}
                  className="w-full px-4 py-3.5 rounded-xl text-[16px] outline-none"
                  style={{ border: '1.5px solid #EDE8E2', background: '#fff', color: '#1A1A18' }}
                />
              </div>

              {/* 직종 */}
              <div>
                <label className="block text-[14px] font-bold mb-1.5" style={{ color: '#1A1A18' }}>
                  직종 <span style={{ color: '#E85C1E' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="예) 아파트 경비, 건물 청소"
                  value={newCareer.role}
                  onChange={(e) => setNewCareer(p => ({ ...p, role: e.target.value }))}
                  className="w-full px-4 py-3.5 rounded-xl text-[16px] outline-none"
                  style={{ border: '1.5px solid #EDE8E2', background: '#fff', color: '#1A1A18' }}
                />
              </div>

              {/* 시작일 */}
              <div>
                <label className="block text-[14px] font-bold mb-1.5" style={{ color: '#1A1A18' }}>
                  시작일 <span style={{ color: '#E85C1E' }}>*</span>
                </label>
                <div className="flex gap-2">
                  <select
                    value={startYear}
                    onChange={(e) => setStartYear(e.target.value)}
                    className="flex-1 px-4 py-3.5 rounded-xl text-[16px] outline-none"
                    style={selectStyle}
                  >
                    <option value="" disabled>년도</option>
                    {yearOptions.map(y => <option key={y} value={y}>{y}년</option>)}
                  </select>
                  <select
                    value={startMonth}
                    onChange={(e) => setStartMonth(e.target.value)}
                    className="flex-1 px-4 py-3.5 rounded-xl text-[16px] outline-none"
                    style={selectStyle}
                  >
                    <option value="" disabled>월</option>
                    {monthOptions.map(m => <option key={m} value={m}>{m}월</option>)}
                  </select>
                </div>
              </div>

              {/* 현재 재직 중 체크박스 */}
              <button
                className="flex items-center gap-3 py-1"
                onClick={() => setIsCurrentJob(v => !v)}
              >
                <span
                  className="w-[24px] h-[24px] rounded-md flex items-center justify-center flex-shrink-0"
                  style={isCurrentJob
                    ? { background: '#E85C1E', border: '2px solid #E85C1E' }
                    : { background: '#fff', border: '2px solid #EDE8E2' }
                  }
                >
                  {isCurrentJob && <ProfileCheckMark />}
                </span>
                <span className="text-[15px] font-medium" style={{ color: '#1A1A18' }}>현재 재직 중</span>
              </button>

              {/* 종료일 */}
              <div>
                <label className="block text-[14px] font-bold mb-1.5" style={{ color: isCurrentJob ? '#B4B2A9' : '#1A1A18' }}>
                  종료일
                </label>
                <div className="flex gap-2">
                  <select
                    value={endYear}
                    onChange={(e) => setEndYear(e.target.value)}
                    disabled={isCurrentJob}
                    className="flex-1 px-4 py-3.5 rounded-xl text-[16px] outline-none"
                    style={isCurrentJob ? selectDisabledStyle : selectStyle}
                  >
                    <option value="" disabled>{isCurrentJob ? '—' : '년도'}</option>
                    {yearOptions.map(y => <option key={y} value={y}>{y}년</option>)}
                  </select>
                  <select
                    value={endMonth}
                    onChange={(e) => setEndMonth(e.target.value)}
                    disabled={isCurrentJob}
                    className="flex-1 px-4 py-3.5 rounded-xl text-[16px] outline-none"
                    style={isCurrentJob ? selectDisabledStyle : selectStyle}
                  >
                    <option value="" disabled>{isCurrentJob ? '—' : '월'}</option>
                    {monthOptions.map(m => <option key={m} value={m}>{m}월</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* 하단 버튼 */}
            <div className="px-6 pb-8 pt-2 flex gap-2.5" style={{ borderTop: '1px solid #EDE8E2' }}>
              <button
                className="flex-1 py-4 rounded-xl text-[16px] font-medium border-none active:scale-[0.97] transition-transform"
                style={{ background: '#F7F5F2', color: '#888780' }}
                onClick={closeCareerForm}
              >
                취소
              </button>
              <button
                className="flex-[2] py-4 rounded-xl text-[16px] font-bold text-white border-none active:scale-[0.97] transition-transform"
                style={{ background: canSubmitCareer ? '#E85C1E' : '#CCC', boxShadow: canSubmitCareer ? '0 2px 8px rgba(232,92,30,0.3)' : 'none' }}
                onClick={addCareer}
                disabled={!canSubmitCareer}
              >
                추가하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 바텀시트 모달: 자격증 추가 ── */}
      {showCertForm && (
        <div className="fixed inset-0 z-[200]">
          <div
            className="absolute inset-0 animate-overlay-in"
            style={{ background: 'rgba(0,0,0,0.5)' }}
            onClick={closeCertForm}
          />
          <div
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[28px] animate-slide-up-sheet"
            style={{ maxHeight: '85vh', overflowY: 'auto' }}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: '#DDD' }} />
            </div>

            <div className="flex items-center justify-between px-6 py-3">
              <div className="text-[20px] font-extrabold" style={{ color: '#1A1A18' }}>자격증 추가</div>
              <button
                className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-transform"
                style={{ background: '#F7F5F2' }}
                onClick={closeCertForm}
              >
                <span className="text-[18px]" style={{ color: '#888780' }}>✕</span>
              </button>
            </div>

            <div className="px-6 pb-4 flex flex-col gap-3.5">
              {/* 자격증명 */}
              <div>
                <label className="block text-[14px] font-bold mb-1.5" style={{ color: '#1A1A18' }}>
                  자격증명 <span style={{ color: '#E85C1E' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="예: 경비원 신임교육 이수"
                  value={newCert.name}
                  onChange={(e) => setNewCert({ name: e.target.value })}
                  className="w-full px-4 py-3.5 rounded-xl text-[16px] outline-none"
                  style={{ border: '1.5px solid #EDE8E2', background: '#fff', color: '#1A1A18' }}
                />
                <div className="flex gap-1.5 flex-wrap mt-2">
                  {CERT_SUGGESTIONS.map(s => {
                    const on = newCert.name === s;
                    return (
                      <button
                        key={s}
                        className="py-1.5 px-3 rounded-full text-[13px] font-medium active:scale-95 transition-transform"
                        style={on
                          ? { background: '#FFF5F0', border: '1.5px solid #E85C1E', color: '#E85C1E' }
                          : { background: '#F7F5F2', border: '1px solid #EDE8E2', color: '#5F5E5A' }}
                        onClick={() => setNewCert({ name: s })}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 취득일 */}
              <div>
                <label className="block text-[14px] font-bold mb-1.5" style={{ color: '#1A1A18' }}>
                  취득일 <span style={{ color: '#E85C1E' }}>*</span>
                </label>
                <div className="flex gap-2">
                  <select
                    value={certYear}
                    onChange={(e) => setCertYear(e.target.value)}
                    className="flex-1 px-4 py-3.5 rounded-xl text-[16px] outline-none"
                    style={selectStyle}
                  >
                    <option value="" disabled>년도</option>
                    {yearOptions.map(y => <option key={y} value={y}>{y}년</option>)}
                  </select>
                  <select
                    value={certMonth}
                    onChange={(e) => setCertMonth(e.target.value)}
                    className="flex-1 px-4 py-3.5 rounded-xl text-[16px] outline-none"
                    style={selectStyle}
                  >
                    <option value="" disabled>월</option>
                    {monthOptions.map(m => <option key={m} value={m}>{m}월</option>)}
                  </select>
                </div>
              </div>

              {/* 만료없음 */}
              <button
                className="flex items-center gap-3 py-1"
                onClick={() => setCertNoExpiry(v => !v)}
              >
                <span
                  className="w-[24px] h-[24px] rounded-md flex items-center justify-center flex-shrink-0"
                  style={certNoExpiry
                    ? { background: '#E85C1E', border: '2px solid #E85C1E' }
                    : { background: '#fff', border: '2px solid #EDE8E2' }}
                >
                  {certNoExpiry && <ProfileCheckMark />}
                </span>
                <span className="text-[15px] font-medium" style={{ color: '#1A1A18' }}>만료없음</span>
              </button>

              {/* 만료일 */}
              <div>
                <label className="block text-[14px] font-bold mb-1.5" style={{ color: certNoExpiry ? '#B4B2A9' : '#1A1A18' }}>
                  만료일
                </label>
                <div className="flex gap-2">
                  <select
                    value={certExpYear}
                    onChange={(e) => setCertExpYear(e.target.value)}
                    disabled={certNoExpiry}
                    className="flex-1 px-4 py-3.5 rounded-xl text-[16px] outline-none"
                    style={certNoExpiry ? selectDisabledStyle : selectStyle}
                  >
                    <option value="" disabled>{certNoExpiry ? '—' : '년도'}</option>
                    {yearOptions.map(y => <option key={y} value={y}>{y}년</option>)}
                  </select>
                  <select
                    value={certExpMonth}
                    onChange={(e) => setCertExpMonth(e.target.value)}
                    disabled={certNoExpiry}
                    className="flex-1 px-4 py-3.5 rounded-xl text-[16px] outline-none"
                    style={certNoExpiry ? selectDisabledStyle : selectStyle}
                  >
                    <option value="" disabled>{certNoExpiry ? '—' : '월'}</option>
                    {monthOptions.map(m => <option key={m} value={m}>{m}월</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="px-6 pb-8 pt-2 flex gap-2.5" style={{ borderTop: '1px solid #EDE8E2' }}>
              <button
                className="flex-1 py-4 rounded-xl text-[16px] font-medium border-none active:scale-[0.97] transition-transform"
                style={{ background: '#F7F5F2', color: '#888780' }}
                onClick={closeCertForm}
              >
                취소
              </button>
              <button
                className="flex-[2] py-4 rounded-xl text-[16px] font-bold text-white border-none active:scale-[0.97] transition-transform"
                style={{ background: canSubmitCert ? '#E85C1E' : '#CCC', boxShadow: canSubmitCert ? '0 2px 8px rgba(232,92,30,0.3)' : 'none' }}
                onClick={addCertification}
                disabled={!canSubmitCert}
              >
                추가하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// ─── 관심 목록 ───
function FavoritesView({ favorites, toggleFav, jobs }) {
  const favJobs = jobs.filter(j => favorites.includes(j.id));

  if (favJobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-5 pt-20 animate-fade-up">
        <div className="w-[80px] h-[80px] rounded-full flex items-center justify-center mb-5" style={{ background: '#FFF5F0' }}>
          <span className="text-[40px]">🤍</span>
        </div>
        <div className="text-[19px] font-extrabold mb-2" style={{ color: '#1A1A18' }}>아직 관심 일자리가 없어요</div>
        <div className="text-[15px] text-center leading-relaxed" style={{ color: '#888780' }}>
          마음에 드는 일자리의 하트를 눌러<br />여기서 모아볼 수 있어요
        </div>
      </div>
    );
  }

  return (
    <div className="px-[18px] pt-4">
      <div className="flex justify-between items-center mb-3">
        <div className="text-[15px] font-bold" style={{ color: '#1A1A18' }}>❤️ 관심 일자리</div>
        <span className="text-[13px] font-semibold" style={{ color: '#E85C1E' }}>{favJobs.length}건</span>
      </div>
      <div className="flex flex-col gap-3">
        {favJobs.map((job, i) => (
          <JobCard key={job.id} job={job} index={i} isFav={true} toggleFav={toggleFav} />
        ))}
      </div>
    </div>
  );
}

// ─── 지원내역 ───
function HistoryView() {
  return (
    <div className="flex flex-col items-center justify-center px-5 pt-20 animate-fade-up">
      <div className="w-[80px] h-[80px] rounded-full flex items-center justify-center mb-5" style={{ background: '#F0F4FF' }}>
        <span className="text-[40px]">📋</span>
      </div>
      <div className="text-[19px] font-extrabold mb-2" style={{ color: '#1A1A18' }}>아직 지원한 곳이 없어요</div>
      <div className="text-[15px] text-center leading-relaxed" style={{ color: '#888780' }}>
        마음에 드는 일자리에 지원하면<br />진행 상황을 여기서 확인할 수 있어요
      </div>
    </div>
  );
}

// ─────────────────────────────────────
// 메인 Export
// ─────────────────────────────────────
export default function HomePage() {
  const [screen, setScreen] = useState('loading');
  const [region, setRegion] = useState('');
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');

  // 진입 시 화면 결정. 랜딩 없이 공고(main)로 바로 진입한다.
  // 로그인은 관심·지원내역·내정보 등 로그인 필요 동작에서 유도한다.
  useEffect(() => {
    // 타임아웃은 느린 네트워크 방어용. 10초로 완화.
    const timeout = setTimeout(() => setScreen('main'), 10000);

    supabase.auth.getSession().then(() => {
      clearTimeout(timeout);
      // 로그인 여부와 무관하게 공고 화면으로 직행 (공고 조회는 비로그인도 가능).
      setScreen('main');
    }).catch(() => {
      clearTimeout(timeout);
      setScreen('main');
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // 신규 카카오 로그인 직후 1회만 위치 허용 화면 노출
        setScreen('location');
      } else if (event === 'SIGNED_OUT') {
        setScreen('main');
      }
    });

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="w-full min-h-screen bg-[#FAFAF8] relative overflow-hidden">
        {screen === 'loading' && (
          <div className="flex flex-col min-h-screen items-center justify-center" style={{ background: 'linear-gradient(180deg, #F5F0EB 0%, #FFF5F0 100%)' }}>
            <div className="animate-fade-up">
              <div className="w-[96px] h-[96px] rounded-[24px] flex items-center justify-center mb-5 shadow-[0_8px_28px_rgba(232,92,30,0.3)]" style={{ background: 'linear-gradient(135deg, #E85C1E 0%, #D14E15 100%)' }}>
                <AppIcon />
              </div>
            </div>
            <div className="animate-fade-up animation-delay-100 flex items-baseline gap-px mb-3">
              <span className="text-[32px] font-black tracking-[-2px]" style={{ color: '#E85C1E' }}>일</span>
              <span className="text-[32px] font-black text-[#212121] tracking-[-2px]">손</span>
            </div>
            <div className="animate-fade-up animation-delay-150 text-[14px] font-medium" style={{ color: '#888780' }}>
              걸어서 갈 수 있는 일자리
            </div>
            <div className="animate-fade-up animation-delay-200 mt-6">
              <div className="w-8 h-8 border-[3px] rounded-full animate-spin" style={{ borderColor: 'rgba(232,92,30,0.15)', borderTopColor: '#E85C1E' }} />
            </div>
          </div>
        )}
        {screen === 'login' && <LoginScreen onNext={() => setScreen('location')} onBack={() => setScreen('main')} />}
        {screen === 'location' && (
          <LocationScreen
            onGranted={(r) => { setRegion(r); setScreen('main'); }}
            onSkip={() => { setRegion('위치 미설정'); setScreen('main'); }}
          />
        )}
        {screen === 'main' && <MainScreen region={region} setRegion={setRegion} initialTab={tabParam || 'home'} onRequireLogin={() => setScreen('login')} />}
      </div>
  );
}