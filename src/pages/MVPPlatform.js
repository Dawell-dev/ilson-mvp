import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Briefcase,
  Clock,
  DollarSign,
  Search,
  Filter,
  Star,
  Heart,
  Building,
  X,
  Loader
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const MVPPlatform = () => {
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [selectedDistance, setSelectedDistance] = useState('전체');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const categories = ['전체', '경비/보안', '청소/미화', '주차관리', '배달/운송', '급식/조리', '사무보조', '시설관리'];
  const distances = ['전체', '1km 이내', '3km 이내', '5km 이내', '10km 이내'];

  // Supabase에서 일자리 데이터 불러오기
  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // DB 컬럼명을 컴포넌트에서 사용하는 형식으로 변환
      const formattedJobs = data.map(job => ({
        id: job.id,
        title: job.title,
        company: job.company,
        location: job.location,
        distance: job.distance,
        salary: job.salary,
        workTime: job.work_time,
        workDays: job.work_days,
        category: job.category,
        requirements: job.requirements,
        benefits: job.benefits || [],
        posted: getTimeAgo(job.created_at),
        urgent: job.urgent,
        rating: 4.5,
        reviews: Math.floor(Math.random() * 50) + 10
      }));

      setJobs(formattedJobs);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  // 시간 계산 함수
  const getTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;
    return `${Math.floor(diffDays / 7)}주일 전`;
  };

  const filteredJobs = jobs.filter(job => {
    const matchesCategory = selectedCategory === '전체' || job.category === selectedCategory;
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         job.company.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleFavorite = (jobId) => {
    setFavorites(prev =>
      prev.includes(jobId) ? prev.filter(id => id !== jobId) : [...prev, jobId]
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-800">일손</span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link to="/kakao" className="text-gray-600 hover:text-orange-500">
                알림설정
              </Link>
              <button className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600">
                로그인
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="일자리, 회사명 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <button
              onClick={() => setShowFilter(!showFilter)}
              className="px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 flex items-center gap-2"
            >
              <Filter className="w-5 h-5" />
              필터
            </button>
          </div>

          {/* Filter Panel */}
          {showFilter && (
            <div className="mt-4 p-4 bg-gray-50 rounded-xl">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">카테고리</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-full text-sm ${
                        selectedCategory === cat
                          ? 'bg-orange-500 text-white'
                          : 'bg-white border border-gray-200 text-gray-700 hover:border-orange-500'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">거리</label>
                <div className="flex flex-wrap gap-2">
                  {distances.map(dist => (
                    <button
                      key={dist}
                      onClick={() => setSelectedDistance(dist)}
                      className={`px-3 py-1.5 rounded-full text-sm ${
                        selectedDistance === dist
                          ? 'bg-orange-500 text-white'
                          : 'bg-white border border-gray-200 text-gray-700 hover:border-orange-500'
                      }`}
                    >
                      {dist}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Category Pills */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Results Count */}
        <div className="flex justify-between items-center mb-4">
          <p className="text-gray-600">
            <span className="font-semibold text-orange-500">{filteredJobs.length}개</span>의 일자리
          </p>
          <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
            <option>거리순</option>
            <option>최신순</option>
            <option>급여순</option>
            <option>인기순</option>
          </select>
        </div>

        {/* Job List */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader className="w-8 h-8 text-orange-500 animate-spin" />
            <span className="ml-2 text-gray-600">일자리를 불러오는 중...</span>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500">검색 결과가 없습니다.</p>
          </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredJobs.map(job => (
            <div
              key={job.id}
              onClick={() => setSelectedJob(job)}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition cursor-pointer"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  {job.urgent && (
                    <span className="inline-block bg-red-100 text-red-600 text-xs font-semibold px-2 py-1 rounded-full mb-2">
                      급구
                    </span>
                  )}
                  <h3 className="text-lg font-bold text-gray-800">{job.title}</h3>
                  <p className="text-gray-600">{job.company}</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(job.id);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <Heart
                    className={`w-5 h-5 ${
                      favorites.includes(job.id) ? 'fill-red-500 text-red-500' : 'text-gray-400'
                    }`}
                  />
                </button>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                  {job.location} · <span className="text-orange-500 ml-1">{job.distance}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <DollarSign className="w-4 h-4 mr-2 text-gray-400" />
                  <span className="font-semibold text-gray-800">{job.salary}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="w-4 h-4 mr-2 text-gray-400" />
                  {job.workTime} · {job.workDays}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                {job.benefits.slice(0, 3).map((benefit, idx) => (
                  <span key={idx} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                    {benefit}
                  </span>
                ))}
              </div>

              <div className="flex justify-between items-center pt-3 border-t">
                <div className="flex items-center text-sm text-gray-500">
                  <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                  {job.rating} ({job.reviews})
                </div>
                <span className="text-sm text-gray-400">{job.posted}</span>
              </div>
            </div>
          ))}
        </div>
        )}
      </main>

      {/* Job Detail Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">{selectedJob.title}</h2>
              <button
                onClick={() => setSelectedJob(null)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                  <Building className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <p className="font-semibold">{selectedJob.company}</p>
                  <div className="flex items-center text-sm text-gray-500">
                    <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                    {selectedJob.rating} ({selectedJob.reviews}개 리뷰)
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 rounded-xl p-4 mb-6">
                <div className="text-2xl font-bold text-orange-500 mb-1">{selectedJob.salary}</div>
                <p className="text-gray-600 text-sm">{selectedJob.workTime} · {selectedJob.workDays}</p>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">근무지</h4>
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-4 h-4 mr-2" />
                    {selectedJob.location} ({selectedJob.distance})
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">자격요건</h4>
                  <p className="text-gray-600">{selectedJob.requirements}</p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">복리후생</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedJob.benefits.map((benefit, idx) => (
                      <span key={idx} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                        {benefit}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => toggleFavorite(selectedJob.id)}
                  className="flex-1 border border-gray-200 py-3 rounded-xl font-semibold hover:bg-gray-50 flex items-center justify-center"
                >
                  <Heart
                    className={`w-5 h-5 mr-2 ${
                      favorites.includes(selectedJob.id) ? 'fill-red-500 text-red-500' : 'text-gray-400'
                    }`}
                  />
                  찜하기
                </button>
                <button className="flex-1 bg-orange-500 text-white py-3 rounded-xl font-semibold hover:bg-orange-600">
                  지원하기
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
          <Link to="/platform" className="block px-4 py-2 bg-orange-100 text-orange-600 rounded text-sm font-medium">플랫폼</Link>
          <Link to="/dashboard" className="block px-4 py-2 hover:bg-gray-100 rounded text-sm font-medium">대시보드</Link>
          <Link to="/kakao" className="block px-4 py-2 hover:bg-gray-100 rounded text-sm font-medium">카톡알림</Link>
        </div>
      </nav>
    </div>
  );
};

export default MVPPlatform;
