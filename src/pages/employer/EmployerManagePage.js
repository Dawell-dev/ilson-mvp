import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Users,
  CheckCircle,
  XCircle,
  Phone,
  MapPin,
  Clock,
  LogOut,
  Briefcase,
  UserPlus,
  PhoneCall,
  FileText,
  MoreVertical,
  Trash2,
  Eye,
  EyeOff,
  RefreshCw,
} from 'lucide-react';
import { Button, Card, Loading } from '../../components/common';
import { supabase } from '../../lib/supabase';

// 통계 카드 헬퍼
function StatCard({ icon: Icon, iconBg, iconColor, label, value, unit }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
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

// 상태 배지 — open/draft/closed별 색상
function StatusBadge({ status }) {
  const map = {
    open: { label: '게시중', bg: '#E8F5E9', color: '#2E7D32' },
    draft: { label: '비공개', bg: '#F0EBE5', color: '#888780' },
    closed: { label: '마감', bg: '#FEE8E8', color: '#C62828' },
  };
  const s = map[status] || map.open;
  return (
    <span
      className="inline-block text-[12px] font-medium py-0.5 px-2 rounded-full"
      style={{ background: s.bg, color: s.color }}
    >
      {s.label}
    </span>
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
  const [openMenuJobId, setOpenMenuJobId] = useState(null);
  const [toast, setToast] = useState('');

  // 외부 클릭 시 메뉴 닫기 (데스크톱 드롭다운용)
  useEffect(() => {
    if (!openMenuJobId) return;
    const handleClickOutside = (e) => {
      if (!e.target.closest('[data-menu-root]')) {
        setOpenMenuJobId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenuJobId]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 1500);
  };

  useEffect(() => {
    // Phase 1: localStorage 캐시에서 즉시 표시
    let cachedEmp = null;
    const cached = localStorage.getItem('employer');
    if (cached) {
      try {
        cachedEmp = JSON.parse(cached);
        setEmployer(cachedEmp);
        setLoading(false);
      } catch {
        localStorage.removeItem('employer');
      }
    }

    // Phase 2: 백그라운드 인증 검증 + 데이터 fetch
    const verifyAndLoad = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        if (!cachedEmp) {
          navigate('/employer/login');
          return;
        }
        try {
          const { data, error } = await supabase
            .from('jobs')
            .select('*')
            .eq('employer_id', cachedEmp.id)
            .order('created_at', { ascending: false });
          if (error) throw error;
          setJobs(data || []);
        } catch (error) {
          console.error('Error loading jobs:', error);
        } finally {
          setLoading(false);
        }
        return;
      }

      const { data: emp } = await supabase
        .from('employers')
        .select('*')
        .eq('auth_user_id', session.user.id)
        .maybeSingle();

      if (!emp) {
        await supabase.auth.signOut();
        localStorage.removeItem('employer');
        navigate('/employer/signup');
        return;
      }

      if (cachedEmp && cachedEmp.id !== emp.id) {
        console.warn('localStorage employer mismatch — 강제 로그아웃');
        await supabase.auth.signOut();
        localStorage.removeItem('employer');
        navigate('/employer/login');
        return;
      }

      setEmployer(emp);
      localStorage.setItem('employer', JSON.stringify(emp));

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

    verifyAndLoad();
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

  // 액션 핸들러: draft/closed → open
  const publishJob = async (jobId, fromDraft) => {
    setOpenMenuJobId(null);
    const message = fromDraft
      ? '이 공고를 게시할까요? 구직자에게 노출됩니다.'
      : '이 공고를 다시 게시할까요?';
    if (!window.confirm(message)) return;
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ status: 'open' })
        .eq('id', jobId);
      if (error) throw error;
      showToast(fromDraft ? '공고가 게시됐어요' : '공고가 다시 게시됐어요');
      refreshJobs();
    } catch (e) {
      alert('상태 변경 중 오류가 발생했습니다.');
    }
  };

  // 액션 핸들러: open → closed
  const closeJob = async (jobId) => {
    setOpenMenuJobId(null);
    if (!window.confirm('이 공고를 마감할까요? 새 지원자 접수가 중단됩니다.')) return;
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ status: 'closed' })
        .eq('id', jobId);
      if (error) throw error;
      showToast('공고가 마감됐어요');
      refreshJobs();
    } catch (e) {
      alert('상태 변경 중 오류가 발생했습니다.');
    }
  };

  // 액션 핸들러: 삭제 (draft, closed만)
  const deleteJob = async (jobId) => {
    setOpenMenuJobId(null);

    // applications 카운트 확인
    const { count, error: countError } = await supabase
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .eq('job_id', jobId);

    if (countError) {
      alert('지원자 정보를 확인할 수 없어요.');
      return;
    }

    if (count > 0) {
      alert(
        `이 공고에는 지원자 ${count}명의 기록이 있어 삭제할 수 없어요.\n마감 처리만 가능합니다.`
      );
      return;
    }

    if (!window.confirm('이 공고를 삭제할까요? 되돌릴 수 없습니다.')) return;

    try {
      const { error } = await supabase.from('jobs').delete().eq('id', jobId);
      if (error) throw error;
      showToast('공고가 삭제됐어요');
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
    } catch (e) {
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  // status별 메뉴 항목 빌더
  const buildMenuItems = (job) => {
    if (job.status === 'draft') {
      return [
        { label: '공고 게시하기', icon: Eye, onClick: () => publishJob(job.id, true) },
        { label: '삭제', icon: Trash2, onClick: () => deleteJob(job.id), danger: true },
      ];
    }
    if (job.status === 'open') {
      return [
        { label: '공고 마감하기', icon: EyeOff, onClick: () => closeJob(job.id) },
      ];
    }
    if (job.status === 'closed') {
      return [
        { label: '다시 게시하기', icon: RefreshCw, onClick: () => publishJob(job.id, false) },
        { label: '삭제', icon: Trash2, onClick: () => deleteJob(job.id), danger: true },
      ];
    }
    return [];
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
      <div className="min-h-screen pb-12" style={{ background: '#F7F5F2' }}>
        <div className="max-w-3xl mx-auto px-4 md:px-6">
          <div className="py-6 md:py-8">
            <div className="h-7 md:h-8 bg-gray-200 rounded-md w-2/3 mb-3 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded-md w-1/2 animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-[100px] bg-gray-200 rounded-xl animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
            <div className="h-12 bg-gray-200 rounded-xl animate-pulse" />
            <div className="h-12 bg-gray-200 rounded-xl animate-pulse" />
          </div>
          <div className="h-6 bg-gray-200 rounded-md w-1/4 mb-3 animate-pulse" />
          <div className="space-y-3">
            <div className="h-32 bg-gray-200 rounded-xl animate-pulse" />
            <div className="h-32 bg-gray-200 rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // 통계
  const openJobsCount = jobs.filter((j) => j.status === 'open').length;
  const newApplicantsCount = 0;
  const pendingContactCount = 0;

  return (
    <div className="min-h-screen pb-12" style={{ background: '#F7F5F2' }}>
      {/* 토스트 */}
      <div
        className="fixed top-20 left-1/2 -translate-x-1/2 z-[300] py-2 px-5 rounded-full text-[13px] text-white transition-opacity"
        style={{
          background: 'rgba(0,0,0,0.75)',
          opacity: toast ? 1 : 0,
          pointerEvents: 'none',
        }}
      >
        {toast}
      </div>

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
                <div
                  className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                  style={{ background: '#FFF5F0' }}
                >
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
              {jobs.map((job) => {
                const isDraft = job.status === 'draft';
                const isMenuOpen = openMenuJobId === job.id;
                const menuItems = buildMenuItems(job);

                return (
                  <Card key={job.id}>
                    <div className={`relative ${isDraft ? 'opacity-70' : ''}`}>
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1 min-w-0">
                          <StatusBadge status={job.status} />
                          <h4 className="text-lg font-bold text-gray-900 mt-2">{job.title}</h4>
                          <p className="text-gray-500">
                            {job.job_type} · {job.address}
                          </p>
                        </div>

                        {/* ⋮ 메뉴 버튼 */}
                        <div data-menu-root className="relative flex-shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuJobId(isMenuOpen ? null : job.id);
                            }}
                            className="p-1.5 rounded-full hover:bg-gray-100 active:scale-90 transition-all"
                            aria-label="메뉴"
                          >
                            <MoreVertical size={20} className="text-gray-500" />
                          </button>

                          {/* 데스크톱 드롭다운 */}
                          {isMenuOpen && (
                            <div className="hidden md:block absolute right-0 top-10 z-20 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 min-w-[170px]">
                              {menuItems.map((item, i) => {
                                const Icon = item.icon;
                                return (
                                  <button
                                    key={i}
                                    onClick={item.onClick}
                                    className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-2.5 transition-colors ${
                                      item.danger
                                        ? 'text-red-600 hover:bg-red-50'
                                        : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                                  >
                                    <Icon size={16} />
                                    {item.label}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 지원자 보기 버튼 */}
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
                      </div>

                      {/* 지원자 목록 */}
                      {selectedJob === job.id && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <h5 className="font-bold text-gray-900 mb-3">
                            지원자 목록 ({applications.length}명)
                          </h5>

                          {loadingApps ? (
                            <Loading text="불러오는 중..." />
                          ) : applications.length === 0 ? (
                            <p className="text-gray-500 py-4 text-center">
                              아직 지원자가 없습니다
                            </p>
                          ) : (
                            <div className="space-y-3">
                              {applications.map((app) => (
                                <div key={app.id} className="bg-gray-50 rounded-xl p-4">
                                  <div className="flex justify-between items-start mb-2">
                                    <div>
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="text-lg font-bold">
                                          {app.workers?.name}
                                        </span>
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
                                      <span>
                                        {app.workers?.available_times?.join(', ') || '시간 미등록'}
                                      </span>
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
                                        onClick={() =>
                                          updateApplicationStatus(app.id, 'rejected')
                                        }
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
                    </div>

                    {/* 모바일 바텀시트 메뉴 */}
                    {isMenuOpen && (
                      <div data-menu-root className="md:hidden fixed inset-0 z-[200]">
                        <div
                          onClick={() => setOpenMenuJobId(null)}
                          className="absolute inset-0"
                          style={{ background: 'rgba(0,0,0,0.5)' }}
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[24px] pb-2">
                          <div className="flex justify-center pt-3 pb-1">
                            <div className="w-10 h-1 rounded-full" style={{ background: '#DDD' }} />
                          </div>
                          <div className="px-5 pt-2 pb-3 border-b border-gray-100">
                            <p className="text-sm font-medium text-gray-700 truncate">
                              {job.title}
                            </p>
                          </div>
                          {menuItems.map((item, i) => {
                            const Icon = item.icon;
                            return (
                              <button
                                key={i}
                                onClick={item.onClick}
                                className={`w-full px-5 py-4 text-left text-base flex items-center gap-3 active:bg-gray-50 ${
                                  item.danger ? 'text-red-600' : 'text-gray-800'
                                }`}
                              >
                                <Icon size={18} />
                                {item.label}
                              </button>
                            );
                          })}
                          <button
                            onClick={() => setOpenMenuJobId(null)}
                            className="w-full px-5 py-3 text-center text-sm text-gray-500 border-t border-gray-100 mt-2"
                          >
                            취소
                          </button>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EmployerManagePage;
