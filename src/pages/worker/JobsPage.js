import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Clock, Banknote, Building2, ChevronRight } from 'lucide-react';
import { BottomNav } from '../../components/common';
import { supabase } from '../../lib/supabase';

function JobsPage() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const jobTypes = ['전체', '경비', '청소', '주차관리', '시설관리', '미화'];

  useEffect(() => {
    const loadJobs = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from('jobs')
          .select(`
            *,
            employers (
              company_name,
              contact_name
            )
          `)
          .eq('status', 'open')
          .order('created_at', { ascending: false });

        if (filter !== 'all' && filter !== '전체') {
          query = query.eq('job_type', filter);
        }

        const { data, error } = await query;
        if (error) throw error;
        setJobs(data || []);
      } catch (error) {
        console.error('Error fetching jobs:', error);
      } finally {
        setLoading(false);
      }
    };
    loadJobs();
  }, [filter]);

  // 월급 계산 (시급 * 주당근무시간 * 4.345주)
  const formatMonthlyWage = (hourlyWage, workDays) => {
    if (!hourlyWage) return '협의';
    // 대략적인 월급 계산: 시급 * 6시간 * 주6일 * 4.345주
    const weeklyHours = workDays === '주6일' ? 36 : 40;
    const monthlyWage = Math.round(hourlyWage * weeklyHours * 4.345);
    return `${monthlyWage.toLocaleString()}원`;
  };

  // 근무시간 포맷팅 (평일/토요일/일요일 구분 + 총 시간)
  const formatWorkSchedule = (workHours, workDays) => {
    if (!workHours) return '협의';

    // work_hours에서 평일/토요일 시간 파싱
    const parts = workHours.split(',');
    let weekday = '';
    let saturday = '';
    let weekdayHours = 6; // 기본값
    let saturdayHours = 0;

    if (parts.length >= 1) {
      weekday = parts[0].trim();
      // 시간 추출 (예: "08:30-15:30" -> 6시간)
      const timeMatch = weekday.match(/(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})/);
      if (timeMatch) {
        const startHour = parseInt(timeMatch[1]) + parseInt(timeMatch[2]) / 60;
        const endHour = parseInt(timeMatch[3]) + parseInt(timeMatch[4]) / 60;
        weekdayHours = Math.round(endHour - startHour - 1); // 휴게시간 1시간 제외
      }
    }
    if (parts.length >= 2) {
      saturday = parts[1].trim();
      // 토요일 시간 추출
      const satMatch = saturday.match(/(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})/);
      if (satMatch) {
        const startHour = parseInt(satMatch[1]) + parseInt(satMatch[2]) / 60;
        const endHour = parseInt(satMatch[3]) + parseInt(satMatch[4]) / 60;
        saturdayHours = Math.round(endHour - startHour);
      }
    }

    // 포맷팅
    let schedule = '';
    if (saturday) {
      const weekdayTime = weekday.match(/\d{1,2}:\d{2}-\d{1,2}:\d{2}/)?.[0] || weekday;
      const satTime = saturday.match(/\d{1,2}:\d{2}/g)?.join('-') || saturday;
      schedule = `평일 ${weekdayTime} (${weekdayHours}시간)`;
      schedule += ` / 토 ${satTime} (${saturdayHours}시간)`;
    } else {
      schedule = weekday;
    }
    schedule += ' / 일 휴무';

    return schedule;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diff === 0) return '오늘';
    if (diff === 1) return '어제';
    if (diff < 7) return `${diff}일 전`;
    return date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-28">
      {/* 헤더 - 더 크고 명확하게 */}
      <div className="bg-orange-500 px-6 py-8">
        <h1 className="text-4xl font-bold text-white">일자리 찾기</h1>
        <p className="text-xl text-orange-100 mt-2">내 근처 일자리를 찾아보세요</p>
      </div>

      {/* 필터 - 버튼 크게 */}
      <div className="bg-white px-4 py-5 border-b-2 border-gray-200 overflow-x-auto">
        <div className="flex gap-3 min-w-max">
          {jobTypes.map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type === '전체' ? 'all' : type)}
              className={`px-6 py-4 rounded-full text-xl font-bold whitespace-nowrap transition-all ${
                (filter === 'all' && type === '전체') || filter === type
                  ? 'bg-orange-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 border-2 border-gray-300'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* 일자리 목록 */}
      <div className="px-4 py-5">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mb-6"></div>
            <p className="text-2xl text-gray-600">일자리를 불러오는 중...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-2xl text-gray-500">등록된 일자리가 없습니다</p>
          </div>
        ) : (
          <div className="space-y-5">
            {jobs.map((job) => (
              <div
                key={job.id}
                onClick={() => navigate(`/jobs/${job.id}`)}
                className="bg-white rounded-3xl p-6 shadow-md border-2 border-gray-200 cursor-pointer active:bg-gray-50 transition-all"
              >
                {/* 직종 태그 - 크게 */}
                <span className="inline-block bg-orange-100 text-orange-600 text-xl font-bold px-4 py-2 rounded-full mb-4">
                  {job.job_type}
                </span>

                {/* 제목 - 매우 크게 */}
                <h3 className="text-2xl font-bold text-gray-900 mb-4 leading-tight">
                  {job.title}
                </h3>

                {/* 급여 - 월급으로 표시 */}
                <div className="bg-green-50 rounded-2xl p-4 mb-4">
                  <div className="flex items-center gap-3">
                    <Banknote size={32} className="text-green-600" />
                    <div>
                      <p className="text-lg text-green-700">월급</p>
                      <p className="text-3xl font-bold text-green-600">
                        {formatMonthlyWage(job.hourly_wage, job.work_days)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 회사명 */}
                <div className="flex items-center gap-3 text-gray-700 mb-3">
                  <Building2 size={28} className="text-gray-500" />
                  <span className="text-xl font-medium">{job.employers?.company_name}</span>
                </div>

                {/* 위치 */}
                <div className="flex items-center gap-3 text-gray-700 mb-3">
                  <MapPin size={28} className="text-red-500" />
                  <span className="text-xl">{job.address}</span>
                </div>

                {/* 근무시간 - 평일/토/일 구분 */}
                <div className="flex items-start gap-3 text-gray-700 mb-4">
                  <Clock size={28} className="text-blue-500 mt-1" />
                  <span className="text-xl">{formatWorkSchedule(job.work_hours, job.work_days)}</span>
                </div>

                {/* 하단 - 날짜 & 화살표 */}
                <div className="flex justify-between items-center pt-4 border-t-2 border-gray-100">
                  <span className="text-lg text-gray-400">
                    {formatDate(job.created_at)}
                  </span>
                  <div className="flex items-center gap-2 text-orange-500 font-bold text-xl">
                    자세히 보기
                    <ChevronRight size={28} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

export default JobsPage;
