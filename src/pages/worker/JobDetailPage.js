import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Clock, Banknote, Building2, Phone, ArrowLeft, CheckCircle, Users } from 'lucide-react';
import { Button, Loading } from '../../components/common';
import { supabase } from '../../lib/supabase';

function JobDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    const loadJob = async () => {
      try {
        const { data, error } = await supabase
          .from('jobs')
          .select(`
            *,
            employers (
              company_name,
              contact_name,
              phone
            )
          `)
          .eq('id', id)
          .single();

        if (error) throw error;
        setJob(data);
      } catch (error) {
        console.error('Error fetching job:', error);
      } finally {
        setLoading(false);
      }
    };

    const checkApplied = async () => {
      const workerData = localStorage.getItem('worker');
      if (!workerData) return;

      const worker = JSON.parse(workerData);
      try {
        const { data } = await supabase
          .from('applications')
          .select('id')
          .eq('job_id', id)
          .eq('worker_id', worker.id)
          .single();

        if (data) setApplied(true);
      } catch (error) {
        // 지원 내역 없음
      }
    };

    loadJob();
    checkApplied();
  }, [id]);

  const handleApply = async () => {
    const workerData = localStorage.getItem('worker');
    if (!workerData) {
      navigate('/register');
      return;
    }

    const worker = JSON.parse(workerData);
    setApplying(true);

    try {
      const { error } = await supabase.from('applications').insert([
        {
          job_id: id,
          worker_id: worker.id,
          status: 'pending',
        },
      ]);

      if (error) throw error;
      setApplied(true);
      alert('지원이 완료되었습니다!\n담당자가 곧 연락드릴 예정입니다.');
    } catch (error) {
      if (error.code === '23505') {
        alert('이미 지원한 공고입니다.');
        setApplied(true);
      } else {
        alert('지원 중 오류가 발생했습니다.');
      }
    } finally {
      setApplying(false);
    }
  };

  const handleCall = () => {
    if (job?.employers?.phone) {
      window.location.href = `tel:${job.employers.phone}`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading text="일자리 정보를 불러오는 중..." />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6">
        <p className="text-xl text-gray-600 mb-6">일자리를 찾을 수 없습니다</p>
        <Button onClick={() => navigate('/jobs')}>목록으로 돌아가기</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* 헤더 */}
      <div className="bg-white px-4 py-4 border-b border-gray-200 sticky top-0 z-10">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 text-lg"
        >
          <ArrowLeft size={24} />
          <span>뒤로가기</span>
        </button>
      </div>

      {/* 메인 정보 */}
      <div className="bg-white px-6 py-6 border-b border-gray-100">
        <span className="inline-block bg-blue-100 text-blue-700 text-lg font-medium px-4 py-2 rounded-full mb-4">
          {job.job_type}
        </span>

        <h1 className="text-2xl font-bold text-gray-900 mb-4">{job.title}</h1>

        <div className="flex items-center gap-2 text-gray-700 mb-2">
          <Building2 size={22} />
          <span className="text-xl">{job.employers?.company_name}</span>
        </div>
      </div>

      {/* 상세 정보 */}
      <div className="bg-white px-6 py-6 mt-2">
        <h2 className="text-xl font-bold text-gray-900 mb-4">근무 조건</h2>

        <div className="space-y-4">
          <div className="flex items-start gap-4 py-3 border-b border-gray-100">
            <Banknote className="text-green-600 mt-1" size={24} />
            <div>
              <p className="text-lg text-gray-500">급여</p>
              <p className="text-2xl font-bold text-green-600">
                시급 {job.hourly_wage?.toLocaleString()}원
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 py-3 border-b border-gray-100">
            <Clock className="text-blue-600 mt-1" size={24} />
            <div>
              <p className="text-lg text-gray-500">근무시간</p>
              <p className="text-xl font-medium text-gray-900">{job.work_hours}</p>
              <p className="text-lg text-gray-600">{job.work_days}</p>
            </div>
          </div>

          <div className="flex items-start gap-4 py-3 border-b border-gray-100">
            <MapPin className="text-red-500 mt-1" size={24} />
            <div>
              <p className="text-lg text-gray-500">근무지</p>
              <p className="text-xl font-medium text-gray-900">{job.address}</p>
            </div>
          </div>

          <div className="flex items-start gap-4 py-3">
            <Users className="text-purple-600 mt-1" size={24} />
            <div>
              <p className="text-lg text-gray-500">모집인원</p>
              <p className="text-xl font-medium text-gray-900">{job.headcount}명</p>
            </div>
          </div>
        </div>
      </div>

      {/* 상세 설명 */}
      {job.description && (
        <div className="bg-white px-6 py-6 mt-2">
          <h2 className="text-xl font-bold text-gray-900 mb-4">상세 내용</h2>
          <p className="text-lg text-gray-700 whitespace-pre-wrap leading-relaxed">
            {job.description}
          </p>
        </div>
      )}

      {/* 담당자 정보 */}
      <div className="bg-white px-6 py-6 mt-2">
        <h2 className="text-xl font-bold text-gray-900 mb-4">담당자 정보</h2>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gray-200 rounded-full flex items-center justify-center">
            <Phone size={24} className="text-gray-500" />
          </div>
          <div>
            <p className="text-xl font-medium text-gray-900">
              {job.employers?.contact_name || '담당자'}
            </p>
            <p className="text-lg text-blue-600">{job.employers?.phone}</p>
          </div>
        </div>
      </div>

      {/* 하단 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4">
        <div className="max-w-md mx-auto flex gap-3">
          <Button variant="secondary" onClick={handleCall} fullWidth={false} className="px-6">
            <Phone size={24} />
            전화
          </Button>

          {applied ? (
            <Button disabled className="flex-1">
              <CheckCircle size={24} />
              지원완료
            </Button>
          ) : (
            <Button onClick={handleApply} disabled={applying} className="flex-1">
              {applying ? '지원 중...' : '지원하기'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default JobDetailPage;
