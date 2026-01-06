import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, CheckCircle } from 'lucide-react';
import { Button, Input } from '../../components/common';
import { supabase } from '../../lib/supabase';

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
  });

  const jobTypeOptions = ['경비', '청소', '주차관리', '시설관리', '미화'];
  const timeOptions = ['오전 (6-12시)', '오후 (12-18시)', '야간 (18-06시)', '격일근무'];

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
      const { data, error } = await supabase.from('workers').insert([
        {
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
          birth_year: parseInt(formData.birthYear) || null,
          job_types: formData.jobTypes,
          available_times: formData.availableTimes,
        },
      ]).select();

      if (error) throw error;

      // 로컬 스토리지에 사용자 정보 저장
      localStorage.setItem('worker', JSON.stringify(data[0]));
      setStep(4); // 완료 화면
    } catch (error) {
      alert('등록 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 1: 기본 정보
  if (step === 1) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-blue-600 text-white px-6 py-8">
          <h1 className="text-3xl font-bold">회원가입</h1>
          <p className="text-blue-100 text-lg mt-2">1분이면 끝나요!</p>
        </div>

        <div className="px-6 py-8">
          <div className="mb-8">
            <div className="flex gap-2 mb-6">
              <div className="h-2 flex-1 bg-blue-600 rounded"></div>
              <div className="h-2 flex-1 bg-gray-200 rounded"></div>
              <div className="h-2 flex-1 bg-gray-200 rounded"></div>
            </div>
          </div>

          <div className="space-y-6">
            <Input
              label="이름"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="홍길동"
              required
            />

            <Input
              label="전화번호"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              placeholder="010-1234-5678"
              required
            />

            <Input
              label="출생연도"
              name="birthYear"
              type="number"
              value={formData.birthYear}
              onChange={handleChange}
              placeholder="1960"
              helpText="만 나이 계산에 사용됩니다"
            />
          </div>

          <div className="mt-8">
            <Button
              onClick={() => setStep(2)}
              disabled={!formData.name || !formData.phone}
            >
              다음으로
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: 주소
  if (step === 2) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-blue-600 text-white px-6 py-8">
          <h1 className="text-3xl font-bold">주소 입력</h1>
          <p className="text-blue-100 text-lg mt-2">가까운 일자리를 찾아드려요</p>
        </div>

        <div className="px-6 py-8">
          <div className="mb-8">
            <div className="flex gap-2 mb-6">
              <div className="h-2 flex-1 bg-blue-600 rounded"></div>
              <div className="h-2 flex-1 bg-blue-600 rounded"></div>
              <div className="h-2 flex-1 bg-gray-200 rounded"></div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-xl p-4 mb-6 flex items-start gap-3">
            <MapPin className="text-blue-600 mt-1" size={24} />
            <p className="text-lg text-blue-800">
              정확한 주소를 입력하시면<br />
              <strong>집에서 가까운 일자리</strong>를 먼저 보여드려요!
            </p>
          </div>

          <Input
            label="주소"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="서울시 강남구 역삼동"
            helpText="동네 이름까지만 입력해도 됩니다"
          />

          <div className="mt-8 space-y-3">
            <Button onClick={() => setStep(3)} disabled={!formData.address}>
              다음으로
            </Button>
            <Button variant="secondary" onClick={() => setStep(1)}>
              이전으로
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: 희망 직종
  if (step === 3) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-blue-600 text-white px-6 py-8">
          <h1 className="text-3xl font-bold">희망 조건</h1>
          <p className="text-blue-100 text-lg mt-2">원하는 일자리를 알려주세요</p>
        </div>

        <div className="px-6 py-8">
          <div className="mb-8">
            <div className="flex gap-2 mb-6">
              <div className="h-2 flex-1 bg-blue-600 rounded"></div>
              <div className="h-2 flex-1 bg-blue-600 rounded"></div>
              <div className="h-2 flex-1 bg-blue-600 rounded"></div>
            </div>
          </div>

          <div className="mb-8">
            <label className="block text-xl font-medium text-gray-700 mb-4">
              희망 직종 (복수 선택 가능)
            </label>
            <div className="grid grid-cols-2 gap-3">
              {jobTypeOptions.map((type) => (
                <button
                  key={type}
                  onClick={() => toggleJobType(type)}
                  className={`py-4 px-4 rounded-xl text-xl font-medium border-2 transition-all ${
                    formData.jobTypes.includes(type)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-8">
            <label className="block text-xl font-medium text-gray-700 mb-4">
              가능한 시간대 (복수 선택 가능)
            </label>
            <div className="grid grid-cols-1 gap-3">
              {timeOptions.map((time) => (
                <button
                  key={time}
                  onClick={() => toggleTime(time)}
                  className={`py-4 px-4 rounded-xl text-xl font-medium border-2 transition-all ${
                    formData.availableTimes.includes(time)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300'
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 space-y-3">
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? '등록 중...' : '가입 완료하기'}
            </Button>
            <Button variant="secondary" onClick={() => setStep(2)}>
              이전으로
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Step 4: 완료
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6">
      <div className="text-center">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="text-green-600" size={48} />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          가입 완료!
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          {formData.name}님, 환영합니다!<br />
          가까운 일자리를 찾아볼까요?
        </p>
        <Button onClick={() => navigate('/jobs')}>
          일자리 보러가기
        </Button>
      </div>
    </div>
  );
}

export default RegisterPage;
