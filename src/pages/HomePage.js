import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
// lucide-react 제거 — AppIcon을 커스텀 SVG로 교체

// ─── 데이터 유틸 ───
const JOB_ICONS = { '경비': '🏢', '청소': '🧹', '주차관리': '🅿️', '시설관리': '🏫', '미화': '🌳', '조리': '🍳' };

function formatJobFromDB(job, index) {
  const icon = JOB_ICONS[job.job_type] || '💼';
  const wage = job.hourly_wage ? `시급 ${job.hourly_wage?.toLocaleString()}원` : '';
  const tags = [job.work_hours, job.work_days].filter(Boolean);
  const createdAt = new Date(job.created_at);
  const now = new Date();
  const isNew = (now - createdAt) < 3 * 24 * 60 * 60 * 1000; // 3일 이내
  const dist = 0.5 + index * 0.7; // 임시 거리 (위치 기반 추후 구현)

  return {
    id: job.id,
    icon,
    title: job.title,
    location: job.address,
    pay: wage,
    tags,
    company: job.employers?.company_name || '',
    isNew,
    distance: dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)}km`,
    dist,
    walkTime: `${Math.round(dist * 15)}분`,
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




// ─────────────────────────────────────
// 1) 로그인 화면
// ─────────────────────────────────────
function LoginScreen({ onNext }) {
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
        <div className="flex gap-3.5 mt-9 animate-fade-up animation-delay-150 w-full px-4">
          <div className="flex-1 text-center py-5 rounded-2xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <div className="text-[28px] font-black tracking-tight" style={{ color: '#E85C1E' }}>1,200+</div>
            <div className="text-[13px] text-[#888780] font-medium mt-1.5">지금 뽑고 있어요</div>
          </div>
          <div className="flex-1 text-center py-5 rounded-2xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <div className="text-[28px] font-black tracking-tight" style={{ color: '#E85C1E' }}>8,500+</div>
            <div className="text-[13px] text-[#888780] font-medium mt-1.5">이미 찾았어요</div>
          </div>
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
            const addr = data.address || {};
            const name = addr.village || addr.town || addr.city_district || addr.county || addr.city || '내 동네';
            setRegionName(name);
            setLoading(false);
            setDone(true);
            setTimeout(() => onGranted(name), 800);
          } catch {
            setRegionName('화도읍');
            setLoading(false);
            setDone(true);
            setTimeout(() => onGranted('화도읍'), 800);
          }
        },
        () => {
          setRegionName('화도읍');
          setLoading(false);
          setDone(true);
          setTimeout(() => onGranted('화도읍'), 800);
        },
        { timeout: 8000 }
      );
    } else {
      setRegionName('화도읍');
      setLoading(false);
      setDone(true);
      setTimeout(() => onGranted('화도읍'), 800);
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
// 3) 메인 화면
// ─────────────────────────────────────
function MainScreen({ region, setRegion, initialTab = 'home' }) {
  const [currentDistance, setCurrentDistance] = useState('3km');
  const [activeTab, setActiveTab] = useState(initialTab);
  const [favorites, setFavorites] = useState([]);
  const [profile, setProfile] = useState({
    name: '',
    phone: '',
    avatar_url: '',
    days: ['월', '화', '수', '목', '금'],
    times: ['오전', '오후'],
    jobs: [],
    distance: '1km',
  });
  const [workerId, setWorkerId] = useState(null);
  const [kakaoId, setKakaoId] = useState(null);

  // 카카오 로그인 + workers 테이블 프로필 로드
  useEffect(() => {
    const loadProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const meta = session.user.user_metadata;
      const kId = meta?.provider_id;
      setKakaoId(kId);

      // 기본 카카오 정보
      setProfile(prev => ({
        ...prev,
        name: meta?.name || meta?.full_name || '사용자',
        phone: session.user.email || '',
        avatar_url: meta?.avatar_url || '',
      }));

      // workers 테이블에서 프로필 조회
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
        }));
      }
    };
    loadProfile();
  }, []);

  const [jobs, setJobs] = useState([]);

  // DB에서 일자리 가져오기
  useEffect(() => {
    const loadJobs = async () => {
      try {
        const { data, error } = await supabase
          .from('jobs')
          .select('*, employers(company_name)')
          .eq('status', 'open')
          .order('created_at', { ascending: false });

        if (!error && data) {
          setJobs(data.map((job, i) => formatJobFromDB(job, i)));
        }
      } catch (e) {
        console.error('일자리 로딩 오류:', e);
      }
    };
    loadJobs();
  }, []);

  const toggleFav = (id) => setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  const filtered = getFiltered(jobs, currentDistance);

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
        <button className="w-[36px] h-[36px] rounded-full flex items-center justify-center relative active:scale-95 transition-transform" style={{ background: '#FFF5F0', border: '1.5px solid #FDDCCC' }}>
          <span style={{ color: '#E85C1E', fontSize: '17px' }}>🔔</span>
          <div className="absolute -top-0.5 -right-0.5 w-[8px] h-[8px] rounded-full" style={{ background: '#E85C1E', border: '2px solid white' }} />
        </button>
      </div>

      {/* 위치 바 — 홈탭에서만 표시 */}
      {activeTab === 'home' && (
        <div className="px-5 py-2.5 flex items-center justify-between" style={{ background: '#FAFAF8', borderBottom: '1px solid #EDE8E2' }}>
          <div className="flex items-center gap-2.5 cursor-pointer active:opacity-70 transition-opacity">
            <div className="w-[32px] h-[32px] rounded-full flex items-center justify-center" style={{ background: '#FFF5F0' }}>
              <span style={{ fontSize: '16px' }}>📍</span>
            </div>
            <div>
              <div className="text-[15px] font-bold" style={{ color: '#1A1A18' }}>{region || '위치 미설정'} <span className="text-[13px] font-medium" style={{ color: '#B4B2A9' }}>▾</span></div>
              <div className="text-[11px] font-medium mt-px" style={{ color: '#888780' }}>지금 내 위치에서 찾는 중</div>
            </div>
          </div>
          <div className="text-[12px] font-medium px-2.5 py-1 rounded-full" style={{ background: '#E8F5E9', color: '#2E7D32' }}>
            실시간
          </div>
        </div>
      )}

      {/* 스크롤 영역 */}
      <div className="flex-1 overflow-y-auto pb-24 [-webkit-overflow-scrolling:touch]">
        {activeTab === 'home' && (
          <ListView filtered={filtered} currentDistance={currentDistance} setCurrentDistance={setCurrentDistance} favorites={favorites} toggleFav={toggleFav} />
        )}
        {activeTab === 'favorites' && <FavoritesView favorites={favorites} toggleFav={toggleFav} jobs={jobs} />}
        {activeTab === 'history' && <HistoryView />}
{activeTab === 'profile' && <ProfileView region={region} profile={profile} setProfile={setProfile} kakaoId={kakaoId} workerId={workerId} setWorkerId={setWorkerId} />}
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
              onClick={() => setActiveTab(tab.key)}
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
    </div>
  );
}

// ─── 리스트 뷰 ───
function ListView({ filtered, currentDistance, setCurrentDistance, favorites, toggleFav }) {
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
        <h2 className="text-[16px] font-extrabold" style={{ color: '#1A1A18' }}>가까운 일자리</h2>
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
const PROFILE_JOBS = ['아파트 경비', '상가·건물 청소', '조경', '주차 관리', '택배·물류 분류'];
const PROFILE_DISTS = ['500m', '1km', '3km', '무관'];

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

function ProfileView({ region, profile, setProfile, kakaoId, workerId, setWorkerId }) {
  const toggleArr = (key, val) => {
    setProfile(p => {
      const arr = p[key] || [];
      return { ...p, [key]: arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val] };
    });
  };

  const [careers, setCareers] = useState([
    { id: 1, company: '다웰서비스', role: '아파트 경비', startDate: '2020.03', endDate: '2023.12' },
  ]);
  const [showCareerForm, setShowCareerForm] = useState(false);
  const [newCareer, setNewCareer] = useState({ company: '', role: '', startDate: '', endDate: '' });
  const [isCurrentJob, setIsCurrentJob] = useState(false);
  const [startYear, setStartYear] = useState('');
  const [startMonth, setStartMonth] = useState('');
  const [endYear, setEndYear] = useState('');
  const [endMonth, setEndMonth] = useState('');

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

  const addCareer = () => {
    if (!canSubmitCareer) return;
    const sd = `${startYear}.${String(startMonth).padStart(2, '0')}`;
    const ed = isCurrentJob ? '' : (endYear && endMonth ? `${endYear}.${String(endMonth).padStart(2, '0')}` : '');
    setCareers(prev => [...prev, { company: newCareer.company, role: newCareer.role, startDate: sd, endDate: ed, id: Date.now() }]);
    closeCareerForm();
    triggerSave();
  };

  const removeCareer = (id) => {
    setCareers(prev => prev.filter(c => c.id !== id));
    triggerSave();
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
  const triggerSave = async () => {
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 1800);

    // workers 테이블에 저장
    if (!kakaoId) return;

    const payload = {
      name: profile.name,
      phone: profile.phone || `kakao_${kakaoId}`,
      address: region || '',
      job_types: profile.jobs,
      available_times: [...profile.days, ...profile.times],
      kakao_id: kakaoId,
    };

    try {
      if (workerId) {
        await supabase.from('workers').update(payload).eq('id', workerId);
      } else {
        const { data } = await supabase.from('workers').insert([payload]).select().single();
        if (data) setWorkerId(data.id);
      }
    } catch (e) {
      console.error('프로필 저장 오류:', e);
    }
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
        <div className="text-[22px] font-extrabold text-white">내 정보</div>
        <div className="text-[13px] text-white/70 mt-1">일자리 매칭에 사용됩니다</div>
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
                  onClick={() => { toggleArr('days', d); triggerSave(); }}
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
                    onClick={() => { toggleArr('times', t); triggerSave(); }}
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
                  onClick={() => { toggleArr('jobs', job); triggerSave(); }}
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
            <div className="flex gap-1.5">
              {PROFILE_DISTS.map(d => {
                const on = profile.distance === d;
                return (
                  <button key={d} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-[13px]"
                    style={{ background: '#F7F5F2', border: '1px solid #EDE8E2', color: on ? '#1A1A18' : '#888780', fontWeight: on ? 500 : 400 }}
                    onClick={() => { setProfile(p => ({ ...p, distance: d })); triggerSave(); }}
                  >
                    <span className="w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0"
                      style={on ? { background: '#E85C1E', border: '1.5px solid #E85C1E' } : { background: '#fff', border: '1.5px solid #EDE8E2' }}
                    >{on && <span className="w-1.5 h-1.5 rounded-full bg-white" />}</span>
                    {d}
                  </button>
                );
              })}
            </div>
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
          <div className="text-[14px] leading-relaxed px-3 py-2.5 rounded-lg min-h-[64px]" style={{ background: '#F7F5F2', border: '1px solid #EDE8E2', color: '#1A1A18' }}>
            성실하게 일하겠습니다. 경비 경험 있습니다.
          </div>
        </ProfileSection>

      </div>

      {/* 자동저장 안내 */}
      <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: '#FAFAF8', borderTop: '1px solid #EDE8E2' }}>
        <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
        <span className="text-[13px]" style={{ color: '#888780' }}>변경사항이 자동으로 저장돼요</span>
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

  // 카카오 로그인 후 세션 확인
  useEffect(() => {
    const timeout = setTimeout(() => setScreen('login'), 3000); // 3초 타임아웃

    supabase.auth.getSession().then(({ data: { session } }) => {
      clearTimeout(timeout);
      if (session) {
        // ?tab= 파라미터가 있으면 이미 온보딩 완료된 사용자로 간주하고 바로 메인으로 이동
        // (JobDetailPage에서 /?tab=profile 같은 딥링크로 들어오는 경우 처리)
        setScreen(tabParam ? 'main' : 'location');
      } else {
        setScreen('login');
      }
    }).catch(() => {
      clearTimeout(timeout);
      setScreen('login');
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setScreen('location');
      }
    });

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="flex justify-center min-h-screen bg-[#f0f0ed]">
      <div className="max-w-app w-full min-h-screen bg-[#FAFAF8] relative overflow-hidden sm:rounded-[32px] sm:shadow-[0_8px_40px_rgba(0,0,0,0.12)] sm:my-5 sm:min-h-[90vh]">
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
        {screen === 'login' && <LoginScreen onNext={() => setScreen('location')} />}
        {screen === 'location' && (
          <LocationScreen
            onGranted={(r) => { setRegion(r); setScreen('main'); }}
            onSkip={() => { setRegion('위치 미설정'); setScreen('main'); }}
          />
        )}
        {screen === 'main' && <MainScreen region={region} setRegion={setRegion} initialTab={tabParam || 'home'} />}
      </div>
    </div>
  );
}
