import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, MapPin, Briefcase, Clock, ChevronRight, LogOut } from 'lucide-react';
import { BottomNav, Card, Button } from '../../components/common';
import { supabase } from '../../lib/supabase';

function MyPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [worker, setWorker] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      // Supabase 세션에서 카카오 사용자 정보 가져오기
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setLoading(false);
        return;
      }

      const authUser = session.user;
      setUser({
        name: authUser.user_metadata?.name || authUser.user_metadata?.full_name || '사용자',
        email: authUser.email,
        avatar_url: authUser.user_metadata?.avatar_url,
        kakao_id: authUser.user_metadata?.provider_id,
      });

      // workers 테이블에서 추가 프로필 조회
      const { data: workerData } = await supabase
        .from('workers')
        .select('*')
        .eq('kakao_id', authUser.user_metadata?.provider_id)
        .single();

      if (workerData) {
        setWorker(workerData);

        // 지원 내역 조회
        const { data: apps } = await supabase
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
          .eq('worker_id', workerData.id)
          .order('applied_at', { ascending: false });

        setApplications(apps || []);
      }
    } catch (error) {
      console.error('데이터 로딩 오류:', error);
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

  const handleLogout = async () => {
    if (window.confirm('로그아웃 하시겠습니까?')) {
      await supabase.auth.signOut();
      navigate('/');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F7F5F2' }}>
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-[3px] rounded-full animate-spin mb-3" style={{ borderColor: 'rgba(232,92,30,0.15)', borderTopColor: '#E85C1E' }} />
          <span className="text-[calc(14px*var(--font-scale,1))] font-medium" style={{ color: '#888780' }}>불러오는 중...</span>
        </div>
      </div>
    );
  }

  // 비로그인 상태
  if (!user) {
    return (
      <div className="min-h-screen pb-24" style={{ background: '#F7F5F2' }}>
        <div className="px-6 py-5" style={{ background: '#FAFAF8', borderBottom: '1px solid #EDE8E2' }}>
          <h1 className="text-[calc(22px*var(--font-scale,1))] font-extrabold" style={{ color: '#1A1A18' }}>내 정보</h1>
        </div>

        <div className="px-6 py-16 text-center">
          <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: '#FFF5F0' }}>
            <span className="text-[calc(44px*var(--font-scale,1))]">👋</span>
          </div>
          <h2 className="text-[calc(22px*var(--font-scale,1))] font-extrabold mb-3" style={{ color: '#1A1A18' }}>
            로그인이 필요해요
          </h2>
          <p className="text-[calc(16px*var(--font-scale,1))] mb-8 leading-relaxed" style={{ color: '#888780' }}>
            카카오로 간편하게 로그인하고<br />
            가까운 일자리를 찾아보세요!
          </p>
          <Button onClick={() => navigate('/')}>
            로그인하러 가기
          </Button>
        </div>

        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: '#F7F5F2' }}>
      {/* 헤더 - 카카오 프로필 */}
      <div className="px-6 py-8 text-white" style={{ background: 'linear-gradient(135deg, #E85C1E 0%, #D14E15 100%)' }}>
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-[calc(26px*var(--font-scale,1))] font-extrabold">내 정보</h1>
          <button onClick={handleLogout} className="p-2 rounded-full active:scale-90 transition-transform" style={{ background: 'rgba(255,255,255,0.15)' }}>
            <LogOut size={22} />
          </button>
        </div>

        <div className="flex items-center gap-4">
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt="프로필"
              className="w-16 h-16 rounded-full object-cover"
              style={{ border: '3px solid rgba(255,255,255,0.5)' }}
            />
          ) : (
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.2)' }}>
              <User size={32} className="text-white" />
            </div>
          )}
          <div>
            <h2 className="text-[calc(22px*var(--font-scale,1))] font-extrabold">{user.name}님</h2>
            <p className="text-[calc(14px*var(--font-scale,1))]" style={{ color: 'rgba(255,255,255,0.7)' }}>{user.email}</p>
          </div>
        </div>
      </div>

      {/* 프로필 정보 */}
      <div className="px-4 py-4">
        <Card>
          <h3 className="text-[calc(18px*var(--font-scale,1))] font-extrabold mb-4" style={{ color: '#1A1A18' }}>내 프로필</h3>

          {worker ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#F7F5F2' }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: '#FFF5F0' }}>
                  <MapPin style={{ color: '#E85C1E' }} size={20} />
                </div>
                <span className="text-[calc(16px*var(--font-scale,1))] font-medium" style={{ color: '#1A1A18' }}>{worker.address || '주소 미등록'}</span>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#F7F5F2' }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: '#FFF5F0' }}>
                  <Briefcase style={{ color: '#E85C1E' }} size={20} />
                </div>
                <span className="text-[calc(16px*var(--font-scale,1))] font-medium" style={{ color: '#1A1A18' }}>
                  {worker.job_types?.length > 0
                    ? worker.job_types.join(', ')
                    : '희망직종 미등록'}
                </span>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#F7F5F2' }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: '#FFF5F0' }}>
                  <Clock style={{ color: '#E85C1E' }} size={20} />
                </div>
                <span className="text-[calc(16px*var(--font-scale,1))] font-medium" style={{ color: '#1A1A18' }}>
                  {worker.available_times?.length > 0
                    ? worker.available_times.join(', ')
                    : '가능시간 미등록'}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#FFF5F0' }}>
                <span className="text-[calc(28px*var(--font-scale,1))]">👤</span>
              </div>
              <p className="text-[calc(16px*var(--font-scale,1))] font-medium mb-4" style={{ color: '#888780' }}>아직 구직 프로필이 없어요</p>
              <Button
                variant="outline"
                size="medium"
                onClick={() => navigate('/register')}
              >
                프로필 등록하기
              </Button>
            </div>
          )}
        </Card>
      </div>

      {/* 지원 내역 */}
      <div className="px-4 py-2">
        <h3 className="text-[calc(18px*var(--font-scale,1))] font-extrabold mb-4 px-1" style={{ color: '#1A1A18' }}>지원 내역</h3>

        {applications.length === 0 ? (
          <Card>
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#F0F4FF' }}>
                <span className="text-[calc(28px*var(--font-scale,1))]">📋</span>
              </div>
              <p className="text-[calc(16px*var(--font-scale,1))] font-medium mb-4" style={{ color: '#888780' }}>아직 지원한 일자리가 없어요</p>
              <Button
                variant="outline"
                size="medium"
                className="mt-2"
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
                    <span className={`inline-block text-[calc(13px*var(--font-scale,1))] font-bold px-3 py-1 rounded-full mb-2 ${getStatusColor(app.status)}`}>
                      {getStatusText(app.status)}
                    </span>
                    <h4 className="text-[calc(17px*var(--font-scale,1))] font-bold" style={{ color: '#1A1A18' }}>
                      {app.jobs?.title}
                    </h4>
                    <p className="text-[calc(14px*var(--font-scale,1))] mt-1" style={{ color: '#888780' }}>
                      {app.jobs?.employers?.company_name}
                    </p>
                    <p className="text-[calc(13px*var(--font-scale,1))] mt-2" style={{ color: '#B4B2A9' }}>
                      {new Date(app.applied_at).toLocaleDateString('ko-KR')} 지원
                    </p>
                  </div>
                  <ChevronRight style={{ color: '#B4B2A9' }} size={20} />
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
