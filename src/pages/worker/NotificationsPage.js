import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { BottomNav } from '../../components/common';

const JOB_ICONS = {
  '청소/미화': '🧹',
  '경비/주차관리': '🛡️',
  '시설관리': '🔧',
};

// 실제 알림이 없을 때 보여줄 미리보기 샘플
const SAMPLE = [
  { id: 's1', job_type: '청소/미화', company: '미래크린', title: '매교동 아파트 미화원 모집', wage: '월 215만원', when: '방금 전' },
  { id: 's2', job_type: '경비/주차관리', company: '안심시큐리티', title: '영통동 상가 경비원 구함', wage: '월 240만원', when: '1시간 전' },
  { id: 's3', job_type: '시설관리', company: '대원FM', title: '권선동 빌딩 시설기사', wage: '월 260만원', when: '오늘 오전' },
];

function formatWage(job) {
  if (!job) return '';
  const amt = job.wage_amount;
  if (!amt) return '급여 협의';
  if (job.wage_type === 'hourly') return `시급 ${Number(amt).toLocaleString()}원`;
  if (job.wage_type === 'daily') return `일급 ${Number(amt).toLocaleString()}원`;
  return `월 ${Number(amt).toLocaleString()}원`;
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return '방금 전';
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  return `${Math.floor(hr / 24)}일 전`;
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState(null); // null = 로딩

  useEffect(() => {
    const load = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { setItems([]); return; }

        const kakaoId = session.user.user_metadata?.provider_id;
        const { data: worker } = await supabase
          .from('workers').select('id').eq('kakao_id', kakaoId).maybeSingle();
        if (!worker) { setItems([]); return; }

        const { data } = await supabase
          .from('kakao_notifications')
          .select('*, jobs(title, job_type, wage_type, wage_amount, company_name, employers(company_name))')
          .eq('worker_id', worker.id)
          .order('sent_at', { ascending: false })
          .limit(30);
        setItems(data || []);
      } catch {
        setItems([]);
      }
    };
    load();
  }, []);

  const isSample = items !== null && items.length === 0;

  return (
    <div className="min-h-screen bg-[#FAF8F5] pb-24">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-white px-4 py-4 flex items-center gap-3 border-b border-[#EDE8E2]">
        <button
          onClick={() => navigate('/')}
          className="w-10 h-10 flex items-center justify-center rounded-full active:scale-95"
          aria-label="뒤로"
        >
          <span className="text-2xl">←</span>
        </button>
        <h1 className="text-[20px] font-extrabold text-[#1A1A18]">알림</h1>
      </div>

      {/* 샘플 안내 배너 */}
      {isSample && (
        <div className="mx-4 mt-4 p-4 rounded-2xl bg-[#FFF5F0] border border-[#FDDCCC]">
          <p className="text-[15px] text-[#E85C1E] font-bold mb-1">알림 미리보기</p>
          <p className="text-[14px] text-[#7A756C] leading-relaxed">
            조건에 맞는 일자리가 등록되면 카카오톡으로 알림을 보내드립니다.
            아래는 알림이 어떻게 오는지 보여주는 예시입니다.
          </p>
        </div>
      )}

      {/* 로딩 */}
      {items === null && (
        <div className="px-4 py-20 text-center text-[#B4B2A9]">불러오는 중...</div>
      )}

      {/* 알림 목록 */}
      <div className="px-4 pt-4 space-y-4">
        {isSample &&
          SAMPLE.map((n) => (
            <div key={n.id} className="bg-white rounded-2xl p-5 border border-[#EDE8E2]">
              <div className="flex items-center justify-between mb-3">
                <span className="inline-flex items-center gap-2 bg-orange-100 text-orange-600 text-[15px] font-bold px-3 py-1.5 rounded-full">
                  {JOB_ICONS[n.job_type]} {n.job_type}
                </span>
                <span className="text-[13px] text-[#B4B2A9]">{n.when}</span>
              </div>
              <p className="text-[19px] font-bold text-[#1A1A18] mb-1">{n.title}</p>
              <p className="text-[15px] text-[#7A756C] mb-3">{n.company}</p>
              <div className="bg-[#F0FAF4] rounded-xl px-4 py-3">
                <span className="text-[20px] font-bold text-green-600">{n.wage}</span>
              </div>
            </div>
          ))}

        {!isSample && items !== null &&
          items.map((n) => {
            const job = n.jobs;
            const company = job?.employers?.company_name || job?.company_name || '';
            return (
              <button
                key={n.id}
                onClick={() => n.job_id && navigate(`/jobs/${n.job_id}`)}
                className="w-full text-left bg-white rounded-2xl p-5 border border-[#EDE8E2] active:scale-[0.99] transition-transform"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center gap-2 bg-orange-100 text-orange-600 text-[15px] font-bold px-3 py-1.5 rounded-full">
                    {JOB_ICONS[job?.job_type]} {job?.job_type || '새 일자리'}
                  </span>
                  <span className="text-[13px] text-[#B4B2A9]">{timeAgo(n.sent_at)}</span>
                </div>
                <p className="text-[19px] font-bold text-[#1A1A18] mb-1">{job?.title || n.message}</p>
                {company && <p className="text-[15px] text-[#7A756C] mb-3">{company}</p>}
                {job && (
                  <div className="bg-[#F0FAF4] rounded-xl px-4 py-3">
                    <span className="text-[20px] font-bold text-green-600">{formatWage(job)}</span>
                  </div>
                )}
              </button>
            );
          })}
      </div>

      <BottomNav />
    </div>
  );
}
