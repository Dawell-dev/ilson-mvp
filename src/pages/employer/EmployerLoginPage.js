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

    // signInWithPassword hang 안전망 — 5초 타임아웃 + getSession 폴백
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
          return;
        }

        authUserId = result?.data?.user?.id || null;
      } catch (e) {
        if (e?.message !== 'SIGNIN_TIMEOUT') {
          setError('로그인 중 오류가 발생했어요.');
          return;
        }
        // 타임아웃이면 다음 단계(getSession)로 진행
      }

      // Step B: 타임아웃 시 getSession 폴백
      if (!authUserId) {
        const { data: sessionData } = await supabase.auth.getSession();
        authUserId = sessionData?.session?.user?.id || null;
        if (!authUserId) {
          setError('로그인이 완료되지 않았어요. 잠시 후 다시 시도해주세요.');
          return;
        }
      }

      // Step C: employers 조회
      const { data: employer, error: empError } = await supabase
        .from('employers')
        .select('*')
        .eq('auth_user_id', authUserId)
        .maybeSingle();

      if (empError) {
        setError('계정 정보를 불러오는 중 오류가 발생했어요.');
        return;
      }

      if (!employer) {
        setError('가입된 기업 정보가 없어요. 회원가입부터 진행해주세요.');
        return;
      }

      localStorage.setItem('employer', JSON.stringify(employer));
      navigate('/employer/manage');
    } catch (e) {
      setError('로그인 중 오류가 발생했어요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: '#F7F5F2' }}>
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-600 text-lg"
          >
            <ArrowLeft size={24} />
            <span>뒤로가기</span>
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 md:px-6 py-12">
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
        </div>
      </div>
    </div>
  );
}

export default EmployerLoginPage;
