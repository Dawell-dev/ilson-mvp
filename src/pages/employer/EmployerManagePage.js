import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Users, CheckCircle, XCircle, Phone, MapPin, Clock } from 'lucide-react';
import { Button, Card, Loading } from '../../components/common';
import { supabase } from '../../lib/supabase';

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
      const savedEmployer = localStorage.getItem('employer');
      if (!savedEmployer) {
        navigate('/employer/post');
        return;
      }

      const emp = JSON.parse(savedEmployer);
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

      // 목록 새로고침
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* 헤더 */}
      <div className="bg-white px-4 py-4 border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-600"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold">공고 관리</h1>
          <button
            onClick={() => navigate('/employer/post')}
            className="p-2 text-blue-600"
          >
            <Plus size={24} />
          </button>
        </div>
      </div>

      {/* 기업 정보 */}
      <div className="bg-blue-600 text-white px-6 py-4">
        <p className="text-blue-100">기업</p>
        <h2 className="text-xl font-bold">{employer?.company_name}</h2>
      </div>

      {/* 공고 목록 */}
      <div className="px-4 py-4">
        <h3 className="text-lg font-bold text-gray-900 mb-3">내 공고 ({jobs.length})</h3>

        {jobs.length === 0 ? (
          <Card>
            <div className="text-center py-8">
              <p className="text-lg text-gray-500 mb-4">등록된 공고가 없습니다</p>
              <Button onClick={() => navigate('/employer/post')}>
                공고 등록하기
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

                {/* 지원자 목록 (선택된 경우) */}
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
  );
}

export default EmployerManagePage;
