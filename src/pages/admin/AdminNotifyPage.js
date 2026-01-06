import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { Button, Card, Loading } from '../../components/common';
import { supabase } from '../../lib/supabase';

function AdminNotifyPage() {
  const navigate = useNavigate();
  const [workers, setWorkers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [selectedWorkers, setSelectedWorkers] = useState([]);
  const [selectedJob, setSelectedJob] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [template, setTemplate] = useState('new_job');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const templates = [
    { id: 'new_job', name: '새 일자리 알림', message: '새로운 일자리가 등록되었습니다! 지금 확인해보세요.' },
    { id: 'recommend', name: '추천 알림', message: '회원님께 맞는 일자리를 추천드립니다.' },
    { id: 'hired', name: '채용 확정', message: '축하합니다! 채용이 확정되었습니다.' },
    { id: 'reminder', name: '근무 리마인더', message: '내일 근무가 예정되어 있습니다. 확인해주세요.' },
    { id: 'custom', name: '직접 작성', message: '' },
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [workersRes, jobsRes, notiRes] = await Promise.all([
        supabase.from('workers').select('*').eq('status', 'active').order('name'),
        supabase.from('jobs').select('*, employers(company_name)').eq('status', 'open'),
        supabase.from('kakao_notifications').select('*').order('sent_at', { ascending: false }).limit(20),
      ]);

      setWorkers(workersRes.data || []);
      setJobs(jobsRes.data || []);
      setNotifications(notiRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleWorker = (workerId) => {
    setSelectedWorkers((prev) =>
      prev.includes(workerId)
        ? prev.filter((id) => id !== workerId)
        : [...prev, workerId]
    );
  };

  const selectAllWorkers = () => {
    if (selectedWorkers.length === workers.length) {
      setSelectedWorkers([]);
    } else {
      setSelectedWorkers(workers.map((w) => w.id));
    }
  };

  const getMessage = () => {
    if (template === 'custom') return customMessage;
    const t = templates.find((t) => t.id === template);
    return t?.message || '';
  };

  const sendNotifications = async () => {
    if (selectedWorkers.length === 0) {
      alert('알림을 받을 구직자를 선택해주세요.');
      return;
    }

    const message = getMessage();
    if (!message) {
      alert('메시지를 입력해주세요.');
      return;
    }

    setSending(true);

    try {
      // 알림 로그 저장
      const notificationRecords = selectedWorkers.map((workerId) => {
        const worker = workers.find((w) => w.id === workerId);
        return {
          worker_id: workerId,
          job_id: selectedJob || null,
          template_code: template,
          message: message,
          phone: worker?.phone,
          status: 'pending', // 실제로는 카카오 API 호출 후 결과에 따라 변경
        };
      });

      const { error } = await supabase
        .from('kakao_notifications')
        .insert(notificationRecords);

      if (error) throw error;

      alert(`${selectedWorkers.length}명에게 알림이 예약되었습니다.\n\n※ 실제 카카오 알림톡 발송은 카카오 비즈니스 채널 연동 후 가능합니다.`);

      // 초기화
      setSelectedWorkers([]);
      setCustomMessage('');
      loadData(); // 알림 로그 새로고침
    } catch (error) {
      alert('알림 발송 중 오류가 발생했습니다.');
    } finally {
      setSending(false);
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
          <h1 className="text-xl font-bold">카카오 알림 발송</h1>
        </div>
      </div>

      {/* 안내 */}
      <div className="bg-yellow-50 px-4 py-3 border-b border-yellow-100">
        <div className="flex items-start gap-2">
          <AlertCircle className="text-yellow-600 mt-0.5" size={20} />
          <div className="text-sm text-yellow-800">
            <p className="font-medium">카카오 알림톡 연동 안내</p>
            <p>실제 알림톡 발송을 위해서는 카카오 비즈니스 채널 등록이 필요합니다.</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-6">
        {/* 템플릿 선택 */}
        <Card>
          <h3 className="text-lg font-bold mb-3">1. 알림 유형 선택</h3>
          <div className="grid grid-cols-2 gap-2">
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() => setTemplate(t.id)}
                className={`p-3 rounded-xl text-left border-2 transition-all ${
                  template === t.id
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200'
                }`}
              >
                <p className="font-medium">{t.name}</p>
              </button>
            ))}
          </div>

          {template === 'custom' && (
            <div className="mt-4">
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="메시지를 입력하세요"
                rows={3}
                className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {template !== 'custom' && (
            <div className="mt-4 bg-gray-50 rounded-xl p-3">
              <p className="text-gray-500 text-sm mb-1">미리보기</p>
              <p className="text-gray-800">{getMessage()}</p>
            </div>
          )}
        </Card>

        {/* 일자리 선택 (선택사항) */}
        <Card>
          <h3 className="text-lg font-bold mb-3">2. 관련 일자리 (선택)</h3>
          <select
            value={selectedJob}
            onChange={(e) => setSelectedJob(e.target.value)}
            className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-xl"
          >
            <option value="">선택 안함</option>
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>
                [{job.job_type}] {job.title} - {job.employers?.company_name}
              </option>
            ))}
          </select>
        </Card>

        {/* 수신자 선택 */}
        <Card>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-bold">3. 수신자 선택</h3>
            <Button
              variant="secondary"
              size="small"
              fullWidth={false}
              onClick={selectAllWorkers}
            >
              {selectedWorkers.length === workers.length ? '선택 해제' : '전체 선택'}
            </Button>
          </div>

          <p className="text-gray-500 mb-3">
            {selectedWorkers.length}명 선택됨
          </p>

          <div className="max-h-60 overflow-y-auto space-y-2">
            {workers.map((worker) => (
              <div
                key={worker.id}
                onClick={() => toggleWorker(worker.id)}
                className={`p-3 rounded-xl cursor-pointer flex items-center justify-between border-2 transition-all ${
                  selectedWorkers.includes(worker.id)
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200'
                }`}
              >
                <div>
                  <p className="font-medium">{worker.name}</p>
                  <p className="text-sm text-gray-500">{worker.phone}</p>
                </div>
                {selectedWorkers.includes(worker.id) && (
                  <CheckCircle className="text-blue-600" size={24} />
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* 발송 버튼 */}
        <Button onClick={sendNotifications} disabled={sending}>
          <Send size={20} />
          {sending ? '발송 중...' : `${selectedWorkers.length}명에게 알림 보내기`}
        </Button>

        {/* 발송 내역 */}
        <Card>
          <h3 className="text-lg font-bold mb-3">최근 발송 내역</h3>

          {notifications.length === 0 ? (
            <p className="text-gray-500 text-center py-4">발송 내역이 없습니다</p>
          ) : (
            <div className="space-y-2">
              {notifications.map((noti) => (
                <div key={noti.id} className="bg-gray-50 rounded-xl p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{noti.phone}</p>
                      <p className="text-sm text-gray-600 mt-1">{noti.message}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      noti.status === 'sent' ? 'bg-green-100 text-green-700' :
                      noti.status === 'failed' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {noti.status === 'sent' ? '발송완료' :
                       noti.status === 'failed' ? '실패' : '대기중'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(noti.sent_at).toLocaleString('ko-KR')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

export default AdminNotifyPage;
