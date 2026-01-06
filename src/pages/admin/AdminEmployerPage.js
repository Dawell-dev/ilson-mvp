import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, CheckCircle, XCircle, Clock, Phone, Mail, MapPin, FileText, Eye } from 'lucide-react';
import { Button, Card, Loading } from '../../components/common';
import { supabase } from '../../lib/supabase';

function AdminEmployerPage() {
  const navigate = useNavigate();
  const [employers, setEmployers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('pending'); // pending, approved, rejected
  const [selectedEmployer, setSelectedEmployer] = useState(null);

  useEffect(() => {
    loadEmployers();
  }, []);

  const loadEmployers = async () => {
    try {
      const { data, error } = await supabase
        .from('employers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEmployers(data || []);
    } catch (error) {
      console.error('Error loading employers:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (employerId, newStatus) => {
    try {
      const { error } = await supabase
        .from('employers')
        .update({
          status: newStatus,
          approved_at: newStatus === 'approved' ? new Date().toISOString() : null
        })
        .eq('id', employerId);

      if (error) throw error;

      // 목록 업데이트
      setEmployers(prev =>
        prev.map(emp =>
          emp.id === employerId
            ? { ...emp, status: newStatus, approved_at: newStatus === 'approved' ? new Date().toISOString() : null }
            : emp
        )
      );

      setSelectedEmployer(null);
      alert(newStatus === 'approved' ? '승인 완료!' : '거절 처리되었습니다.');
    } catch (error) {
      alert('처리 중 오류가 발생했습니다: ' + error.message);
    }
  };

  const filteredEmployers = employers.filter(emp => {
    if (tab === 'pending') return !emp.status || emp.status === 'pending';
    if (tab === 'approved') return emp.status === 'approved';
    if (tab === 'rejected') return emp.status === 'rejected';
    return true;
  });

  const getStatusBadge = (status) => {
    if (!status || status === 'pending') {
      return <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-medium">대기중</span>;
    }
    if (status === 'approved') {
      return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">승인됨</span>;
    }
    return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">거절됨</span>;
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
          <h1 className="text-xl font-bold">기업 승인 관리</h1>
        </div>
      </div>

      {/* 탭 */}
      <div className="bg-white px-4 py-3 border-b border-gray-200 flex gap-2">
        <button
          onClick={() => setTab('pending')}
          className={`flex-1 py-3 rounded-xl font-bold ${
            tab === 'pending' ? 'bg-yellow-500 text-white' : 'bg-gray-100 text-gray-600'
          }`}
        >
          <Clock size={18} className="inline mr-1" />
          대기 ({employers.filter(e => !e.status || e.status === 'pending').length})
        </button>
        <button
          onClick={() => setTab('approved')}
          className={`flex-1 py-3 rounded-xl font-bold ${
            tab === 'approved' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'
          }`}
        >
          <CheckCircle size={18} className="inline mr-1" />
          승인 ({employers.filter(e => e.status === 'approved').length})
        </button>
        <button
          onClick={() => setTab('rejected')}
          className={`flex-1 py-3 rounded-xl font-bold ${
            tab === 'rejected' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600'
          }`}
        >
          <XCircle size={18} className="inline mr-1" />
          거절 ({employers.filter(e => e.status === 'rejected').length})
        </button>
      </div>

      {/* 목록 */}
      <div className="px-4 py-4">
        {filteredEmployers.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="mx-auto text-gray-300 mb-4" size={48} />
            <p className="text-gray-500 text-lg">
              {tab === 'pending' && '대기중인 기업이 없습니다'}
              {tab === 'approved' && '승인된 기업이 없습니다'}
              {tab === 'rejected' && '거절된 기업이 없습니다'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEmployers.map((employer) => (
              <Card key={employer.id}>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                      <Building2 className="text-orange-600" size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{employer.company_name}</h3>
                      <p className="text-gray-500">{employer.ceo_name || employer.contact_name}</p>
                    </div>
                  </div>
                  {getStatusBadge(employer.status)}
                </div>

                <div className="space-y-2 text-gray-600 mb-4">
                  {employer.business_number && (
                    <p className="flex items-center gap-2">
                      <FileText size={18} className="text-gray-400" />
                      사업자번호: {employer.business_number.replace(/(\d{3})(\d{2})(\d{5})/, '$1-$2-$3')}
                    </p>
                  )}
                  <p className="flex items-center gap-2">
                    <Phone size={18} className="text-gray-400" />
                    {employer.phone}
                  </p>
                  {employer.email && (
                    <p className="flex items-center gap-2">
                      <Mail size={18} className="text-gray-400" />
                      {employer.email}
                    </p>
                  )}
                  {employer.business_address && (
                    <p className="flex items-center gap-2">
                      <MapPin size={18} className="text-gray-400" />
                      {employer.business_address}
                    </p>
                  )}
                </div>

                <div className="text-sm text-gray-400 mb-4">
                  신청일: {new Date(employer.created_at).toLocaleDateString('ko-KR')}
                  {employer.approved_at && (
                    <span className="ml-3">
                      승인일: {new Date(employer.approved_at).toLocaleDateString('ko-KR')}
                    </span>
                  )}
                </div>

                {/* 버튼 영역 */}
                {(!employer.status || employer.status === 'pending') && (
                  <div className="flex gap-2 pt-3 border-t border-gray-100">
                    <Button
                      variant="outline"
                      size="small"
                      fullWidth={false}
                      className="flex-1"
                      onClick={() => setSelectedEmployer(employer)}
                    >
                      <Eye size={18} />
                      상세보기
                    </Button>
                    <button
                      onClick={() => updateStatus(employer.id, 'approved')}
                      className="flex-1 py-2 px-4 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle size={18} />
                      승인
                    </button>
                    <button
                      onClick={() => updateStatus(employer.id, 'rejected')}
                      className="flex-1 py-2 px-4 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-all flex items-center justify-center gap-2"
                    >
                      <XCircle size={18} />
                      거절
                    </button>
                  </div>
                )}

                {employer.status === 'rejected' && (
                  <div className="pt-3 border-t border-gray-100">
                    <button
                      onClick={() => updateStatus(employer.id, 'approved')}
                      className="w-full py-2 px-4 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle size={18} />
                      재승인
                    </button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* 상세보기 모달 */}
      {selectedEmployer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold">기업 상세정보</h2>
                <button
                  onClick={() => setSelectedEmployer(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-500">회사명</label>
                  <p className="text-lg font-bold">{selectedEmployer.company_name}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">사업자등록번호</label>
                  <p className="text-lg">{selectedEmployer.business_number?.replace(/(\d{3})(\d{2})(\d{5})/, '$1-$2-$3') || '-'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">대표자명</label>
                  <p className="text-lg">{selectedEmployer.ceo_name || '-'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">담당자</label>
                  <p className="text-lg">{selectedEmployer.contact_name}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">연락처</label>
                  <p className="text-lg">{selectedEmployer.phone}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">이메일</label>
                  <p className="text-lg">{selectedEmployer.email || '-'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">회사 주소</label>
                  <p className="text-lg">{selectedEmployer.business_address || '-'}</p>
                </div>

                {/* 사업자등록증 이미지 (있다면) */}
                {selectedEmployer.business_file_url && (
                  <div>
                    <label className="text-sm text-gray-500">사업자등록증</label>
                    <img
                      src={selectedEmployer.business_file_url}
                      alt="사업자등록증"
                      className="mt-2 w-full rounded-lg border"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => {
                    updateStatus(selectedEmployer.id, 'approved');
                  }}
                  className="flex-1 py-3 px-4 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition-all"
                >
                  승인하기
                </button>
                <button
                  onClick={() => {
                    updateStatus(selectedEmployer.id, 'rejected');
                  }}
                  className="flex-1 py-3 px-4 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-all"
                >
                  거절하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminEmployerPage;
