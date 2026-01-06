import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Briefcase, MapPin, Phone, Send, Filter } from 'lucide-react';
import { Button, Card, Loading } from '../../components/common';
import { supabase } from '../../lib/supabase';

function AdminMatchPage() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [matchedWorkers, setMatchedWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('jobs'); // jobs, workers

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // 공고 로드
      const { data: jobsData } = await supabase
        .from('jobs')
        .select(`
          *,
          employers (company_name)
        `)
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      // 구직자 로드
      const { data: workersData } = await supabase
        .from('workers')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      setJobs(jobsData || []);
      setWorkers(workersData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const findMatchingWorkers = (job) => {
    setSelectedJob(job);

    // 간단한 매칭 로직: 직종이 일치하는 구직자 찾기
    const matched = workers.filter((worker) => {
      if (!worker.job_types) return false;
      return worker.job_types.includes(job.job_type);
    });

    setMatchedWorkers(matched);
  };

  const recommendWorker = async (workerId) => {
    if (!selectedJob) return;

    try {
      // 지원 내역 생성 (운영자가 추천)
      const { error } = await supabase.from('applications').insert([
        {
          job_id: selectedJob.id,
          worker_id: workerId,
          status: 'recommended',
        },
      ]);

      if (error) {
        if (error.code === '23505') {
          alert('이미 추천/지원된 구직자입니다.');
        } else {
          throw error;
        }
        return;
      }

      alert('추천이 완료되었습니다!\n카카오 알림 발송 페이지에서 알림을 보내세요.');

      // 추천된 구직자 목록에서 제외
      setMatchedWorkers((prev) => prev.filter((w) => w.id !== workerId));
    } catch (error) {
      alert('추천 중 오류가 발생했습니다.');
    }
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
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')} className="text-gray-600">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold">매칭 관리</h1>
        </div>
      </div>

      {/* 탭 */}
      <div className="bg-white px-4 py-2 border-b border-gray-200 flex gap-2">
        <button
          onClick={() => setTab('jobs')}
          className={`flex-1 py-3 rounded-xl font-bold text-lg ${
            tab === 'jobs' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
          }`}
        >
          <Briefcase size={20} className="inline mr-2" />
          공고 ({jobs.length})
        </button>
        <button
          onClick={() => setTab('workers')}
          className={`flex-1 py-3 rounded-xl font-bold text-lg ${
            tab === 'workers' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
          }`}
        >
          <Users size={20} className="inline mr-2" />
          구직자 ({workers.length})
        </button>
      </div>

      {/* 공고 탭 */}
      {tab === 'jobs' && (
        <div className="px-4 py-4">
          <p className="text-gray-600 mb-4">공고를 선택하면 매칭되는 구직자를 찾아드립니다</p>

          <div className="space-y-3">
            {jobs.map((job) => (
              <Card key={job.id}>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                      {job.job_type}
                    </span>
                    <h3 className="text-lg font-bold mt-2">{job.title}</h3>
                    <p className="text-gray-500">{job.employers?.company_name}</p>
                    <p className="text-gray-500 text-sm mt-1">
                      <MapPin size={14} className="inline" /> {job.address}
                    </p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="small"
                  className="mt-3"
                  onClick={() => findMatchingWorkers(job)}
                >
                  <Filter size={18} />
                  매칭 구직자 찾기
                </Button>

                {/* 매칭 결과 */}
                {selectedJob?.id === job.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="font-bold text-gray-900 mb-3">
                      매칭 구직자 ({matchedWorkers.length}명)
                    </h4>

                    {matchedWorkers.length === 0 ? (
                      <p className="text-gray-500 py-2">매칭되는 구직자가 없습니다</p>
                    ) : (
                      <div className="space-y-2">
                        {matchedWorkers.slice(0, 5).map((worker) => (
                          <div
                            key={worker.id}
                            className="bg-gray-50 rounded-xl p-3 flex justify-between items-center"
                          >
                            <div>
                              <p className="font-bold">{worker.name}</p>
                              <p className="text-sm text-gray-500">{worker.address}</p>
                              <p className="text-sm text-gray-500">{worker.phone}</p>
                            </div>
                            <Button
                              size="small"
                              fullWidth={false}
                              onClick={() => recommendWorker(worker.id)}
                            >
                              <Send size={16} />
                              추천
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 구직자 탭 */}
      {tab === 'workers' && (
        <div className="px-4 py-4">
          <p className="text-gray-600 mb-4">등록된 구직자 목록</p>

          <div className="space-y-3">
            {workers.map((worker) => (
              <Card key={worker.id}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold">{worker.name}</h3>
                    <p className="text-gray-500">
                      {worker.birth_year ? `${new Date().getFullYear() - worker.birth_year}세` : ''}
                    </p>
                  </div>
                  <a
                    href={`tel:${worker.phone}`}
                    className="p-2 bg-blue-100 rounded-full text-blue-600"
                  >
                    <Phone size={20} />
                  </a>
                </div>

                <div className="mt-3 text-sm text-gray-600">
                  <p><MapPin size={14} className="inline" /> {worker.address || '주소 미등록'}</p>
                  <p className="mt-1">
                    희망직종: {worker.job_types?.join(', ') || '미등록'}
                  </p>
                  <p>
                    가능시간: {worker.available_times?.join(', ') || '미등록'}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminMatchPage;
