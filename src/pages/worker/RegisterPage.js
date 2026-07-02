import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { JOB_TYPES } from '../../constants/jobTypes';

const REGIONS = {
  '수원시': {
    '장안구': ['정자동', '파장동', '조원동', '송죽동'],
    '권선구': ['권선동', '세류동', '호매실동', '오목천동'],
    '팔달구': ['인계동', '매교동', '화서동', '우만동'],
    '영통구': ['매탄동', '영통동', '원천동', '망포동'],
  },
  '용인시': {
    '처인구': ['김량장동', '역북동', '삼가동', '유방동'],
    '기흥구': ['신갈동', '구갈동', '보라동', '동백동'],
    '수지구': ['풍덕천동', '죽전동', '동천동', '상현동'],
  },
  '화성시': {
    '동탄': ['동탄1동', '동탄2동', '동탄4동', '동탄6동'],
    '병점·진안': ['병점동', '진안동', '기산동', '반월동'],
  },
};

function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({ name: '', kakaoId: '', avatarUrl: '' });
  const [sel, setSel] = useState({ city: '', gu: '', dong: '' });
  const [jobTypes, setJobTypes] = useState([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { navigate('/'); return; }
      const meta = session.user.user_metadata;
      setProfile({
        name: meta?.name || meta?.full_name || meta?.nickname || '',
        kakaoId: meta?.provider_id || '',
        avatarUrl: meta?.avatar_url || '',
      });
    });
  }, [navigate]);

  const region = sel.city && sel.gu && sel.dong ? `${sel.city} ${sel.gu} ${sel.dong}` : '';

  const requestPermissions = async () => {
    try { navigator.geolocation?.getCurrentPosition(() => {}, () => {}, { timeout: 5000 }); } catch (e) {}
    try { if ('Notification' in window) await Notification.requestPermission(); } catch (e) {}
    setStep(2);
  };

  const toggleJob = (t) =>
    setJobTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.from('workers').insert([{
        name: profile.name,
        region,
        job_types: jobTypes,
        kakao_id: profile.kakaoId,
      }]);
      if (error) throw error;
      setStep(4);
    } catch (e) {
      alert('등록 중 오류가 발생했습니다: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const shareInvite = async () => {
    const url = window.location.origin;
    const text = '집 근처 일자리를 카톡으로 받는 일손이에요. 같이 써봐요!';
    try {
      if (navigator.share) {
        await navigator.share({ title: '일손', text, url });
      } else {
        await navigator.clipboard.writeText(`${text} ${url}`);
        alert('소개 링크를 복사했어요. 카톡에 붙여넣어 보내세요.');
      }
    } catch (e) {}
  };

  const Bar = ({ n }) => (
    <div className="flex gap-2 mb-8">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-2 flex-1 rounded-full" style={{ background: i <= n ? '#E85C1E' : '#EDE8E2' }} />
      ))}
    </div>
  );

  const Header = ({ title, sub }) => (
    <div className="px-6 py-8" style={{ background: '#E85C1E' }}>
      <h1 className="text-[28px] font-bold text-white">{title}</h1>
      <p className="text-[16px] text-white/80 mt-1">{sub}</p>
    </div>
  );

  const selBtn = (active) =>
    active
      ? { background: '#E85C1E', color: '#fff', borderColor: '#E85C1E' }
      : { background: '#fff', color: '#1A1A18', borderColor: '#EDE8E2' };

  // Step 1: 위치·알림 동의
  if (step === 1) {
    return (
      <div className="min-h-screen" style={{ background: '#F5F0EB' }}>
        <Header title="시작하기 전에" sub="딱 두 가지만 허용해주세요" />
        <div className="px-6 py-8">
          <Bar n={1} />
          {profile.avatarUrl && (
            <div className="flex items-center gap-3 mb-6 p-4 rounded-2xl" style={{ background: '#FFF5F0', border: '1px solid #FDDCCC' }}>
              <img src={profile.avatarUrl} alt="" className="w-12 h-12 rounded-full" />
              <div className="text-[16px] font-bold text-[#1A1A18]">{profile.name}님, 반가워요</div>
            </div>
          )}
          <div className="space-y-4 mb-8">
            <div className="flex items-start gap-4 bg-white rounded-2xl p-5 border border-[#EDE8E2]">
              <span className="text-2xl">📍</span>
              <div>
                <div className="text-[18px] font-bold text-[#1A1A18]">위치 허용</div>
                <div className="text-[15px] text-[#7A756C] mt-1">가까운 일자리를 먼저 보여드려요</div>
              </div>
            </div>
            <div className="flex items-start gap-4 bg-white rounded-2xl p-5 border border-[#EDE8E2]">
              <span className="text-2xl">🔔</span>
              <div>
                <div className="text-[18px] font-bold text-[#1A1A18]">알림 허용</div>
                <div className="text-[15px] text-[#7A756C] mt-1">새 일자리를 카톡으로 알려드려요</div>
              </div>
            </div>
          </div>
          <button className="w-full py-5 rounded-2xl text-[18px] font-bold text-white border-none" style={{ background: '#E85C1E' }} onClick={requestPermissions}>
            허용하고 계속하기
          </button>
          <button className="w-full py-4 mt-3 rounded-2xl text-[16px] font-medium border-none" style={{ background: '#F7F5F2', color: '#888780' }} onClick={() => setStep(2)}>
            나중에 하기
          </button>
        </div>
      </div>
    );
  }

  // Step 2: 동 선택
  if (step === 2) {
    return (
      <div className="min-h-screen" style={{ background: '#F5F0EB' }}>
        <Header title="어느 동네에서 찾으세요?" sub="기준이 될 동네를 골라주세요" />
        <div className="px-6 py-8">
          <Bar n={2} />
          <label className="block text-[18px] font-bold text-[#1A1A18] mb-2">시</label>
          <div className="grid grid-cols-3 gap-3 mb-6">
            {Object.keys(REGIONS).map((city) => (
              <button key={city} onClick={() => setSel({ city, gu: '', dong: '' })} className="py-3 rounded-2xl text-[17px] font-medium border-2" style={selBtn(sel.city === city)}>
                {city}
              </button>
            ))}
          </div>
          {sel.city && (
            <>
              <label className="block text-[18px] font-bold text-[#1A1A18] mb-2">구</label>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {Object.keys(REGIONS[sel.city]).map((gu) => (
                  <button key={gu} onClick={() => setSel((s) => ({ ...s, gu, dong: '' }))} className="py-3 rounded-2xl text-[17px] font-medium border-2" style={selBtn(sel.gu === gu)}>
                    {gu}
                  </button>
                ))}
              </div>
            </>
          )}
          {sel.gu && (
            <>
              <label className="block text-[18px] font-bold text-[#1A1A18] mb-2">동</label>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {REGIONS[sel.city][sel.gu].map((dong) => (
                  <button key={dong} onClick={() => setSel((s) => ({ ...s, dong }))} className="py-3 rounded-2xl text-[17px] font-medium border-2" style={selBtn(sel.dong === dong)}>
                    {dong}
                  </button>
                ))}
              </div>
            </>
          )}
          <button className="w-full py-5 rounded-2xl text-[18px] font-bold text-white border-none" style={{ background: region ? '#E85C1E' : '#CCC' }} disabled={!region} onClick={() => setStep(3)}>
            다음으로
          </button>
        </div>
      </div>
    );
  }

  // Step 3: 직종
  if (step === 3) {
    return (
      <div className="min-h-screen" style={{ background: '#F5F0EB' }}>
        <Header title="어떤 일을 찾으세요?" sub="원하는 직종을 골라주세요" />
        <div className="px-6 py-8">
          <Bar n={3} />
          <label className="block text-[18px] font-bold text-[#1A1A18] mb-3">희망 직종 (복수 선택 가능)</label>
          <div className="space-y-3 mb-8">
            {JOB_TYPES.map((type) => (
              <button key={type} onClick={() => toggleJob(type)} className="w-full py-5 rounded-2xl text-[19px] font-bold border-2" style={selBtn(jobTypes.includes(type))}>
                {type}
              </button>
            ))}
          </div>
          <button className="w-full py-5 rounded-2xl text-[18px] font-bold text-white border-none" style={{ background: jobTypes.length ? '#E85C1E' : '#CCC' }} disabled={!jobTypes.length || loading} onClick={handleSubmit}>
            {loading ? '등록 중...' : '완료'}
          </button>
          <button className="w-full py-4 mt-3 rounded-2xl text-[16px] font-medium border-none" style={{ background: '#F7F5F2', color: '#888780' }} onClick={() => setStep(2)}>
            이전으로
          </button>
        </div>
      </div>
    );
  }

  // Step 4: 완료 + 소개
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: '#F5F0EB' }}>
      <div className="text-center w-full">
        <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: '#FFF5F0' }}>
          <CheckCircle size={48} style={{ color: '#E85C1E' }} />
        </div>
        <h1 className="text-[28px] font-bold text-[#1A1A18] mb-3">준비됐어요!</h1>
        <p className="text-[18px] mb-8" style={{ color: '#888780' }}>
          {profile.name}님께 맞는<br />일자리를 찾아드릴게요
        </p>
        <button className="w-full py-5 rounded-2xl text-[18px] font-bold text-white border-none" style={{ background: '#E85C1E' }} onClick={() => navigate('/')}>
          일자리 보러가기
        </button>
        <button className="w-full py-4 mt-3 rounded-2xl text-[17px] font-bold border-2" style={{ borderColor: '#E85C1E', color: '#E85C1E', background: '#FFF8F5' }} onClick={shareInvite}>
          주변에 소개하기
        </button>
      </div>
    </div>
  );
}

export default RegisterPage;
