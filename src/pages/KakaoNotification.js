import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  MessageCircle,
  Bell,
  MapPin,
  Clock,
  CheckCircle,
  Settings,
  ChevronRight,
  Smartphone,
  Star,
  Heart,
  Send,
  Plus,
  X,
  DollarSign,
  Calendar
} from 'lucide-react';

const KakaoNotification = () => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedDistance, setSelectedDistance] = useState('3km');
  const [selectedTimes, setSelectedTimes] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);

  const categories = [
    { id: 'security', name: '경비/보안', icon: '🛡️' },
    { id: 'cleaning', name: '청소/미화', icon: '🧹' },
    { id: 'parking', name: '주차관리', icon: '🅿️' },
    { id: 'delivery', name: '배달/운송', icon: '🚚' },
    { id: 'food', name: '급식/조리', icon: '🍳' },
    { id: 'office', name: '사무보조', icon: '📋' }
  ];

  const distances = ['1km', '3km', '5km', '10km'];

  const times = [
    { id: 'morning', name: '오전 (06:00-12:00)' },
    { id: 'afternoon', name: '오후 (12:00-18:00)' },
    { id: 'evening', name: '저녁 (18:00-22:00)' },
    { id: 'flexible', name: '시간 무관' }
  ];

  const sampleNotifications = [
    {
      id: 1,
      title: '새로운 일자리가 도착했어요!',
      job: '아파트 경비원',
      company: '래미안 푸르지오',
      distance: '0.8km',
      salary: '월 220만원',
      time: '10분 전'
    },
    {
      id: 2,
      title: '관심 직종에 새 공고!',
      job: '학교 급식 보조',
      company: '역삼초등학교',
      distance: '1.2km',
      salary: '시급 12,000원',
      time: '1시간 전'
    },
    {
      id: 3,
      title: '급구! 지금 바로 지원하세요',
      job: '마트 주차관리',
      company: '이마트 역삼점',
      distance: '1.5km',
      salary: '시급 11,000원',
      time: '3시간 전'
    }
  ];

  const toggleCategory = (categoryId) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const toggleTime = (timeId) => {
    setSelectedTimes(prev =>
      prev.includes(timeId)
        ? prev.filter(id => id !== timeId)
        : [...prev, timeId]
    );
  };

  const handleSubscribe = () => {
    if (phoneNumber && selectedCategories.length > 0) {
      setIsSubscribed(true);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-800">일손</span>
            </Link>
            <Link to="/platform" className="text-orange-500 font-medium">
              일자리 보기
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <MessageCircle className="w-10 h-10 text-yellow-900" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-3">
            카카오톡으로<br />일자리 알림 받기
          </h1>
          <p className="text-gray-600">
            내 조건에 맞는 일자리가 올라오면<br />
            카카오톡으로 바로 알려드려요!
          </p>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 z-50">
            <CheckCircle className="w-5 h-5" />
            알림 설정이 완료되었습니다!
          </div>
        )}

        {!isSubscribed ? (
          /* Subscription Form */
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6">알림 설정하기</h2>

            {/* Phone Number */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Smartphone className="w-4 h-4 inline mr-1" />
                휴대폰 번호
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="010-0000-0000"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
              <p className="text-xs text-gray-500 mt-1">
                카카오톡에 연결된 번호를 입력해 주세요
              </p>
            </div>

            {/* Categories */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Briefcase className="w-4 h-4 inline mr-1" />
                관심 직종 (복수 선택 가능)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => toggleCategory(cat.id)}
                    className={`p-3 rounded-xl border text-center transition ${
                      selectedCategories.includes(cat.id)
                        ? 'border-yellow-400 bg-yellow-50'
                        : 'border-gray-200 hover:border-yellow-400'
                    }`}
                  >
                    <span className="text-2xl block mb-1">{cat.icon}</span>
                    <span className="text-xs">{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Distance */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                희망 거리
              </label>
              <div className="flex gap-2">
                {distances.map(dist => (
                  <button
                    key={dist}
                    onClick={() => setSelectedDistance(dist)}
                    className={`flex-1 py-2 rounded-lg text-sm ${
                      selectedDistance === dist
                        ? 'bg-yellow-400 text-yellow-900 font-medium'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {dist}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Preference */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                희망 근무시간
              </label>
              <div className="space-y-2">
                {times.map(time => (
                  <button
                    key={time.id}
                    onClick={() => toggleTime(time.id)}
                    className={`w-full py-3 px-4 rounded-xl border text-left transition ${
                      selectedTimes.includes(time.id)
                        ? 'border-yellow-400 bg-yellow-50'
                        : 'border-gray-200 hover:border-yellow-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{time.name}</span>
                      {selectedTimes.includes(time.id) && (
                        <CheckCircle className="w-5 h-5 text-yellow-500" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Subscribe Button */}
            <button
              onClick={handleSubscribe}
              disabled={!phoneNumber || selectedCategories.length === 0}
              className={`w-full py-4 rounded-xl text-lg font-semibold flex items-center justify-center gap-2 ${
                phoneNumber && selectedCategories.length > 0
                  ? 'bg-yellow-400 text-yellow-900 hover:bg-yellow-500'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Bell className="w-5 h-5" />
              알림 받기
            </button>

            <p className="text-xs text-center text-gray-500 mt-4">
              언제든지 설정에서 알림을 해제할 수 있습니다
            </p>
          </div>
        ) : (
          /* Subscribed View */
          <div className="space-y-6">
            {/* Current Settings */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800">알림 설정</h2>
                <button className="text-yellow-600 text-sm font-medium flex items-center">
                  <Settings className="w-4 h-4 mr-1" />
                  수정
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-gray-600">알림 상태</span>
                  <span className="flex items-center text-green-600 font-medium">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    활성화
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-gray-600">관심 직종</span>
                  <span className="text-gray-800">
                    {selectedCategories.map(id =>
                      categories.find(c => c.id === id)?.name
                    ).join(', ')}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-gray-600">희망 거리</span>
                  <span className="text-gray-800">{selectedDistance} 이내</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-600">연락처</span>
                  <span className="text-gray-800">{phoneNumber}</span>
                </div>
              </div>
            </div>

            {/* Sample Notifications */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">최근 알림</h2>

              <div className="space-y-4">
                {sampleNotifications.map(notif => (
                  <div
                    key={notif.id}
                    className="border border-gray-100 rounded-xl p-4 hover:shadow-md transition cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <MessageCircle className="w-5 h-5 text-yellow-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-yellow-600 font-medium mb-1">
                          {notif.title}
                        </p>
                        <h3 className="font-bold text-gray-800">{notif.job}</h3>
                        <p className="text-sm text-gray-600">{notif.company}</p>
                        <div className="flex gap-3 mt-2 text-xs text-gray-500">
                          <span className="flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            {notif.distance}
                          </span>
                          <span className="flex items-center">
                            <DollarSign className="w-3 h-3 mr-1" />
                            {notif.salary}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400">{notif.time}</span>
                    </div>
                  </div>
                ))}
              </div>

              <Link
                to="/platform"
                className="block mt-4 text-center text-orange-500 font-medium"
              >
                더 많은 일자리 보기 <ChevronRight className="w-4 h-4 inline" />
              </Link>
            </div>

            {/* Unsubscribe */}
            <button
              onClick={() => setIsSubscribed(false)}
              className="w-full py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50"
            >
              알림 해제하기
            </button>
          </div>
        )}

        {/* Benefits */}
        <div className="mt-10">
          <h3 className="text-lg font-bold text-gray-800 text-center mb-6">
            카카오톡 알림의 장점
          </h3>
          <div className="grid grid-cols-1 gap-4">
            {[
              {
                icon: <Bell className="w-6 h-6 text-yellow-500" />,
                title: '실시간 알림',
                desc: '새로운 일자리가 등록되면 바로 알림'
              },
              {
                icon: <MapPin className="w-6 h-6 text-yellow-500" />,
                title: '맞춤형 추천',
                desc: '내 조건에 딱 맞는 일자리만 추천'
              },
              {
                icon: <Send className="w-6 h-6 text-yellow-500" />,
                title: '빠른 지원',
                desc: '알림에서 바로 지원 가능'
              }
            ].map((item, idx) => (
              <div key={idx} className="bg-white rounded-xl p-4 flex items-center gap-4 shadow-sm">
                <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center">
                  {item.icon}
                </div>
                <div>
                  <h4 className="font-bold text-gray-800">{item.title}</h4>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Quick Navigation */}
      <nav className="fixed bottom-4 right-4 z-40">
        <div className="bg-white rounded-lg shadow-lg p-3 space-y-2">
          <Link to="/" className="block px-4 py-2 hover:bg-gray-100 rounded text-sm font-medium">홈</Link>
          <Link to="/platform" className="block px-4 py-2 hover:bg-gray-100 rounded text-sm font-medium">플랫폼</Link>
          <Link to="/dashboard" className="block px-4 py-2 hover:bg-gray-100 rounded text-sm font-medium">대시보드</Link>
          <Link to="/kakao" className="block px-4 py-2 bg-yellow-100 text-yellow-700 rounded text-sm font-medium">카톡알림</Link>
        </div>
      </nav>
    </div>
  );
};

export default KakaoNotification;
