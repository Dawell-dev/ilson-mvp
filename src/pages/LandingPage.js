import React from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Briefcase,
  Users,
  Clock,
  Star,
  ChevronRight,
  Phone,
  Shield,
  Heart,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

const LandingPage = () => {

  const features = [
    {
      icon: <MapPin className="w-8 h-8 text-orange-500" />,
      title: "위치 기반 매칭",
      description: "집에서 가까운 일자리를 우선 추천해 드립니다"
    },
    {
      icon: <Clock className="w-8 h-8 text-orange-500" />,
      title: "유연한 근무시간",
      description: "원하는 시간대에 맞는 일자리를 찾아보세요"
    },
    {
      icon: <Shield className="w-8 h-8 text-orange-500" />,
      title: "안전한 거래",
      description: "검증된 기업만 등록, 안심하고 지원하세요"
    },
    {
      icon: <Heart className="w-8 h-8 text-orange-500" />,
      title: "시니어 특화",
      description: "50-70대에 적합한 일자리만 엄선했습니다"
    }
  ];

  const testimonials = [
    {
      name: "김영수",
      age: 65,
      job: "아파트 경비",
      content: "은퇴 후 무료했는데, 일손 덕분에 집 근처 아파트 경비 일을 구했어요. 매일 출퇴근이 즐거워요!",
      rating: 5
    },
    {
      name: "박순희",
      age: 58,
      job: "급식 보조",
      content: "학교 급식실에서 일하게 되었는데, 아이들 보는 재미가 쏠쏠해요. 일손에서 빠르게 연결해줬어요.",
      rating: 5
    },
    {
      name: "이정호",
      age: 62,
      job: "주차 관리",
      content: "마트 주차장 관리 일을 시작했습니다. 건강도 챙기고 용돈도 벌고 일석이조예요!",
      rating: 5
    }
  ];

  const stats = [
    { number: "15,000+", label: "등록 구직자" },
    { number: "3,200+", label: "제휴 기업" },
    { number: "8,500+", label: "성사된 매칭" },
    { number: "4.8", label: "평균 만족도" }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white shadow-sm z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-800">일손</span>
          </div>
          <div className="hidden md:flex items-center space-x-6">
            <a href="#features" className="text-gray-600 hover:text-orange-500">특징</a>
            <a href="#testimonials" className="text-gray-600 hover:text-orange-500">후기</a>
            <Link to="/jobs" className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition">
              시작하기
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-gradient-to-b from-orange-50 to-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-10 md:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6 leading-tight">
                경험이 빛나는<br />
                <span className="text-orange-500">시니어 일자리</span>,<br />
                일손에서 찾으세요
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                50-70대를 위한 맞춤형 일자리 매칭 서비스.<br />
                내 집 근처, 내 시간에 맞는 일을 찾아보세요.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/jobs"
                  className="bg-orange-500 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-orange-600 transition flex items-center justify-center"
                >
                  일자리 찾기 <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
                <Link
                  to="/employer/post"
                  className="border-2 border-orange-500 text-orange-500 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-orange-50 transition flex items-center justify-center"
                >
                  기업 회원가입
                </Link>
              </div>
            </div>
            <div className="md:w-1/2 flex justify-center">
              <div className="relative">
                <div className="w-72 h-72 bg-orange-100 rounded-full flex items-center justify-center">
                  <Users className="w-32 h-32 text-orange-500" />
                </div>
                <div className="absolute -top-4 -right-4 bg-white shadow-lg rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-sm font-medium">오늘 128건 매칭!</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-orange-500">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">{stat.number}</div>
                <div className="text-orange-100">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              왜 <span className="text-orange-500">일손</span>인가요?
            </h2>
            <p className="text-xl text-gray-600">
              시니어를 위한 맞춤 서비스를 제공합니다
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition border border-gray-100"
              >
                <div className="w-16 h-16 bg-orange-50 rounded-xl flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              이용 방법
            </h2>
            <p className="text-xl text-gray-600">
              3단계로 간편하게 시작하세요
            </p>
          </div>
          <div className="flex flex-col md:flex-row justify-center items-center gap-8">
            {[
              { step: 1, title: "회원가입", desc: "간단한 정보 입력으로 시작" },
              { step: 2, title: "일자리 검색", desc: "위치, 시간 조건에 맞게 검색" },
              { step: 3, title: "지원 & 매칭", desc: "원하는 일자리에 바로 지원" }
            ].map((item, index) => (
              <div key={index} className="flex items-center">
                <div className="text-center">
                  <div className="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl font-bold text-white">{item.step}</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{item.title}</h3>
                  <p className="text-gray-600">{item.desc}</p>
                </div>
                {index < 2 && (
                  <ChevronRight className="w-8 h-8 text-gray-300 mx-4 hidden md:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              이용자 후기
            </h2>
            <p className="text-xl text-gray-600">
              일손을 통해 새로운 시작을 한 분들의 이야기
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100"
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 leading-relaxed">"{testimonial.content}"</p>
                <div className="border-t pt-4">
                  <div className="font-bold text-gray-800">
                    {testimonial.name} ({testimonial.age}세)
                  </div>
                  <div className="text-orange-500">{testimonial.job}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-orange-500">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            지금 바로 시작하세요
          </h2>
          <p className="text-xl text-orange-100 mb-8">
            당신의 경험과 노하우가 필요한 곳이 있습니다
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/jobs"
              className="bg-white text-orange-500 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-100 transition"
            >
              일자리 찾기
            </Link>
            <Link
              to="/employer/post"
              className="border-2 border-white text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-orange-600 transition"
            >
              기업 회원가입
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-400 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-white">일손</span>
              </div>
              <p className="text-sm">
                시니어 노동시장 특화<br />
                위치 기반 일자리 매칭 플랫폼
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">서비스</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/jobs" className="hover:text-orange-500">일자리 찾기</Link></li>
                <li><Link to="/employer/post" className="hover:text-orange-500">인재 찾기</Link></li>
                <li><Link to="/kakao" className="hover:text-orange-500">알림 서비스</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">고객지원</h4>
              <ul className="space-y-2 text-sm">
                <li><button className="hover:text-orange-500">자주 묻는 질문</button></li>
                <li><button className="hover:text-orange-500">이용약관</button></li>
                <li><button className="hover:text-orange-500">개인정보처리방침</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">문의</h4>
              <div className="flex items-center space-x-2 text-sm">
                <Phone className="w-4 h-4" />
                <span>1588-0000</span>
              </div>
              <p className="text-sm mt-2">평일 09:00 - 18:00</p>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-sm">
            2024 일손. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Quick Navigation */}
      <nav className="fixed bottom-4 right-4 z-50">
        <div className="bg-white rounded-lg shadow-lg p-3 space-y-2">
          <Link to="/" className="block px-4 py-2 hover:bg-gray-100 rounded text-sm font-medium">홈</Link>
          <Link to="/jobs" className="block px-4 py-2 hover:bg-gray-100 rounded text-sm font-medium">일자리</Link>
          <Link to="/employer/post" className="block px-4 py-2 hover:bg-gray-100 rounded text-sm font-medium">기업등록</Link>
          <Link to="/admin/employers" className="block px-4 py-2 hover:bg-gray-100 rounded text-sm font-medium text-orange-600">관리자</Link>
        </div>
      </nav>
    </div>
  );
};

export default LandingPage;
