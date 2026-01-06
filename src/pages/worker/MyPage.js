import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, MapPin, Briefcase, Clock, ChevronRight, LogOut } from 'lucide-react';
import { BottomNav, Card, Button, Loading } from '../../components/common';
import { supabase } from '../../lib/supabase';

function MyPage() {
  const navigate = useNavigate();
  const [worker, setWorker] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkerData();
  }, []);

  const loadWorkerData = async () => {
    const workerData = localStorage.getItem('worker');
    if (!workerData) {
      setLoading(false);
      return;
    }

    const workerInfo = JSON.parse(workerData);
    setWorker(workerInfo);

    // 지원 내역 조회
    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          jobs (
            id,
            title,
            job_type,
            employers (company_name)
          )
        `)
        .eq('worker_id', workerInfo.id)
        .order('applied_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Error loading applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      pending: '검토중',
      recommended: '추천됨',
      hired: '채용확정',
      rejected: '불합격',
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status) => {
    const colorMap = {
      pending: 'bg-yellow-100 text-yellow-700',
      recommended: 'bg-blue-100 text-blue-700',
      hired: 'bg-green-100 text-green-700',
      rejected: 'bg-gray-100 text-gray-500',
    };
    return colorMap[status] || 'bg-gray-100 text-gray-500';
  };

  const handleLogout = () => {
    if (window.confirm('로그아웃 하시겠습니까?')) {
      localStorage.removeItem('worker');
      navigate('/');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  // 비로그인 상태
  if (!worker) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="bg-white px-6 py-6 border-b border-gray-200">
          <h1 className="text-3xl font-bold text-gray-900">내 정보</h1>
        </div>

        <div className="px-6 py-12 text-center">
          <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <User size={48} className="text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            아직 회원이 아니시네요
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            1분만에 가입하고<br />
            가까운 일자리를 찾아보세요!
          </p>
          <Button onClick={() => navigate('/register')}>
            회원가입하기
          </Button>
        </div>

        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* 헤더 */}
      <div className="bg-blue-600 px-6 py-8 text-white">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold">내 정보</h1>
          <button onClick={handleLogout} className="p-2">
            <LogOut size={24} />
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
            <User size={32} className="text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">{worker.name}님</h2>
            <p className="text-blue-100">{worker.phone}</p>
          </div>
        </div>
      </div>

      {/* 프로필 정보 */}
      <div className="px-4 py-4">
        <Card>
          <h3 className="text-xl font-bold text-gray-900 mb-4">내 프로필</h3>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <MapPin className="text-gray-400" size={22} />
              <span className="text-lg text-gray-700">{worker.address || '주소 미등록'}</span>
            </div>

            <div className="flex items-center gap-3">
              <Briefcase className="text-gray-400" size={22} />
              <span className="text-lg text-gray-700">
                {worker.job_types?.length > 0
                  ? worker.job_types.join(', ')
                  : '희망직종 미등록'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Clock className="text-gray-400" size={22} />
              <span className="text-lg text-gray-700">
                {worker.available_times?.length > 0
                  ? worker.available_times.join(', ')
                  : '가능시간 미등록'}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* 지원 내역 */}
      <div className="px-4 py-2">
        <h3 className="text-xl font-bold text-gray-900 mb-4 px-1">지원 내역</h3>

        {applications.length === 0 ? (
          <Card>
            <div className="text-center py-6">
              <Briefcase className="text-gray-300 mx-auto mb-3" size={48} />
              <p className="text-lg text-gray-500">아직 지원한 일자리가 없어요</p>
              <Button
                variant="outline"
                size="medium"
                className="mt-4"
                onClick={() => navigate('/jobs')}
              >
                일자리 보러가기
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {applications.map((app) => (
              <Card
                key={app.id}
                hoverable
                onClick={() => navigate(`/jobs/${app.jobs?.id}`)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className={`inline-block text-base font-medium px-3 py-1 rounded-full mb-2 ${getStatusColor(app.status)}`}>
                      {getStatusText(app.status)}
                    </span>
                    <h4 className="text-lg font-bold text-gray-900">
                      {app.jobs?.title}
                    </h4>
                    <p className="text-base text-gray-500 mt-1">
                      {app.jobs?.employers?.company_name}
                    </p>
                    <p className="text-sm text-gray-400 mt-2">
                      {new Date(app.applied_at).toLocaleDateString('ko-KR')} 지원
                    </p>
                  </div>
                  <ChevronRight className="text-gray-400" size={22} />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

export default MyPage;
