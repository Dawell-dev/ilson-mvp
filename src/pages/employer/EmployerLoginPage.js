import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2 } from 'lucide-react';
import { Button, Input } from '../../components/common';
import { supabase } from '../../lib/supabase';

function EmployerLoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
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
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (authError) {
        setError('이메일 또는 비밀번호가 올바르지 않아요.');
        return;
      }

      const authUserId = authData?.user?.id;
      if (!authUserId) {
        setError('로그인에 실패했어요.');
        return;
      }

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
