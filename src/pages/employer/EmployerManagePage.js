import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, CheckCircle, XCircle, Phone, MapPin, Clock, LogOut, Briefcase, UserPlus, PhoneCall, FileText } from 'lucide-react';
import { Button, Card, Loading } from '../../components/common';
import { supabase } from '../../lib/supabase';

// 통계 카드 헬퍼
function StatCard({ icon: Icon, iconBg, iconColor, label, value, unit }) {
  return (
    <div
      className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
    >
      <div className="flex items-center gap-3 mb-2">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: iconBg }}
        >
          <Icon size={20} style={{ color: iconColor }} />
        </div>
        <div className="text-sm text-gray-500 font-medium">{label}</div>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-bold" style={{ color: iconColor }}>
          {value}
        </span>
        <span className="text-sm font-medium text-gray-400">{unit}</span>
      </div>
    </div>
  );
}

function EmployerManagePage() {
  const navigate = useNavigate();
  const [employer, setEmployer] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingApps, setLoadingApps] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      // 1. 세션 우선 확인 (이메일/비밀번호 로그인)
      const { data: { session } } = await supabase.auth.getSession();

      let emp = null;
      if (session?.user) {
        // 세션 있음 → auth_user_id 기준 employers 조회
        const { data: row } = await supabase
          .from('employers')
          .select('*')
          .eq('auth_user_id', session.user.id)
          .maybeSingle();

        if (row) {
          emp = row;
          localStorage.setItem('employer', JSON.stringify(row));
        } else {
          // 세션은 있지만 기업 레코드 없음 → 가입 유도
          navigate('/employer/signup');
          return;
        }
      } else {
        // 세션 없음 → localStorage fallback
        const savedEmployer = localStorage.getItem('employer');
        if (!savedEmployer) {
          navigate('/employer/login');
          return;
        }
        try {
          emp = JSON.parse(savedEmployer);
        } catch {
          localStorage.removeItem('employer');
          navigate('/employer/login');
          return;
        }
      }

      setEmployer(emp);

      try {
        const { data, error } = await supabase
          .from('jobs')
          .select('*')
          .eq('employer_id', emp.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setJobs(data || []);
      } catch (error) {
        console.error('Error loading jobs:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [navigate]);

  const handleLogout = async () => {
    if (!window.confirm('로그아웃 하시겠어요?')) return;
    await supabase.auth.signOut();
    localStorage.removeItem('employer');
    navigate('/employer/login');
  };

  const refreshJobs = async () => {
    if (!employer) return;
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('employer_id', employer.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Error loading jobs:', error);
    }
  };

  const loadApplications = async (jobId) => {
    setLoadingApps(true);
    setSelectedJob(jobId);

    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          workers (
            id,
            name,
            phone,
            address,
            birth_year,
            job_types,
            available_times
          )
        `)
        .eq('job_id', jobId)
        .order('applied_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Error loading applications:', error);
    } finally {
      setLoadingApps(false);
    }
  };

  const updateApplicationStatus = async (appId, status) => {
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', appId);

      if (error) throw error;

      if (selectedJob) {
        loadApplications(selectedJob);
      }

      alert(status === 'hired' ? '채용이 확정되었습니다!' : '처리가 완료되었습니다.');
    } catch (error) {
      alert('처리 중 오류가 발생했습니다.');
    }
  };

  const toggleJobStatus = async (jobId, currentStatus) => {
    const newStatus = currentStatus === 'open' ? 'closed' : 'open';
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ status: newStatus })
        .eq('id', jobId);

      if (error) throw error;
      refreshJobs();
    } catch (error) {
      alert('상태 변경 중 오류가 발생했습니다.');
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      open: { text: '모집중', color: 'bg-green-100 text-green-700' },
      closed: { text: '마감', color: 'bg-gray-100 text-gray-500' },
      filled: { text: '채용완료', color: 'bg-blue-100 text-blue-700' },
    };
    const s = statusMap[status] || statusMap.open;
    return <span className={`px-3 py-1 rounded-full text-sm font-medium ${s.color}`}>{s.text}</span>;
  };

  const getAppStatusBadge = (status) => {
    const statusMap = {
      pending: { text: '검토대기', color: 'bg-yellow-100 text-yellow-700' },
      recommended: { text: '추천됨', color: 'bg-blue-100 text-blue-700' },
      hired: { text: '채용확정', color: 'bg-green-100 text-green-700' },
      rejected: { text: '불합격', color: 'bg-gray-100 text-gray-500' },
    };
    const s = statusMap[status] || statusMap.pending;
    return <span className={`px-3 py-1 rounded-full text-sm font-medium ${s.color}`}>{s.text}</span>;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F7F5F2' }}>
        <Loading />
      </div>
    );
  }

  // 통계 (현재는 jobs.length만 실제 값. 나머지는 0 하드코딩)
  const openJobsCount = jobs.filter((j) => j.status === 'open').length;
  const newApplicantsCount = 0; // TODO: applications 테이블 연동 시 채우기
  const pendingContactCount = 0; // TODO: 동일

  return (
    <div className="min-h-screen pb-12" style={{ background: '#F7F5F2' }}>
      <div className="max-w-3xl mx-auto px-4 md:px-6">
        {/* (A) 환영 섹션 */}
        <div className="flex items-start justify-between gap-3 py-6 md:py-8">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
              안녕하세요, {employer?.company_name} 담당자님 👋
            </h1>
            <p className="text-sm md:text-base text-gray-500 mt-2">
              오늘도 좋은 인재를 만나보세요
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 active:scale-95 transition-all flex-shrink-0"
            aria-label="로그아웃"
          >
            <LogOut size={16} />
            <span className="text-sm font-medium hidden sm:inline">로그아웃</span>
          </button>
        </div>

        {/* (B) 통계 카드 3개 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          <StatCard
            icon={Briefcase}
            iconBg="#FFF5F0"
            iconColor="#E85C1E"
            label="진행 중인 공고"
            value={openJobsCount}
            unit="건"
          />
          <StatCard
            icon={UserPlus}
            iconBg="#F0F4FF"
            iconColor="#3B82F6"
            label="신규 지원자"
            value={newApplicantsCount}
            unit="명"
          />
          <StatCard
            icon={PhoneCall}
            iconBg="#FFFBEA"
            iconColor="#F59E0B"
            label="연락 대기"
            value={pendingContactCount}
            unit="명"
          />
        </div>

        {/* (C) 빠른 작업 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
          <button
            onClick={() => navigate('/employer/post')}
            className="flex items-center justify-center gap-2 py-4 px-6 rounded-xl text-white font-bold shadow-sm active:scale-[0.98] transition-transform"
            style={{ background: '#E85C1E' }}
          >
            <Plus size={20} />
            새 공고 등록
          </button>
          <button
            onClick={() => alert('준비 중인 기능이에요.')}
            className="flex items-center justify-center gap-2 py-4 px-6 rounded-xl font-bold border border-gray-200 bg-white text-gray-700 active:scale-[0.98] transition-transform"
          >
            회사 정보 수정
          </button>
        </div>

        {/* (D) 내 공고 섹션 */}
        <div>
          <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-3">
            내 공고 <span className="text-gray-400 font-medium">({jobs.length})</span>
          </h2>

          {jobs.length === 0 ? (
            <Card>
              <div className="text-center py-12 px-4">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: '#FFF5F0' }}>
                  <FileText size={32} style={{ color: '#E85C1E' }} />
                </div>
                <p className="text-lg font-bold text-gray-700 mb-2">
                  아직 등록한 공고가 없어요
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  첫 공고를 등록하고 인재를 만나보세요
                </p>
                <Button onClick={() => navigate('/employer/post')}>
                  + 공고 등록하기
                </Button>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => (
                <Card key={job.id}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      {getStatusBadge(job.status)}
                      <h4 className="text-lg font-bold text-gray-900 mt-2">{job.title}</h4>
                      <p className="text-gray-500">{job.job_type} · {job.address}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="small"
                      fullWidth={false}
                      onClick={() => loadApplications(job.id)}
                    >
                      <Users size={18} />
                      지원자 보기
                    </Button>
                    <Button
                      variant="secondary"
                      size="small"
                      fullWidth={false}
                      onClick={() => toggleJobStatus(job.id, job.status)}
                    >
                      {job.status === 'open' ? '마감하기' : '다시 모집'}
                    </Button>
                  </div>

                  {selectedJob === job.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h5 className="font-bold text-gray-900 mb-3">
                        지원자 목록 ({applications.length}명)
                      </h5>

                      {loadingApps ? (
                        <Loading text="불러오는 중..." />
                      ) : applications.length === 0 ? (
                        <p className="text-gray-500 py-4 text-center">아직 지원자가 없습니다</p>
                      ) : (
                        <div className="space-y-3">
                          {applications.map((app) => (
                            <div
                              key={app.id}
                              className="bg-gray-50 rounded-xl p-4"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-lg font-bold">{app.workers?.name}</span>
                                    {getAppStatusBadge(app.status)}
                                  </div>
                                  {app.workers?.birth_year && (
                                    <p className="text-gray-500">
                                      {new Date().getFullYear() - app.workers.birth_year}세
                                    </p>
                                  )}
                                </div>
                                <a
                                  href={`tel:${app.workers?.phone}`}
                                  className="p-2 bg-blue-100 rounded-full text-blue-600"
                                >
                                  <Phone size={20} />
                                </a>
                              </div>

                              <div className="text-sm text-gray-600 space-y-1 mb-3">
                                <div className="flex items-center gap-2">
                                  <MapPin size={16} />
                                  <span>{app.workers?.address || '주소 미등록'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Clock size={16} />
                                  <span>{app.workers?.available_times?.join(', ') || '시간 미등록'}</span>
                                </div>
                              </div>

                              {app.status === 'pending' && (
                                <div className="flex gap-2">
                                  <Button
                                    size="small"
                                    onClick={() => updateApplicationStatus(app.id, 'hired')}
                                  >
                                    <CheckCircle size={18} />
                                    채용확정
                                  </Button>
                                  <Button
                                    variant="secondary"
                                    size="small"
                                    onClick={() => updateApplicationStatus(app.id, 'rejected')}
                                  >
                                    <XCircle size={18} />
                                    불합격
                                  </Button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EmployerManagePage;
