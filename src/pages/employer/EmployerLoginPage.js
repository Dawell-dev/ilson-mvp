import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Building2, CheckCircle } from 'lucide-react';
import { Button, Input } from '../../components/common';
import { supabase } from '../../lib/supabase';

function EmployerLoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // 가입 직후 진입 여부 + 가입한 이메일 추출
  const justSignedUp = searchParams.get('signup') === 'success';
  const presetEmail = searchParams.get('email') || '';

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: presetEmail, password: '' });
  const [error, setError] = useState('');
  // 진단 패치 — 로그인 hang 원인 추적용 (안정화 후 제거 예정)
  const [diagStep, setDiagStep] = useState('');
  const [diagError, setDiagError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError('');
  };

  const handleSubmit = async () => {
    if (!formData.email || !formData.password) {
      setError('이메일과 비밀번호를 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');
    setDiagError(null);
    setDiagStep('1/3 로그인 요청 중...');

    // signInWithPassword도 signUp과 동일한 supabase-js hang 위험이 있어
    // 5초 타임아웃 + getSession() 폴백으로 안전망 구축
    const SIGN_IN_TIMEOUT_MS = 5000;
    let authUserId = null;

    try {
      // Step A: signInWithPassword (5초 타임아웃)
      try {
        const result = await Promise.race([
          supabase.auth.signInWithPassword({
            email: formData.email,
            password: formData.password,
          }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('SIGNIN_TIMEOUT')), SIGN_IN_TIMEOUT_MS)
          ),
        ]);

        if (result?.error) {
          setError('이메일 또는 비밀번호가 올바르지 않아요.');
          setDiagError({
            stage: 'signIn',
            message: result.error.message || '(없음)',
            status: result.error.status ?? '(없음)',
          });
          return;
        }

        authUserId = result?.data?.user?.id || null;
        if (authUserId) {
          setDiagStep('2/3 세션 확보 완료');
        }
      } catch (e) {
        if (e?.message === 'SIGNIN_TIMEOUT') {
          setDiagStep('1/3 응답 지연 — 세션 확인 중...');
        } else {
          setError('로그인 중 오류가 발생했어요.');
          setDiagError({
            stage: 'signInException',
            message: e?.message || '(없음)',
            name: e?.name || '(없음)',
          });
          return;
        }
      }

      // Step B: 타임아웃이면 getSession 폴백 — 응답이 hang됐어도
      // supabase-js 내부에 세션이 저장돼 있을 가능성
      if (!authUserId) {
        const { data: sessionData } = await supabase.auth.getSession();
        authUserId = sessionData?.session?.user?.id || null;
        if (authUserId) {
          setDiagStep('2/3 세션 복원 완료 (폴백)');
        } else {
          setError('로그인이 완료되지 않았어요. 잠시 후 다시 시도해주세요.');
          setDiagError({
            stage: 'getSession',
            message: 'signIn hang 추정 — 세션도 미저장',
          });
          return;
        }
      }

      // Step C: employers 조회
      setDiagStep('3/3 기업 정보 조회 중...');
      const { data: employer, error: empError } = await supabase
        .from('employers')
        .select('*')
        .eq('auth_user_id', authUserId)
        .maybeSingle();

      if (empError) {
        setError('계정 정보를 불러오는 중 오류가 발생했어요.');
        setDiagError({
          stage: 'fetchEmployer',
          message: empError.message || '(없음)',
          code: empError.code || '(없음)',
          hint: empError.hint || '(없음)',
          details: empError.details || '(없음)',
        });
        return;
      }

      if (!employer) {
        setError('가입된 기업 정보가 없어요. 회원가입부터 진행해주세요.');
        setDiagStep('❌ employers 레코드 없음 (auth는 OK)');
        return;
      }

      setDiagStep('✅ 로그인 완료 — 이동');
      localStorage.setItem('employer', JSON.stringify(employer));
      navigate('/employer/manage');
    } catch (e) {
      setError('로그인 중 오류가 발생했어요.');
      if (!diagError) {
        setDiagError({
          stage: 'final',
          message: e?.message || '(없음)',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white px-4 py-4 border-b border-gray-200">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-600 text-lg"
        >
          <ArrowLeft size={24} />
          <span>뒤로가기</span>
        </button>
      </div>

      <div className="px-6 py-12">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
            <Building2 className="text-orange-600" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">기업 로그인</h1>
            <p className="text-gray-500">공고 관리 페이지로 이동합니다</p>
          </div>
        </div>

        {/* 가입 직후 진입 시 안내 배너 */}
        {justSignedUp && (
          <div
            className="flex items-start gap-2 p-4 mb-6 rounded-xl"
            style={{ background: '#E8F5E9', border: '1.5px solid #66BB6A' }}
          >
            <CheckCircle size={20} className="flex-shrink-0 mt-0.5" style={{ color: '#2E7D32' }} />
            <div className="text-sm font-medium" style={{ color: '#1B5E20' }}>
              가입이 완료됐어요! 방금 만든 비밀번호로 로그인해주세요.
            </div>
          </div>
        )}

        <div className="space-y-5">
          <Input
            label="이메일"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="hire@company.com"
            required
          />
          <Input
            label="비밀번호"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="비밀번호"
            required
          />
          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-3 text-red-600">
              {error}
            </div>
          )}
        </div>

        <div className="mt-8 space-y-4">
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? '로그인 중...' : '로그인'}
          </Button>

          <p className="text-center text-gray-500 text-sm">
            아직 계정이 없으신가요?{' '}
            <button
              onClick={() => navigate('/employer/signup')}
              className="text-orange-500 font-medium underline"
            >
              회원가입
            </button>
          </p>

          {/* 진단 패널 — 로그인 hang 원인 추적용. 안정화 후 제거 예정. */}
          {(diagStep || diagError) && (
            <div className="mt-4 p-4 rounded-xl bg-blue-50 border-2 border-blue-200">
              <div className="text-sm font-bold text-blue-700 mb-2">🔍 진단</div>
              {diagStep && (
                <div className="text-sm text-blue-700 mb-2 break-all">
                  <span className="font-medium">현재 단계: </span>
                  {diagStep}
                </div>
              )}
              {diagError && (
                <div className="text-xs text-red-700 bg-red-50 rounded-lg p-2 mt-2 space-y-1 break-all">
                  <div>
                    <span className="font-bold">❌ stage:</span> {diagError.stage}
                  </div>
                  <div>
                    <span className="font-bold">message:</span> {diagError.message}
                  </div>
                  {diagError.code && (
                    <div>
                      <span className="font-bold">code:</span> {diagError.code}
                    </div>
                  )}
                  {diagError.status !== undefined && (
                    <div>
                      <span className="font-bold">status:</span> {diagError.status}
                    </div>
                  )}
                  {diagError.hint && (
                    <div>
                      <span className="font-bold">hint:</span> {diagError.hint}
                    </div>
                  )}
                  {diagError.details && (
                    <div>
                      <span className="font-bold">details:</span> {diagError.details}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EmployerLoginPage;
