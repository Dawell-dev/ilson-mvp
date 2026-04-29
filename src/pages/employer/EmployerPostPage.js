import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Briefcase,
  FileText,
  Search,
  CheckCircle,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

const JOB_TYPES = ['경비', '청소', '주차관리', '시설관리', '미화', '조리', '기타'];
const WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일'];

// 섹션 카드 헬퍼
function Section({ icon: Icon, title, children }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon size={18} className="text-[#E85C1E]" />
        <h2 className="text-base font-bold text-gray-900">{title}</h2>
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </div>
  );
}

// 라벨 + 입력 wrapper
function Field({ label, required, children, hint }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
        {required && <span className="text-[#E85C1E] ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

const inputBase =
  'w-full px-3.5 py-2.5 rounded-lg text-[14px] outline-none border-[1.5px] border-[#EDE8E2] bg-white text-[#1A1A18] focus:border-[#E85C1E] transition-colors';

const textareaBase =
  'w-full px-3 py-2.5 rounded-lg text-[14px] outline-none border-[1.5px] border-[#EDE8E2] bg-white text-[#1A1A18] focus:border-[#E85C1E] resize-none transition-colors';

function EmployerPostPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [employerLoaded, setEmployerLoaded] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    jobType: '',
    customJobType: '',
    headcount: '1',
    address: '',
    detailAddress: '',
    wageType: 'hourly',
    wageAmount: '',
    workHours: '',
    workDays: [],
    description: '',
    requirements: '',
    benefits: '',
  });

  // 로그인 가드 — 세션 또는 localStorage 둘 다 없으면 login으로
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setEmployerLoaded(true);
        return;
      }
      const saved = localStorage.getItem('employer');
      if (saved) {
        setEmployerLoaded(true);
        return;
      }
      navigate('/employer/login');
    };
    checkAuth();
  }, [navigate]);

  const setField = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 급여 천단위 콤마
  const handleWageChange = (e) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    const formatted = raw ? Number(raw).toLocaleString() : '';
    setField('wageAmount', formatted);
  };

  const toggleWeekday = (day) => {
    setFormData((prev) => {
      const exists = prev.workDays.includes(day);
      const next = exists
        ? prev.workDays.filter((d) => d !== day)
        : [...prev.workDays, day];
      // 월~일 순서 유지
      next.sort((a, b) => WEEKDAYS.indexOf(a) - WEEKDAYS.indexOf(b));
      return { ...prev, workDays: next };
    });
  };

  // 카카오 우편번호 API
  const handleAddressSearch = () => {
    if (typeof window === 'undefined' || !window.daum?.Postcode) {
      alert('주소 검색 라이브러리를 불러오지 못했어요. 새로고침 후 다시 시도해주세요.');
      return;
    }
    new window.daum.Postcode({
      oncomplete: (data) => {
        setField('address', data.roadAddress || data.jibunAddress || '');
      },
    }).open();
  };

  // 공통 제출 핸들러 — status는 'open' 또는 'draft'
  const handleSubmit = async (statusValue) => {
    if (submitting) return;

    // 필수 검증 (open만)
    if (statusValue === 'open') {
      if (!formData.title || !formData.jobType || !formData.address || !formData.wageAmount) {
        alert('필수 항목을 모두 입력해주세요. (제목, 직종, 주소, 급여)');
        return;
      }
      if (formData.jobType === '기타' && !formData.customJobType) {
        alert('기타 직종을 입력해주세요.');
        return;
      }
    }

    setSubmitting(true);
    try {
      // 1. 세션/employers 확인
      const { data: { session } } = await supabase.auth.getSession();
      let employerId = null;

      if (session?.user) {
        const { data: emp } = await supabase
          .from('employers')
          .select('id')
          .eq('auth_user_id', session.user.id)
          .maybeSingle();
        employerId = emp?.id || null;
      }

      if (!employerId) {
        // localStorage 폴백
        const saved = localStorage.getItem('employer');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            employerId = parsed?.id || null;
          } catch {
            // ignore
          }
        }
      }

      if (!employerId) {
        alert('기업 정보를 찾을 수 없어요. 다시 로그인해주세요.');
        navigate('/employer/login');
        return;
      }

      // 2. payload 구성
      const finalJobType =
        formData.jobType === '기타' ? formData.customJobType : formData.jobType;
      const fullAddress = formData.detailAddress
        ? `${formData.address} ${formData.detailAddress}`.trim()
        : formData.address;

      const wageAmountNum = formData.wageAmount
        ? parseInt(formData.wageAmount.replace(/,/g, ''), 10) || null
        : null;

      const payload = {
        employer_id: employerId,
        title: formData.title || '(제목 없음)',
        job_type: finalJobType || null,
        address: fullAddress || null,
        wage_type: formData.wageType,
        wage_amount: wageAmountNum,
        // 기존 hourly_wage는 hourly일 때만 fallback으로 채움 (호환성 유지)
        hourly_wage: formData.wageType === 'hourly' ? wageAmountNum : null,
        work_hours: formData.workHours || null,
        work_days: formData.workDays.join(',') || null,
        description: formData.description || null,
        requirements: formData.requirements || null,
        benefits: formData.benefits || null,
        headcount: parseInt(formData.headcount, 10) || 1,
        status: statusValue,
      };

      // 3. insert
      const { error } = await supabase.from('jobs').insert(payload);
      if (error) throw error;

      alert(statusValue === 'open' ? '공고가 등록됐어요!' : '임시저장됐어요.');
      navigate('/employer/manage');
    } catch (e) {
      console.error('공고 저장 오류:', e);
      alert('저장 중 오류가 발생했어요: ' + (e?.message || '알 수 없음'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!employerLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F7F5F2' }}>
        <div className="text-gray-500">불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12" style={{ background: '#F7F5F2' }}>
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/employer/manage')}
            className="flex items-center gap-2 text-gray-600 active:scale-95 transition-transform"
            aria-label="뒤로가기"
          >
            <ArrowLeft size={22} />
            <span className="text-base font-medium">뒤로가기</span>
          </button>
          <h1 className="text-base md:text-lg font-bold text-gray-900">공고 등록</h1>
          <div className="w-[60px]" />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 flex flex-col gap-4">
        {/* Section 1: 기본 정보 */}
        <Section icon={Briefcase} title="기본 정보">
          <Field label="공고 제목" required>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setField('title', e.target.value.slice(0, 50))}
              placeholder="예) 아파트 경비원 모집 (주말 격일 근무)"
              maxLength={50}
              className={inputBase}
            />
            <p className="text-xs text-gray-400 mt-1">{formData.title.length}/50자</p>
          </Field>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="직종" required>
              <select
                value={formData.jobType}
                onChange={(e) => setField('jobType', e.target.value)}
                className={inputBase}
              >
                <option value="">선택</option>
                {JOB_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              {formData.jobType === '기타' && (
                <input
                  type="text"
                  value={formData.customJobType}
                  onChange={(e) => setField('customJobType', e.target.value)}
                  placeholder="직종을 직접 입력"
                  className={`${inputBase} mt-2`}
                />
              )}
            </Field>

            <Field label="채용 인원">
              <input
                type="number"
                min={1}
                value={formData.headcount}
                onChange={(e) => setField('headcount', e.target.value.replace(/[^0-9]/g, ''))}
                className={inputBase}
              />
            </Field>
          </div>
        </Section>

        {/* Section 2: 근무지 */}
        <Section icon={MapPin} title="근무지">
          <Field label="주소" required hint="검색 버튼으로만 입력할 수 있어요.">
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.address}
                readOnly
                placeholder="주소 검색을 눌러주세요"
                className={`${inputBase} flex-1 cursor-pointer bg-gray-50`}
                onClick={handleAddressSearch}
              />
              <button
                type="button"
                onClick={handleAddressSearch}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#FFF5F0] border-[1.5px] border-[#FDDCCC] text-[#E85C1E] font-medium text-sm whitespace-nowrap active:scale-95 transition-transform"
              >
                <Search size={16} />
                주소 검색
              </button>
            </div>
          </Field>

          <Field label="상세주소">
            <input
              type="text"
              value={formData.detailAddress}
              onChange={(e) => setField('detailAddress', e.target.value)}
              placeholder="예) 102동 경비실"
              className={inputBase}
            />
          </Field>
        </Section>

        {/* Section 3: 근무 조건 */}
        <Section icon={Building2} title="근무 조건">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="급여" required hint="단위를 선택하고 금액을 입력해주세요">
              {/* 단위 토글 (시급 / 일급 / 월급) */}
              <div className="flex gap-1.5 mb-2">
                {[
                  { value: 'hourly', label: '시급' },
                  { value: 'daily', label: '일급' },
                  { value: 'monthly', label: '월급' },
                ].map((opt) => {
                  const on = formData.wageType === opt.value;
                  return (
                    <button
                      type="button"
                      key={opt.value}
                      onClick={() => setField('wageType', opt.value)}
                      className="flex-1 py-2 rounded-lg text-sm font-bold border-[1.5px] active:scale-95 transition-all"
                      style={
                        on
                          ? { background: '#E85C1E', color: '#fff', borderColor: '#E85C1E' }
                          : { background: '#F7F5F2', color: '#888780', borderColor: '#EDE8E2' }
                      }
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              {/* 금액 입력 */}
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  value={formData.wageAmount}
                  onChange={handleWageChange}
                  placeholder={
                    formData.wageType === 'hourly'
                      ? '예) 10,500'
                      : formData.wageType === 'daily'
                      ? '예) 120,000'
                      : '예) 2,500,000'
                  }
                  className={`${inputBase} pr-9`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                  원
                </span>
              </div>

              {/* 비정상 입력 안내 (저장 차단 X, 안내만) */}
              {(() => {
                const num = parseInt(formData.wageAmount.replace(/,/g, ''), 10) || 0;
                if (formData.wageType === 'hourly' && num > 0 && num < 9860) {
                  return (
                    <p className="text-[12px] mt-1.5" style={{ color: '#888780' }}>
                      💡 2024 최저시급(9,860원) 미만이에요. 한 번 더 확인해주세요.
                    </p>
                  );
                }
                if (formData.wageType === 'monthly' && num > 100000000) {
                  return (
                    <p className="text-[12px] mt-1.5" style={{ color: '#888780' }}>
                      💡 금액이 너무 큰 것 같아요. 한 번 더 확인해주세요.
                    </p>
                  );
                }
                return null;
              })()}
            </Field>

            <Field label="근무 시간">
              <input
                type="text"
                value={formData.workHours}
                onChange={(e) => setField('workHours', e.target.value)}
                placeholder="예) 09:00~18:00 또는 격일 24시간"
                className={inputBase}
              />
            </Field>
          </div>

          <Field label="근무 요일" hint="여러 요일 선택 가능">
            <div className="flex gap-1.5 flex-wrap">
              {WEEKDAYS.map((day) => {
                const on = formData.workDays.includes(day);
                return (
                  <button
                    type="button"
                    key={day}
                    onClick={() => toggleWeekday(day)}
                    className="w-11 h-11 rounded-lg text-sm font-bold border-[1.5px] active:scale-95 transition-all"
                    style={
                      on
                        ? { background: '#E85C1E', color: '#fff', borderColor: '#E85C1E' }
                        : { background: '#fff', color: '#888780', borderColor: '#EDE8E2' }
                    }
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </Field>
        </Section>

        {/* Section 4: 상세 정보 */}
        <Section icon={FileText} title="상세 정보">
          <Field label="업무 내용">
            <textarea
              rows={4}
              value={formData.description}
              onChange={(e) => setField('description', e.target.value.slice(0, 500))}
              placeholder="예) 야간 경비 순찰, 출입 관리, CCTV 모니터링"
              className={textareaBase}
              maxLength={500}
            />
            <p className="text-xs text-gray-400 mt-1">{formData.description.length}/500자</p>
          </Field>

          <Field label="자격 요건">
            <textarea
              rows={3}
              value={formData.requirements}
              onChange={(e) => setField('requirements', e.target.value.slice(0, 300))}
              placeholder="예) 경비원 신임교육 이수자 우대, 60세 이상 환영"
              className={textareaBase}
              maxLength={300}
            />
            <p className="text-xs text-gray-400 mt-1">{formData.requirements.length}/300자</p>
          </Field>

          <Field label="복리후생">
            <textarea
              rows={3}
              value={formData.benefits}
              onChange={(e) => setField('benefits', e.target.value.slice(0, 300))}
              placeholder="예) 4대보험, 식대 별도, 명절 상여금"
              className={textareaBase}
              maxLength={300}
            />
            <p className="text-xs text-gray-400 mt-1">{formData.benefits.length}/300자</p>
          </Field>
        </Section>

        {/* 하단 버튼 */}
        <div className="flex gap-3 mt-2">
          <button
            type="button"
            onClick={() => handleSubmit('draft')}
            disabled={submitting}
            className="flex-1 h-12 rounded-xl border-[1.5px] border-[#EDE8E2] bg-white text-[#888780] font-bold text-sm active:scale-[0.97] transition-transform disabled:opacity-50"
          >
            {submitting ? '저장 중...' : '임시저장'}
          </button>
          <button
            type="button"
            onClick={() => handleSubmit('open')}
            disabled={submitting}
            className="flex-[2] flex items-center justify-center gap-1.5 h-12 rounded-xl bg-[#E85C1E] text-white font-bold text-sm shadow-sm active:scale-[0.97] transition-transform disabled:opacity-50"
          >
            <CheckCircle size={18} />
            {submitting ? '등록 중...' : '공고 등록하기'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default EmployerPostPage;
