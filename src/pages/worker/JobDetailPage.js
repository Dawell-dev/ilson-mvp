/**
 * 변경 요약 (2026-04-21)
 * - Auth: localStorage.worker 제거 → supabase.auth 세션 + workers.kakao_id 조회로 통일
 * - UI: lucide-react 제거, HomePage.js 디자인 언어(#E85C1E, 이모지, 둥근 카드)로 전면 개편
 * - UX: 지원 확인 바텀시트 + 토스트, requirements/benefits 조건부 렌더, 지도 링크 추가
 * - 세션 없으면 '/'로 리다이렉트, 프로필 없으면 토스트 후 홈 복귀
 * - Phase A (이력서 강화): 지원 모달 문구를 "내 이력서 전달" 중심으로 변경
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { JOB_ICONS } from '../../constants/jobTypes';

function KakaoIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path d="M12 3C6.48 3 2 6.58 2 10.95c0 2.82 1.87 5.3 4.69 6.7-.15.53-.96 3.43-1 3.58 0 .05.02.1.06.13.04.02.09.01.13-.01.17-.03 3.18-2.1 3.68-2.44.79.12 1.6.18 2.44.18 5.52 0 10-3.58 10-7.95S17.52 3 12 3z" fill="#191919" />
    </svg>
  );
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(km) {
  return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;
}

export default function JobDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [workerRow, setWorkerRow] = useState(null);
  const [applied, setApplied] = useState(false);
  const [applying, setApplying] = useState(false);
  const [isFav, setIsFav] = useState(false);
  const [userCoords, setUserCoords] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 1800);
  };

  // 1) 세션 + workers 테이블 조회 (비로그인도 열람 가능 — 로그인은 지원 시점에 요구)
  useEffect(() => {
    const loadSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      const kId = session.user.user_metadata?.provider_id;
      if (!kId) return;
      const { data: worker } = await supabase
        .from('workers')
        .select('*')
        .eq('kakao_id', kId)
        .maybeSingle();
      if (worker) setWorkerRow(worker);
    };
    loadSession();
  }, []);

  // 2) 일자리 조회
  useEffect(() => {
    const loadJob = async () => {
      try {
        const { data, error } = await supabase
          .from('jobs')
          .select('*, employers (company_name, contact_name, phone, address)')
          .eq('id', id)
          .maybeSingle();
        if (error) throw error;
        setJob(data);
      } catch (e) {
        console.error('일자리 로딩 오류:', e);
      } finally {
        setLoading(false);
      }
    };
    loadJob();
  }, [id]);

  // 3) 중복 지원 체크
  useEffect(() => {
    const checkApplied = async () => {
      if (!workerRow?.id || !id) return;
      const { data } = await supabase
        .from('applications')
        .select('id')
        .eq('job_id', id)
        .eq('worker_id', workerRow.id)
        .maybeSingle();
      if (data) setApplied(true);
    };
    checkApplied();
  }, [workerRow, id]);

  // 4) 거리 뱃지용 사용자 위치 (조용히 실패)
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { timeout: 5000 }
    );
  }, []);

  const handleApplyClick = () => {
    if (applied) return;
    if (!workerRow) {
      // 비로그인 또는 프로필 미등록 — 지원 기록을 남기려면 카카오 로그인이 필요하다
      showToast('지원하려면 카카오 로그인이 필요해요');
      setTimeout(() => navigate('/?tab=profile'), 1400);
      return;
    }
    setShowConfirm(true);
  };

  const confirmApply = async () => {
    if (!workerRow) return;
    setApplying(true);
    try {
      const { error } = await supabase.from('applications').insert([
        { job_id: id, worker_id: workerRow.id, status: 'pending' },
      ]);
      if (error) {
        if (error.code === '23505') {
          setApplied(true);
          setShowConfirm(false);
          showToast('이미 지원하신 일자리예요');
          return;
        }
        throw error;
      }
      setApplied(true);
      setShowConfirm(false);
      showToast('지원이 완료됐어요');
    } catch (e) {
      console.error('지원 오류:', e);
      showToast('잠시 후 다시 시도해주세요');
    } finally {
      setApplying(false);
    }
  };

  const handleCall = () => {
    if (job?.employers?.phone) window.location.href = `tel:${job.employers.phone}`;
  };

  // ─── 로딩 ───
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F7F5F2' }}>
        <div className="w-10 h-10 border-[3px] rounded-full animate-spin" style={{ borderColor: 'rgba(232,92,30,0.15)', borderTopColor: '#E85C1E' }} />
      </div>
    );
  }

  // ─── 에러: 일자리 없음 ───
  if (!job) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: '#F7F5F2' }}>
        <div className="text-[calc(52px*var(--font-scale,1))] mb-4">🔍</div>
        <div className="text-[calc(18px*var(--font-scale,1))] font-bold mb-2" style={{ color: '#1A1A18' }}>일자리를 찾을 수 없어요</div>
        <div className="text-[calc(14px*var(--font-scale,1))] text-center mb-6 leading-relaxed" style={{ color: '#888780' }}>
          이미 마감되었거나<br />삭제된 일자리일 수 있어요
        </div>
        <button
          className="py-3.5 px-7 border-none rounded-[18px] text-white text-[calc(15px*var(--font-scale,1))] font-bold active:scale-[0.97] transition-transform"
          style={{ background: '#E85C1E', boxShadow: '0 2px 8px rgba(232,92,30,0.3)' }}
          onClick={() => navigate('/')}
        >
          홈으로 돌아가기
        </button>
      </div>
    );
  }

  const icon = JOB_ICONS[job.job_type] || '💼';
  const createdAt = new Date(job.created_at);
  const isNew = (new Date() - createdAt) < 3 * 24 * 60 * 60 * 1000;
  const distKm = (userCoords && job.lat && job.lng)
    ? haversineKm(userCoords.lat, userCoords.lng, Number(job.lat), Number(job.lng))
    : null;
  const walkMin = distKm != null ? Math.max(1, Math.round(distKm * 15)) : null;
  const addressForMap = job.address || job.employers?.address;
  const mapUrl = addressForMap ? `https://map.kakao.com/?q=${encodeURIComponent(addressForMap)}` : null;

  return (
    <div className="flex justify-center min-h-screen bg-[#f0f0ed]">
      <div className="max-w-app w-full min-h-screen relative overflow-hidden sm:rounded-[32px] sm:shadow-[0_8px_40px_rgba(0,0,0,0.12)] sm:my-5 sm:min-h-[90vh]" style={{ background: '#F7F5F2' }}>

        {/* 토스트 */}
        <div
          className="fixed top-20 left-1/2 -translate-x-1/2 z-[300] py-2 px-5 rounded-full text-[calc(13px*var(--font-scale,1))] text-white transition-opacity"
          style={{ background: 'rgba(0,0,0,0.75)', opacity: toast ? 1 : 0, pointerEvents: 'none' }}
        >
          {toast}
        </div>

        {/* 상단 헤더 */}
        <div
          className="px-3 py-2 flex items-center justify-between sticky top-0 z-50"
          style={{ background: 'rgba(250,250,248,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #EDE8E2' }}
        >
          <button
            className="w-11 h-11 rounded-full flex items-center justify-center active:scale-90 transition-transform"
            style={{ background: 'transparent' }}
            onClick={() => navigate(-1)}
            aria-label="뒤로가기"
          >
            <span className="text-[calc(26px*var(--font-scale,1))] leading-none" style={{ color: '#1A1A18' }}>‹</span>
          </button>
          <div className="text-[calc(16px*var(--font-scale,1))] font-bold" style={{ color: '#1A1A18' }}>일자리 상세</div>
          <button
            className="w-11 h-11 rounded-full flex items-center justify-center active:scale-90 transition-transform"
            style={{ background: isFav ? '#FFF5F0' : 'transparent' }}
            onClick={() => setIsFav(v => !v)}
            aria-label="관심"
          >
            <span className="text-[calc(20px*var(--font-scale,1))]">{isFav ? '❤️' : '🤍'}</span>
          </button>
        </div>

        <div className="pb-28">
          {/* 히어로 섹션 */}
          <div className="px-5 pt-5 pb-5" style={{ background: '#FFFFFF' }}>
            <div className="flex gap-4 items-start">
              <div
                className="w-[72px] h-[72px] rounded-full flex items-center justify-center flex-shrink-0 text-[calc(34px*var(--font-scale,1))]"
                style={{ background: '#FFF5F0' }}
              >
                {icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex gap-1.5 flex-wrap mb-2">
                  {distKm != null && (
                    <span className="text-[calc(12px*var(--font-scale,1))] font-bold py-[4px] px-2.5 rounded-full" style={{ background: '#FFF5F0', color: '#E85C1E' }}>
                      🚶 {formatDistance(distKm)} · {walkMin}분
                    </span>
                  )}
                  {isNew && (
                    <span
                      className="text-[calc(11px*var(--font-scale,1))] font-bold py-[4px] px-2.5 rounded-full text-white"
                      style={{ background: 'linear-gradient(135deg, #E85C1E, #FF7043)' }}
                    >
                      NEW
                    </span>
                  )}
                </div>
                <div className="text-[calc(20px*var(--font-scale,1))] font-extrabold leading-snug" style={{ color: '#1A1A18' }}>{job.title}</div>
                <div className="text-[calc(14px*var(--font-scale,1))] mt-1.5 leading-snug" style={{ color: '#888780' }}>
                  {job.employers?.company_name}
                  {job.address ? ` · ${job.address}` : ''}
                </div>
              </div>
            </div>
          </div>

          {/* 시급 하이라이트 */}
          <div className="px-4 pt-3">
            <div className="rounded-[14px] py-4 px-5 flex items-center justify-between" style={{ background: '#FFF8F5' }}>
              <div>
                <div className="text-[calc(14px*var(--font-scale,1))] font-medium" style={{ color: '#888780' }}>💰 시급</div>
                <div className="text-[calc(24px*var(--font-scale,1))] font-extrabold mt-0.5" style={{ color: '#E85C1E', letterSpacing: '-0.5px' }}>
                  {job.hourly_wage ? `${job.hourly_wage.toLocaleString()}원` : '협의'}
                </div>
              </div>
              {job.work_hours && (
                <div className="text-[calc(13px*var(--font-scale,1))] font-medium text-right max-w-[45%]" style={{ color: '#5F5E5A' }}>
                  {job.work_hours}
                </div>
              )}
            </div>
          </div>

          {/* 근무 조건 */}
          <div className="px-4 pt-3">
            <div className="rounded-[18px] p-5" style={{ background: '#FFFFFF', border: '1px solid #EDE8E2', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div className="text-[calc(16px*var(--font-scale,1))] font-extrabold mb-3" style={{ color: '#1A1A18' }}>📅 근무 조건</div>
              {[
                { label: '근무 요일', value: job.work_days },
                { label: '근무 시간', value: job.work_hours },
                { label: '직종', value: job.job_type },
                { label: '모집 인원', value: job.headcount ? `${job.headcount}명` : null },
              ].filter(r => r.value).map((row, i, arr) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between py-3"
                  style={{ borderBottom: i < arr.length - 1 ? '1px solid #EDE8E2' : 'none' }}
                >
                  <span className="text-[calc(14px*var(--font-scale,1))]" style={{ color: '#888780' }}>{row.label}</span>
                  <span className="text-[calc(15px*var(--font-scale,1))] font-medium text-right" style={{ color: '#1A1A18' }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 업무 내용 */}
          {job.description && (
            <div className="px-4 pt-3">
              <div className="rounded-[18px] p-5" style={{ background: '#FFFFFF', border: '1px solid #EDE8E2', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div className="text-[calc(16px*var(--font-scale,1))] font-extrabold mb-3" style={{ color: '#1A1A18' }}>📝 업무 내용</div>
                <p className="text-[calc(15px*var(--font-scale,1))] whitespace-pre-wrap leading-relaxed" style={{ color: '#1A1A18' }}>
                  {job.description}
                </p>
              </div>
            </div>
          )}

          {/* 지원 자격·우대사항 */}
          {job.requirements && (
            <div className="px-4 pt-3">
              <div className="rounded-[18px] p-5" style={{ background: '#FFFFFF', border: '1px solid #EDE8E2', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div className="text-[calc(16px*var(--font-scale,1))] font-extrabold mb-3" style={{ color: '#1A1A18' }}>✅ 지원 자격·우대사항</div>
                <p className="text-[calc(15px*var(--font-scale,1))] whitespace-pre-wrap leading-relaxed" style={{ color: '#1A1A18' }}>
                  {job.requirements}
                </p>
              </div>
            </div>
          )}

          {/* 복리후생 */}
          {job.benefits && (
            <div className="px-4 pt-3">
              <div className="rounded-[18px] p-5" style={{ background: '#FFFFFF', border: '1px solid #EDE8E2', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div className="text-[calc(16px*var(--font-scale,1))] font-extrabold mb-3" style={{ color: '#1A1A18' }}>🎁 복리후생</div>
                <p className="text-[calc(15px*var(--font-scale,1))] whitespace-pre-wrap leading-relaxed" style={{ color: '#1A1A18' }}>
                  {job.benefits}
                </p>
              </div>
            </div>
          )}

          {/* 근무지 */}
          <div className="px-4 pt-3">
            <div className="rounded-[18px] p-5" style={{ background: '#FFFFFF', border: '1px solid #EDE8E2', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div className="text-[calc(16px*var(--font-scale,1))] font-extrabold mb-3" style={{ color: '#1A1A18' }}>📍 근무지</div>
              <div className="text-[calc(15px*var(--font-scale,1))] mb-3 leading-relaxed" style={{ color: '#1A1A18' }}>
                {addressForMap || '주소 미등록'}
              </div>
              {mapUrl && (
                <a
                  href={mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[calc(14px*var(--font-scale,1))] font-bold"
                  style={{ color: '#E85C1E' }}
                >
                  지도로 보기 →
                </a>
              )}
            </div>
          </div>

          {/* 회사 정보 */}
          <div className="px-4 pt-3">
            <div className="rounded-[18px] p-5" style={{ background: '#FFFFFF', border: '1px solid #EDE8E2', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div className="text-[calc(16px*var(--font-scale,1))] font-extrabold mb-3" style={{ color: '#1A1A18' }}>🏢 회사 정보</div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-[calc(14px*var(--font-scale,1))]" style={{ color: '#888780' }}>회사명</span>
                <span className="text-[calc(15px*var(--font-scale,1))] font-medium" style={{ color: '#1A1A18' }}>{job.employers?.company_name || '-'}</span>
              </div>
              {job.employers?.contact_name && (
                <div className="flex items-center justify-between py-2.5" style={{ borderTop: '1px solid #EDE8E2' }}>
                  <span className="text-[calc(14px*var(--font-scale,1))]" style={{ color: '#888780' }}>담당자</span>
                  <span className="text-[calc(15px*var(--font-scale,1))] font-medium" style={{ color: '#1A1A18' }}>{job.employers.contact_name}</span>
                </div>
              )}
              {job.employers?.phone && (
                <div className="flex items-center justify-between py-2.5" style={{ borderTop: '1px solid #EDE8E2' }}>
                  <span className="text-[calc(14px*var(--font-scale,1))]" style={{ color: '#888780' }}>연락처</span>
                  <a href={`tel:${job.employers.phone}`} className="text-[calc(15px*var(--font-scale,1))] font-bold" style={{ color: '#E85C1E' }}>
                    {job.employers.phone}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 하단 고정 액션 */}
        <div
          className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-app z-[100]"
          style={{ background: '#FFFFFF', borderTop: '1px solid #EDE8E2', boxShadow: '0 -2px 12px rgba(0,0,0,0.04)' }}
        >
          <div className="px-4 py-3 pb-5 flex gap-2.5">
            <button
              className="w-[54px] h-[54px] border-none rounded-[14px] flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform shadow-sm"
              style={{ background: '#FEE500' }}
              onClick={handleCall}
              aria-label="전화 문의"
            >
              <KakaoIcon size={22} />
            </button>
            {applied ? (
              <button
                className="flex-1 h-[54px] border-none rounded-[14px] text-[calc(16px*var(--font-scale,1))] font-bold cursor-not-allowed"
                style={{ background: '#EDE8E2', color: '#888780' }}
                disabled
              >
                ✓ 이미 지원했어요
              </button>
            ) : (
              <button
                className="flex-1 h-[54px] border-none rounded-[14px] text-[calc(16px*var(--font-scale,1))] font-bold text-white active:scale-[0.97] transition-transform shadow-sm"
                style={{ background: 'linear-gradient(135deg, #E85C1E 0%, #D14E15 100%)' }}
                onClick={handleApplyClick}
              >
                지원하기
              </button>
            )}
          </div>
        </div>

        {/* 지원 확인 바텀시트 */}
        {showConfirm && (
          <div className="fixed inset-0 z-[200]">
            <div
              className="absolute inset-0 animate-overlay-in"
              style={{ background: 'rgba(0,0,0,0.5)' }}
              onClick={() => !applying && setShowConfirm(false)}
            />
            <div
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-app bg-white rounded-t-[28px] animate-slide-up-sheet"
              style={{ maxHeight: '85vh', overflowY: 'auto' }}
            >
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full" style={{ background: '#DDD' }} />
              </div>
              <div className="px-6 pt-3 pb-1">
                <div className="text-[calc(20px*var(--font-scale,1))] font-extrabold" style={{ color: '#1A1A18' }}>이 일자리에 지원할까요?</div>
              </div>
              <div className="px-6 pt-4 pb-4">
                <div className="rounded-[14px] p-4 mb-4" style={{ background: '#F7F5F2' }}>
                  <div className="text-[calc(16px*var(--font-scale,1))] font-bold leading-snug" style={{ color: '#1A1A18' }}>{job.title}</div>
                  <div className="text-[calc(13px*var(--font-scale,1))] mt-1" style={{ color: '#888780' }}>{job.employers?.company_name}</div>
                </div>
                <ul className="flex flex-col gap-3 m-0 p-0 list-none">
                  <li className="flex items-start gap-2.5">
                    <span className="text-[calc(18px*var(--font-scale,1))] flex-shrink-0 leading-none mt-0.5">📞</span>
                    <span className="text-[calc(15px*var(--font-scale,1))]" style={{ color: '#1A1A18' }}>지원하면 회사에서 연락드려요</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-[calc(18px*var(--font-scale,1))] flex-shrink-0 leading-none mt-0.5">📋</span>
                    <span className="text-[calc(15px*var(--font-scale,1))]" style={{ color: '#1A1A18' }}>내 이력서가 회사로 전달돼요 (이름, 연락처, 경력, 자격증 포함)</span>
                  </li>
                </ul>
              </div>
              <div className="px-6 pb-8 pt-3 flex gap-2.5" style={{ borderTop: '1px solid #EDE8E2' }}>
                <button
                  className="flex-1 py-4 rounded-xl text-[calc(16px*var(--font-scale,1))] font-medium border-none active:scale-[0.97] transition-transform"
                  style={{ background: '#F7F5F2', color: '#888780' }}
                  onClick={() => setShowConfirm(false)}
                  disabled={applying}
                >
                  취소
                </button>
                <button
                  className="flex-[2] py-4 rounded-xl text-[calc(16px*var(--font-scale,1))] font-bold text-white border-none active:scale-[0.97] transition-transform"
                  style={{ background: applying ? '#CCC' : '#E85C1E', boxShadow: applying ? 'none' : '0 2px 8px rgba(232,92,30,0.3)' }}
                  onClick={confirmApply}
                  disabled={applying}
                >
                  {applying ? '지원 중...' : '지원하기'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
