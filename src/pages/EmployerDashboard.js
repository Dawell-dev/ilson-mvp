import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  Users,
  FileText,
  BarChart3,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Eye,
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Star,
  TrendingUp,
  Bell
} from 'lucide-react';

const EmployerDashboard = () => {
  const [activeTab, setActiveTab] = useState('jobs');
  const [showNewJobModal, setShowNewJobModal] = useState(false);

  const stats = [
    { label: '게시 중인 공고', value: '5', icon: <FileText className="w-6 h-6" />, color: 'bg-blue-500' },
    { label: '총 지원자', value: '47', icon: <Users className="w-6 h-6" />, color: 'bg-green-500' },
    { label: '면접 예정', value: '8', icon: <Calendar className="w-6 h-6" />, color: 'bg-orange-500' },
    { label: '채용 완료', value: '12', icon: <CheckCircle className="w-6 h-6" />, color: 'bg-purple-500' }
  ];

  const jobs = [
    {
      id: 1,
      title: '아파트 경비원',
      status: 'active',
      applicants: 15,
      newApplicants: 3,
      views: 234,
      posted: '2024-01-15',
      expires: '2024-02-15'
    },
    {
      id: 2,
      title: '청소 미화원',
      status: 'active',
      applicants: 8,
      newApplicants: 1,
      views: 156,
      posted: '2024-01-18',
      expires: '2024-02-18'
    },
    {
      id: 3,
      title: '주차 관리원',
      status: 'closed',
      applicants: 12,
      newApplicants: 0,
      views: 189,
      posted: '2024-01-10',
      expires: '2024-02-10'
    }
  ];

  const applicants = [
    {
      id: 1,
      name: '김영수',
      age: 62,
      job: '아파트 경비원',
      status: 'new',
      appliedAt: '2시간 전',
      experience: '경비 경력 5년',
      location: '강남구 역삼동',
      distance: '1.2km',
      phone: '010-1234-5678',
      rating: 4.8
    },
    {
      id: 2,
      name: '박순희',
      age: 58,
      job: '청소 미화원',
      status: 'reviewing',
      appliedAt: '1일 전',
      experience: '미화 경력 3년',
      location: '강남구 삼성동',
      distance: '2.5km',
      phone: '010-2345-6789',
      rating: 4.5
    },
    {
      id: 3,
      name: '이정호',
      age: 65,
      job: '아파트 경비원',
      status: 'interview',
      appliedAt: '3일 전',
      experience: '경비 경력 10년',
      location: '강남구 대치동',
      distance: '3.1km',
      phone: '010-3456-7890',
      rating: 4.9
    },
    {
      id: 4,
      name: '최미자',
      age: 60,
      job: '청소 미화원',
      status: 'hired',
      appliedAt: '1주일 전',
      experience: '미화 경력 7년',
      location: '강남구 역삼동',
      distance: '0.8km',
      phone: '010-4567-8901',
      rating: 4.7
    }
  ];

  const getStatusBadge = (status) => {
    const styles = {
      new: 'bg-blue-100 text-blue-700',
      reviewing: 'bg-yellow-100 text-yellow-700',
      interview: 'bg-orange-100 text-orange-700',
      hired: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700'
    };
    const labels = {
      new: '신규',
      reviewing: '검토중',
      interview: '면접예정',
      hired: '채용완료',
      rejected: '불합격'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const getJobStatusBadge = (status) => {
    return status === 'active' ? (
      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
        게시중
      </span>
    ) : (
      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
        마감
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-2xl font-bold text-gray-800">일손</span>
                <span className="text-sm text-gray-500 ml-2">기업회원</span>
              </div>
            </Link>
            <div className="flex items-center space-x-4">
              <button className="relative p-2 hover:bg-gray-100 rounded-full">
                <Bell className="w-6 h-6 text-gray-600" />
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-orange-600 font-semibold">래</span>
                </div>
                <span className="font-medium text-gray-800">래미안 푸르지오</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className={`${stat.color} text-white p-3 rounded-xl`}>
                  {stat.icon}
                </div>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <div className="text-3xl font-bold text-gray-800">{stat.value}</div>
              <div className="text-sm text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm mb-6">
          <div className="border-b">
            <div className="flex">
              <button
                onClick={() => setActiveTab('jobs')}
                className={`px-6 py-4 font-medium ${
                  activeTab === 'jobs'
                    ? 'text-orange-500 border-b-2 border-orange-500'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                공고 관리
              </button>
              <button
                onClick={() => setActiveTab('applicants')}
                className={`px-6 py-4 font-medium ${
                  activeTab === 'applicants'
                    ? 'text-orange-500 border-b-2 border-orange-500'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                지원자 관리
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-6 py-4 font-medium ${
                  activeTab === 'analytics'
                    ? 'text-orange-500 border-b-2 border-orange-500'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                통계
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'jobs' && (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-800">채용 공고</h2>
                  <button
                    onClick={() => setShowNewJobModal(true)}
                    className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    새 공고 등록
                  </button>
                </div>

                <div className="space-y-4">
                  {jobs.map(job => (
                    <div key={job.id} className="border border-gray-100 rounded-xl p-5 hover:shadow-md transition">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-bold text-gray-800">{job.title}</h3>
                            {getJobStatusBadge(job.status)}
                          </div>
                          <p className="text-sm text-gray-500">
                            등록일: {job.posted} · 마감일: {job.expires}
                          </p>
                        </div>
                        <button className="p-2 hover:bg-gray-100 rounded-full">
                          <MoreVertical className="w-5 h-5 text-gray-400" />
                        </button>
                      </div>

                      <div className="flex gap-6 mt-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <Eye className="w-4 h-4 mr-1 text-gray-400" />
                          조회 {job.views}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Users className="w-4 h-4 mr-1 text-gray-400" />
                          지원자 {job.applicants}
                          {job.newApplicants > 0 && (
                            <span className="ml-1 bg-red-500 text-white text-xs px-1.5 rounded-full">
                              +{job.newApplicants}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 mt-4">
                        <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">
                          수정
                        </button>
                        <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">
                          지원자 보기
                        </button>
                        {job.status === 'active' && (
                          <button className="px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-50">
                            마감하기
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {activeTab === 'applicants' && (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-800">지원자 목록</h2>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="이름, 연락처 검색"
                        className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 flex items-center gap-1">
                      <Filter className="w-4 h-4" />
                      필터
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {applicants.map(applicant => (
                    <div key={applicant.id} className="border border-gray-100 rounded-xl p-5 hover:shadow-md transition">
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-4">
                          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center">
                            <span className="text-xl font-bold text-gray-600">
                              {applicant.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-bold text-gray-800">{applicant.name}</h3>
                              <span className="text-gray-500">({applicant.age}세)</span>
                              {getStatusBadge(applicant.status)}
                            </div>
                            <p className="text-sm text-orange-500 font-medium">{applicant.job}</p>
                            <p className="text-sm text-gray-500 mt-1">{applicant.experience}</p>

                            <div className="flex gap-4 mt-2 text-sm text-gray-500">
                              <span className="flex items-center">
                                <MapPin className="w-3 h-3 mr-1" />
                                {applicant.location} ({applicant.distance})
                              </span>
                              <span className="flex items-center">
                                <Star className="w-3 h-3 mr-1 text-yellow-400 fill-current" />
                                {applicant.rating}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-400">{applicant.appliedAt}</p>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-4 pt-4 border-t">
                        <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 flex items-center gap-1">
                          <Phone className="w-4 h-4" />
                          연락하기
                        </button>
                        <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 flex items-center gap-1">
                          <MessageSquare className="w-4 h-4" />
                          메시지
                        </button>
                        <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          이력서
                        </button>
                        {applicant.status === 'new' && (
                          <>
                            <button className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600 flex items-center gap-1 ml-auto">
                              <CheckCircle className="w-4 h-4" />
                              면접 요청
                            </button>
                            <button className="px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-50 flex items-center gap-1">
                              <XCircle className="w-4 h-4" />
                              불합격
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {activeTab === 'analytics' && (
              <div className="text-center py-12">
                <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-800 mb-2">채용 통계</h3>
                <p className="text-gray-500">
                  공고별 조회수, 지원율, 채용 현황을<br />
                  한눈에 확인할 수 있습니다.
                </p>
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-blue-50 rounded-xl p-6">
                    <div className="text-3xl font-bold text-blue-600 mb-1">579</div>
                    <div className="text-sm text-blue-600">총 조회수</div>
                  </div>
                  <div className="bg-green-50 rounded-xl p-6">
                    <div className="text-3xl font-bold text-green-600 mb-1">8.1%</div>
                    <div className="text-sm text-green-600">평균 지원율</div>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-6">
                    <div className="text-3xl font-bold text-purple-600 mb-1">25.5%</div>
                    <div className="text-sm text-purple-600">채용 전환율</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Job Modal */}
      {showNewJobModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">새 채용공고 등록</h2>
              <button
                onClick={() => setShowNewJobModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">공고 제목</label>
                <input
                  type="text"
                  placeholder="예: 아파트 경비원 모집"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">직종</label>
                <select className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500">
                  <option>경비/보안</option>
                  <option>청소/미화</option>
                  <option>주차관리</option>
                  <option>배달/운송</option>
                  <option>급식/조리</option>
                  <option>사무보조</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">급여 형태</label>
                  <select className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500">
                    <option>월급</option>
                    <option>시급</option>
                    <option>일급</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">급여액</label>
                  <input
                    type="text"
                    placeholder="예: 220"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">근무시간</label>
                <input
                  type="text"
                  placeholder="예: 08:00 - 18:00 (주간)"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">근무지 주소</label>
                <input
                  type="text"
                  placeholder="주소를 입력하세요"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">자격요건</label>
                <textarea
                  rows={3}
                  placeholder="예: 60세 이하, 성실하신 분"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">복리후생</label>
                <div className="flex flex-wrap gap-2">
                  {['4대보험', '식사제공', '교통비지원', '휴게실', '유니폼지급'].map(benefit => (
                    <label key={benefit} className="flex items-center">
                      <input type="checkbox" className="mr-1.5" />
                      <span className="text-sm">{benefit}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowNewJobModal(false)}
                  className="flex-1 border border-gray-200 py-3 rounded-xl font-semibold hover:bg-gray-50"
                >
                  취소
                </button>
                <button className="flex-1 bg-orange-500 text-white py-3 rounded-xl font-semibold hover:bg-orange-600">
                  등록하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Navigation */}
      <nav className="fixed bottom-4 right-4 z-40">
        <div className="bg-white rounded-lg shadow-lg p-3 space-y-2">
          <Link to="/" className="block px-4 py-2 hover:bg-gray-100 rounded text-sm font-medium">홈</Link>
          <Link to="/platform" className="block px-4 py-2 hover:bg-gray-100 rounded text-sm font-medium">플랫폼</Link>
          <Link to="/dashboard" className="block px-4 py-2 bg-orange-100 text-orange-600 rounded text-sm font-medium">대시보드</Link>
          <Link to="/kakao" className="block px-4 py-2 hover:bg-gray-100 rounded text-sm font-medium">카톡알림</Link>
        </div>
      </nav>
    </div>
  );
};

export default EmployerDashboard;
