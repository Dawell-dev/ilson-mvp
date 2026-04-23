import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { Button, Input } from '../../components/common';
import { supabase } from '../../lib/supabase';

function EmployerPostPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(2); // 공고 등록 전용. 2=폼, 3=완료
  const [loading, setLoading] = useState(false);
  const [employer, setEmployer] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    jobType: '',
    address: '',
    hourlyWage: '',
    workHours: '',
    workDays: '',
    description: '',
    headcount: '1',
  });

  const jobTypes = ['경비', '청소', '주차관리', '시설관리', '미화'];
  const workDaysOptions = ['월-금', '월-토', '격일근무', '주말근무', '협의'];

  useEffect(() => {
    const savedEmployer = localStorage.getItem('employer');
    if (!savedEmployer) {
      alert('로그인이 필요해요.');
      navigate('/employer/login');
      return;
    }
    try {
      setEmployer(JSON.parse(savedEmployer));
    } catch {
      localStorage.removeItem('employer');
      navigate('/employer/login');
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmitJob = async () => {
    if (!employer?.id) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('jobs').insert([
        {
          employer_id: employer.id,
          title: formData.title,
          job_type: formData.jobType,
          address: formData.address,
          hourly_wage: parseInt(formData.hourlyWage) || null,
          work_hours: formData.workHours,
          work_days: formData.workDays,
          description: formData.description,
          headcount: parseInt(formData.headcount) || 1,
          status: 'open',
        },
      ]);
      if (error) throw error;
      setStep(3);
    } catch (error) {
      alert('공고 등록 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!employer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">불러오는 중...</div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="min-h-screen bg-gray-50 pb-8">
        <div className="bg-white px-4 py-4 border-b border-gray-200">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 text-lg"
          >
            <ArrowLeft size={24} />
            <span>뒤로가기</span>
          </button>
        </div>

        <div className="px-6 py-6">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="text-green-500" size={20} />
            <span className="text-green-600 font-medium">인증된 기업</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">공고 등록</h1>
          <p className="text-gray-500 mb-6">{employer.company_name}</p>

          <div className="space-y-6">
            <Input
              label="공고 제목"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="아파트 경비원 모집"
              required
            />

            <div>
              <label className="block text-lg font-medium text-gray-700 mb-2">
                직종 <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {jobTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => setFormData({ ...formData, jobType: type })}
                    className={`py-3 px-3 rounded-xl text-lg font-medium border-2 transition-all ${
                      formData.jobType === type
                        ? 'bg-orange-500 text-white border-orange-500'
                        : 'bg-white text-gray-700 border-gray-300'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <Input
              label="근무지 주소"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="서울시 강남구 삼성동 123"
              required
            />

            <Input
              label="시급 (원)"
              name="hourlyWage"
              type="number"
              value={formData.hourlyWage}
              onChange={handleChange}
              placeholder="10500"
            />

            <Input
              label="근무시간"
              name="workHours"
              value={formData.workHours}
              onChange={handleChange}
              placeholder="09:00-18:00"
            />

            <div>
              <label className="block text-lg font-medium text-gray-700 mb-2">근무요일</label>
              <div className="grid grid-cols-3 gap-2">
                {workDaysOptions.map((days) => (
                  <button
                    key={days}
                    onClick={() => setFormData({ ...formData, workDays: days })}
                    className={`py-3 px-2 rounded-xl text-base font-medium border-2 transition-all ${
                      formData.workDays === days
                        ? 'bg-orange-500 text-white border-orange-500'
                        : 'bg-white text-gray-700 border-gray-300'
                    }`}
                  >
                    {days}
                  </button>
                ))}
              </div>
            </div>

            <Input
              label="모집인원"
              name="headcount"
              type="number"
              value={formData.headcount}
              onChange={handleChange}
              placeholder="1"
            />

            <div>
              <label className="block text-lg font-medium text-gray-700 mb-2">상세 내용</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="업무 내용, 우대사항 등을 자유롭게 작성해주세요"
                rows={5}
                className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>

          <div className="mt-8">
            <Button
              onClick={handleSubmitJob}
              disabled={loading || !formData.title || !formData.jobType || !formData.address}
            >
              {loading ? '등록 중...' : '공고 등록하기'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: 완료
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6">
      <div className="text-center">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="text-green-600" size={48} />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">공고 등록 완료!</h1>
        <p className="text-xl text-gray-600 mb-8">
          등록된 공고가 구직자들에게
          <br />
          자동으로 추천됩니다.
        </p>
        <div className="space-y-3">
          <Button onClick={() => navigate('/employer/manage')}>내 공고 관리하기</Button>
          <Button
            variant="secondary"
            onClick={() => {
              setStep(2);
              setFormData({
                title: '',
                jobType: '',
                address: '',
                hourlyWage: '',
                workHours: '',
                workDays: '',
                description: '',
                headcount: '1',
              });
            }}
          >
            공고 추가 등록하기
          </Button>
        </div>
      </div>
    </div>
  );
}

export default EmployerPostPage;
