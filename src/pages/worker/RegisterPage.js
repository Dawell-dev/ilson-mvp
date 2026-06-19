import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { JOB_TYPES } from '../../constants/jobTypes';

function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    birthYear: '',
    jobTypes: [],
    availableTimes: [],
    kakaoId: '',
    avatarUrl: '',
  });

  const timeOptions = ['오전 (6-12시)', '오후 (12-18시)', '야간 (18-06시)', '격일근무'];

  // 카카오 로그인 정보 자동 입력
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/');
        return;
      }
      const meta = session.user.user_metadata;
      setFormData(prev => ({
        ...prev,
        name: meta?.name || meta?.full_name || '',
        kakaoId: meta?.provider_id || '',
        avatarUrl: meta?.avatar_url || '',
      }));
    });
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const toggleJobType = (type) => {
    setFormData((prev) => ({
      ...prev,
      jobTypes: prev.jobTypes.includes(type)
        ? prev.jobTypes.filter((t) => t !== type)
        : [...prev.jobTypes, type],
    }));
  };

  const toggleTime = (time) => {
    setFormData((prev) => ({
      ...prev,
      availableTimes: prev.availableTimes.includes(time)
        ? prev.availableTimes.filter((t) => t !== time)
        : [...prev.availableTimes, time],
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.from('workers').insert([{
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        birth_year: parseInt(formData.birthYear) || null,
        job_types: formData.jobTypes,
        available_times: formData.availableTimes,
        kakao_id: formData.kakaoId,
      }]);

      if (error) throw error;
      setStep(4);
    } catch (error) {
      alert('등록 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = "w-full px-5 py-4 rounded-2xl text-[18px] font-medium outline-none border-2 border-[#EDE8E2] bg-white text-[#1A1A18] focus:border-[#E85C1E]";
  const labelStyle = "block text-[18px] font-bold text-[#1A1A18] mb-2";

  // Step 1: 기본 정보
  if (step === 1) {
    return (
      <div className="min-h-screen" style={{ background: '#F5F0EB' }}>
        <div className="px-6 py-8" style={{ background: '#E85C1E' }}>
          <h1 className="text-[28px] font-bold text-white">회원가입</h1>
          <p className="text-[16px] text-white/80 mt-1">1분이면 끝나요!</p>
        </div>

        <div className="px-6 py-8">
          {/* 진행바 */}
          <div className="flex gap-2 mb-8">
            <div className="h-2 flex-1 rounded-full" style={{ background: '#E85C1E' }} />
            <div className="h-2 flex-1 rounded-full" style={{ background: '#EDE8E2' }} />
            <div className="h-2 flex-1 rounded-full" style={{ background: '#EDE8E2' }} />
          </div>

          {/* 카카오 프로필 */}
          {formData.avatarUrl && (
            <div className="flex items-center gap-3 mb-6 p-4 rounded-2xl" style={{ background: '#FFF5F0', border: '1px solid #FDDCCC' }}>
              <img src={formData.avatarUrl} alt="프로필" className="w-12 h-12 rounded-full" />
              <div>
                <div className="text-[16px] font-bold text-[#1A1A18]">{formData.name}님</div>
                <div className="text-[13px]" style={{ color: '#E85C1E' }}>카카오 계정으로 자동 입력됨</div>
              </div>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className={labelStyle}>이름</label>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="홍길동"
                className={inputStyle}
              />
            </div>

            <div>
              <label className={labelStyle}>전화번호</label>
              <input
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="010-1234-5678"
                className={inputStyle}
              />
            </div>

            <div>
              <label className={labelStyle}>출생연도</label>
              <input
                name="birthYear"
                type="number"
                value={formData.birthYear}
                onChange={handleChange}
                placeholder="1960"
                className={inputStyle}
              />
              <p className="text-[14px] mt-1" style={{ color: '#888780' }}>만 나이 계산에 사용됩니다</p>
            </div>
          </div>

          <button
            className="w-full py-5 mt-8 rounded-2xl text-[18px] font-bold text-white border-none"
            style={{ background: formData.name && formData.phone ? '#E85C1E' : '#CCC' }}
            onClick={() => setStep(2)}
            disabled={!formData.name || !formData.phone}
          >
            다음으로
          </button>
        </div>
      </div>
    );
  }

  // Step 2: 주소
  if (step === 2) {
    return (
      <div className="min-h-screen" style={{ background: '#F5F0EB' }}>
        <div className="px-6 py-8" style={{ background: '#E85C1E' }}>
          <h1 className="text-[28px] font-bold text-white">주소 입력</h1>
          <p className="text-[16px] text-white/80 mt-1">가까운 일자리를 찾아드려요</p>
        </div>

        <div className="px-6 py-8">
          <div className="flex gap-2 mb-8">
            <div className="h-2 flex-1 rounded-full" style={{ background: '#E85C1E' }} />
            <div className="h-2 flex-1 rounded-full" style={{ background: '#E85C1E' }} />
            <div className="h-2 flex-1 rounded-full" style={{ background: '#EDE8E2' }} />
          </div>

          <div className="p-4 rounded-2xl mb-6" style={{ background: '#FFF5F0', border: '1px solid #FDDCCC' }}>
            <p className="text-[16px]" style={{ color: '#993C1D' }}>
              📍 정확한 주소를 입력하시면<br />
              <strong>집에서 가까운 일자리</strong>를 먼저 보여드려요!
            </p>
          </div>

          <div>
            <label className={labelStyle}>주소</label>
            <input
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="서울시 강남구 역삼동"
              className={inputStyle}
            />
            <p className="text-[14px] mt-1" style={{ color: '#888780' }}>동네 이름까지만 입력해도 됩니다</p>
          </div>

          <div className="mt-8 space-y-3">
            <button
              className="w-full py-5 rounded-2xl text-[18px] font-bold text-white border-none"
              style={{ background: formData.address ? '#E85C1E' : '#CCC' }}
              onClick={() => setStep(3)}
              disabled={!formData.address}
            >
              다음으로
            </button>
            <button
              className="w-full py-4 rounded-2xl text-[16px] font-medium border-none"
              style={{ background: '#F7F5F2', color: '#888780' }}
              onClick={() => setStep(1)}
            >
              이전으로
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: 희망 직종
  if (step === 3) {
    return (
      <div className="min-h-screen" style={{ background: '#F5F0EB' }}>
        <div className="px-6 py-8" style={{ background: '#E85C1E' }}>
          <h1 className="text-[28px] font-bold text-white">희망 조건</h1>
          <p className="text-[16px] text-white/80 mt-1">원하는 일자리를 알려주세요</p>
        </div>

        <div className="px-6 py-8">
          <div className="flex gap-2 mb-8">
            <div className="h-2 flex-1 rounded-full" style={{ background: '#E85C1E' }} />
            <div className="h-2 flex-1 rounded-full" style={{ background: '#E85C1E' }} />
            <div className="h-2 flex-1 rounded-full" style={{ background: '#E85C1E' }} />
          </div>

          <div className="mb-8">
            <label className={labelStyle}>희망 직종 (복수 선택 가능)</label>
            <div className="grid grid-cols-2 gap-3">
              {JOB_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => toggleJobType(type)}
                  className="py-4 px-4 rounded-2xl text-[18px] font-medium border-2"
                  style={formData.jobTypes.includes(type)
                    ? { background: '#E85C1E', color: '#fff', borderColor: '#E85C1E' }
                    : { background: '#fff', color: '#1A1A18', borderColor: '#EDE8E2' }
                  }
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-8">
            <label className={labelStyle}>가능한 시간대 (복수 선택 가능)</label>
            <div className="grid grid-cols-1 gap-3">
              {timeOptions.map((time) => (
                <button
                  key={time}
                  onClick={() => toggleTime(time)}
                  className="py-4 px-4 rounded-2xl text-[18px] font-medium border-2"
                  style={formData.availableTimes.includes(time)
                    ? { background: '#E85C1E', color: '#fff', borderColor: '#E85C1E' }
                    : { background: '#fff', color: '#1A1A18', borderColor: '#EDE8E2' }
                  }
                >
                  {time}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 space-y-3">
            <button
              className="w-full py-5 rounded-2xl text-[18px] font-bold text-white border-none"
              style={{ background: '#E85C1E' }}
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? '등록 중...' : '가입 완료하기'}
            </button>
            <button
              className="w-full py-4 rounded-2xl text-[16px] font-medium border-none"
              style={{ background: '#F7F5F2', color: '#888780' }}
              onClick={() => setStep(2)}
            >
              이전으로
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 4: 완료
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: '#F5F0EB' }}>
      <div className="text-center">
        <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: '#FFF5F0' }}>
          <CheckCircle size={48} style={{ color: '#E85C1E' }} />
        </div>
        <h1 className="text-[28px] font-bold text-[#1A1A18] mb-4">
          가입 완료!
        </h1>
        <p className="text-[18px] mb-8" style={{ color: '#888780' }}>
          {formData.name}님, 환영합니다!<br />
          가까운 일자리를 찾아볼까요?
        </p>
        <button
          className="w-full py-5 rounded-2xl text-[18px] font-bold text-white border-none"
          style={{ background: '#E85C1E' }}
          onClick={() => navigate('/')}
        >
          일자리 보러가기
        </button>
      </div>
    </div>
  );
}

export default RegisterPage;
