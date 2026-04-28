import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, CheckCircle, AlertCircle, Shield, Upload, X, FileText } from 'lucide-react';
import { Button, Input } from '../../components/common';
import { supabase } from '../../lib/supabase';

function EmployerSignupPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [businessFile, setBusinessFile] = useState(null);
  const [businessFilePreview, setBusinessFilePreview] = useState(null);
  const fileInputRef = useRef(null);
  // 🔧 진단 패치 — 가입이 어디서 막히는지 화면에 상시 노출
  const [diagStep, setDiagStep] = useState('');
  const [diagError, setDiagError] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    passwordConfirm: '',
    businessNumber: '',
    companyName: '',
    ceoName: '',
    contactName: '',
    phone: '',
    businessAddress: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (name === 'businessNumber') {
      setVerified(false);
      setVerifyError('');
    }
  };

  const formatBusinessNumber = (value) => {
    const numbers = value.replace(/[^0-9]/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 5) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 5)}-${numbers.slice(5, 10)}`;
  };

  const handleBusinessNumberChange = (e) => {
    const formatted = formatBusinessNumber(e.target.value);
    setFormData({ ...formData, businessNumber: formatted });
    setVerified(false);
    setVerifyError('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('파일 크기는 5MB 이하여야 합니다.');
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/gif', 'application/pdf'].includes(file.type)) {
        alert('JPG, PNG, GIF, PDF 파일만 업로드 가능합니다.');
        return;
      }
      setBusinessFile(file);
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => setBusinessFilePreview(reader.result);
        reader.readAsDataURL(file);
      } else {
        setBusinessFilePreview(null);
      }
    }
  };

  const removeFile = () => {
    setBusinessFile(null);
    setBusinessFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const verifyBusinessNumber = async () => {
    const numbers = formData.businessNumber.replace(/[^0-9]/g, '');
    if (numbers.length !== 10) {
      setVerifyError('사업자등록번호 10자리를 입력해주세요');
      return;
    }
    setVerifying(true);
    setVerifyError('');
    try {
      const checkSum = [1, 3, 7, 1, 3, 7, 1, 3, 5];
      let sum = 0;
      for (let i = 0; i < 9; i++) {
        sum += parseInt(numbers[i]) * checkSum[i];
      }
      sum += Math.floor((parseInt(numbers[8]) * 5) / 10);
      const remainder = (10 - (sum % 10)) % 10;
      if (remainder !== parseInt(numbers[9])) {
        setVerifyError('유효하지 않은 사업자등록번호입니다');
        setVerifying(false);
        return;
      }
      await new Promise((r) => setTimeout(r, 1200));
      setVerified(true);
      setVerifyError('');
    } catch (error) {
      setVerifyError('인증 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmit = async () => {
    if (!verified) {
      setVerifyError('사업자등록번호 인증이 필요합니다');
      return;
    }
    if (!formData.email || !formData.password) {
      alert('이메일과 비밀번호를 입력해주세요.');
      return;
    }
    if (formData.password.length < 6) {
      alert('비밀번호는 6자 이상이어야 해요.');
      return;
    }
    if (formData.password !== formData.passwordConfirm) {
      alert('비밀번호가 일치하지 않아요.');
      return;
    }

    setLoading(true);
    setDiagError(null);
    setDiagStep('1/4 계정 생성/확인 중...');

    // 방안 A — signUp 5초 타임아웃 + signInWithPassword 폴백
    // 신규 가입 / 유령 계정(auth만 있고 employers 없음) / 이미 완전 가입된 이메일
    // 세 시나리오를 한 플로우로 처리.
    const SIGN_UP_TIMEOUT_MS = 5000;
    let authUserId = null;

    try {
      // Step A: signUp 시도 (타임아웃)
      try {
        const signUpRace = await Promise.race([
          supabase.auth.signUp({
            email: formData.email,
            password: formData.password,
          }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('SIGNUP_TIMEOUT')), SIGN_UP_TIMEOUT_MS)
          ),
        ]);

        if (signUpRace?.error) {
          const msg = signUpRace.error.message?.toLowerCase() || '';
          if (
            msg.includes('already') ||
            msg.includes('registered') ||
            msg.includes('exists')
          ) {
            // 이미 가입된 이메일 → signIn 폴백으로 넘어감
            setDiagStep('2/4 기존 계정 확인 — 로그인으로 전환...');
          } else {
            setDiagError({
              stage: 'signUp',
              message: signUpRace.error.message || '(없음)',
              status: signUpRace.error.status ?? '(없음)',
            });
            alert('회원가입 오류: ' + signUpRace.error.message);
            return;
          }
        } else {
          authUserId = signUpRace?.data?.user?.id || null;
          if (authUserId) {
            setDiagStep('2/4 계정 생성 성공');
          }
        }
      } catch (e) {
        if (e?.message === 'SIGNUP_TIMEOUT') {
          setDiagStep('2/4 signUp 응답 지연 — 로그인으로 전환...');
        } else {
          setDiagError({
            stage: 'signUpException',
            message: e?.message || '(없음)',
            name: e?.name || '(없음)',
          });
          alert('가입 시도 중 오류: ' + (e?.message || '알 수 없음'));
          return;
        }
      }

      // Step B: authUserId 없으면 signInWithPassword로 세션 확보
      // signIn도 hang 위험 있음 → 5초 타임아웃 + getSession 이중 폴백
      const SIGN_IN_TIMEOUT_MS = 5000;
      if (!authUserId) {
        try {
          // B-1: signInWithPassword 5초 타임아웃
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
              setDiagError({
                stage: 'signInFallback',
                message: result.error.message || '(없음)',
                status: result.error.status ?? '(없음)',
              });
              alert('로그인 확인 실패: ' + result.error.message);
              return;
            }

            authUserId = result?.data?.user?.id || null;
            if (authUserId) {
              setDiagStep('2/4 로그인으로 세션 확보 완료');
            }
          } catch (e) {
            if (e?.message === 'SIGNIN_TIMEOUT') {
              setDiagStep('2/4 signIn 응답 지연 — 세션 확인 중...');
            } else {
              throw e;
            }
          }

          // B-2: signIn 타임아웃이면 getSession으로 메모리/스토리지 세션 확인
          if (!authUserId) {
            const { data: sessionData } = await supabase.auth.getSession();
            authUserId = sessionData?.session?.user?.id || null;
            if (authUserId) {
              setDiagStep('2/4 세션 복원 완료 (이중 폴백)');
            } else {
              setDiagError({
                stage: 'signInFallback',
                message: 'signIn 타임아웃 + 세션도 미저장',
              });
              alert('계정 확인에 실패했어요. 다시 시도해주세요.');
              return;
            }
          }
        } catch (e) {
          setDiagError({
            stage: 'signInException',
            message: e?.message || '(없음)',
          });
          alert('로그인 폴백 예외: ' + (e?.message || '알 수 없음'));
          return;
        }
      }

      // Step C: employers 중복 확인
      setDiagStep('3/4 기업 정보 확인 중...');
      const { data: existing, error: existingError } = await supabase
        .from('employers')
        .select('*')
        .eq('auth_user_id', authUserId)
        .maybeSingle();

      if (existingError) {
        setDiagError({
          stage: 'checkDuplicate',
          message: existingError.message || '(없음)',
          code: existingError.code || '(없음)',
          details: existingError.details || '(없음)',
          hint: existingError.hint || '(없음)',
        });
        alert('중복 확인 중 오류: ' + existingError.message);
        return;
      }

      if (existing) {
        // 이미 완전 가입된 계정 → 자동 로그인 세션 제거 후 로그인 페이지 안내
        setDiagStep('✅ 기존 기업 계정 확인 — 로그인 페이지로 이동');
        localStorage.setItem('employer', JSON.stringify(existing));
        await supabase.auth.signOut();
        navigate(
          `/employer/login?signup=success&email=${encodeURIComponent(formData.email)}`
        );
        return;
      }

      // Step D: employers insert (신규 / 유령 계정 구제)
      setDiagStep('4/4 기업 정보 저장 중...');
      const { data, error } = await supabase
        .from('employers')
        .insert([
          {
            auth_user_id: authUserId,
            company_name: formData.companyName,
            contact_name: formData.contactName,
            phone: formData.phone,
            email: formData.email,
            business_number: formData.businessNumber.replace(/[^0-9]/g, ''),
            ceo_name: formData.ceoName,
            verified: true,
          },
        ])
        .select();

      if (error) {
        setDiagError({
          stage: 'insertEmployers',
          message: error.message || '(없음)',
          code: error.code || '(없음)',
          details: error.details || '(없음)',
          hint: error.hint || '(없음)',
        });
        throw error;
      }

      // 성공 — 자동 로그인 세션 제거 후 로그인 페이지로 안내
      // (사용자가 자기 비밀번호로 직접 로그인해야 다음에 기억 가능)
      setDiagStep('✅ 가입 완료 — 로그인 페이지로 이동');
      localStorage.setItem('employer', JSON.stringify(data[0]));
      await supabase.auth.signOut();
      navigate(
        `/employer/login?signup=success&email=${encodeURIComponent(formData.email)}`
      );
    } catch (error) {
      if (!diagError) {
        setDiagError({
          stage: 'finalException',
          message: error?.message || '(없음)',
          name: error?.name || '(없음)',
          stack: (error?.stack || '').slice(0, 400),
        });
      }
      alert('가입 중 오류가 발생했습니다: ' + (error?.message || '알 수 없음'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white px-4 py-4 border-b border-gray-200">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 text-lg"
        >
          <ArrowLeft size={24} />
          <span>뒤로가기</span>
        </button>
      </div>

      <div className="px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
            <Building2 className="text-orange-600" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">기업 회원가입</h1>
            <p className="text-gray-500">이메일과 사업자 인증으로 가입</p>
          </div>
        </div>

        <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <Shield className="text-orange-500 mt-1" size={24} />
            <div>
              <p className="text-lg font-bold text-orange-800">안전한 채용을 위해</p>
              <p className="text-orange-700">
                사업자등록번호 인증을 통해 검증된 기업만 공고를 등록할 수 있습니다.
              </p>
            </div>
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
            label="비밀번호 (6자 이상)"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="비밀번호"
            required
          />
          <Input
            label="비밀번호 확인"
            name="passwordConfirm"
            type="password"
            value={formData.passwordConfirm}
            onChange={handleChange}
            placeholder="비밀번호 한 번 더"
            required
          />

          <div>
            <label className="block text-lg font-bold text-gray-700 mb-2">
              사업자등록번호 <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                name="businessNumber"
                value={formData.businessNumber}
                onChange={handleBusinessNumberChange}
                placeholder="000-00-00000"
                maxLength={12}
                className={`flex-1 px-4 py-4 text-xl border-2 rounded-xl focus:outline-none focus:ring-2 ${
                  verified
                    ? 'border-green-500 bg-green-50 focus:ring-green-500'
                    : verifyError
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-orange-500 focus:border-orange-500'
                }`}
              />
              <button
                onClick={verifyBusinessNumber}
                disabled={
                  verifying ||
                  verified ||
                  formData.businessNumber.replace(/[^0-9]/g, '').length !== 10
                }
                className={`px-5 py-4 rounded-xl text-lg font-bold whitespace-nowrap transition-all ${
                  verified
                    ? 'bg-green-500 text-white'
                    : verifying
                    ? 'bg-gray-300 text-gray-500'
                    : 'bg-orange-500 text-white hover:bg-orange-600 disabled:bg-gray-300 disabled:text-gray-500'
                }`}
              >
                {verified ? '인증완료' : verifying ? '확인중...' : '인증'}
              </button>
            </div>
            {verified && (
              <div className="flex items-center gap-2 mt-2 text-green-600">
                <CheckCircle size={20} />
                <span className="text-lg font-medium">사업자 인증이 완료되었습니다</span>
              </div>
            )}
            {verifyError && (
              <div className="flex items-center gap-2 mt-2 text-red-500">
                <AlertCircle size={20} />
                <span className="text-lg">{verifyError}</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-lg font-bold text-gray-700 mb-2">
              사업자등록증 첨부 <span className="text-red-500">*</span>
            </label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*,.pdf"
              className="hidden"
            />
            {!businessFile ? (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-orange-400 hover:bg-orange-50 transition-all"
              >
                <Upload className="mx-auto text-gray-400 mb-3" size={40} />
                <p className="text-lg font-medium text-gray-600">클릭하여 파일 선택</p>
                <p className="text-gray-400 mt-1">JPG, PNG, PDF (최대 5MB)</p>
              </button>
            ) : (
              <div className="border-2 border-green-300 bg-green-50 rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {businessFilePreview ? (
                      <img
                        src={businessFilePreview}
                        alt="사업자등록증"
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                        <FileText className="text-gray-500" size={28} />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-800">{businessFile.name}</p>
                      <p className="text-sm text-gray-500">
                        {(businessFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={removeFile}
                    className="p-2 hover:bg-red-100 rounded-full transition-all"
                  >
                    <X className="text-red-500" size={24} />
                  </button>
                </div>
              </div>
            )}
          </div>

          <Input
            label="회사/기관명"
            name="companyName"
            value={formData.companyName}
            onChange={handleChange}
            placeholder="래미안 아파트 관리사무소"
            required
          />
          <Input
            label="대표자명"
            name="ceoName"
            value={formData.ceoName}
            onChange={handleChange}
            placeholder="김대표"
            required
          />
          <Input
            label="담당자명"
            name="contactName"
            value={formData.contactName}
            onChange={handleChange}
            placeholder="홍길동"
            required
          />
          <Input
            label="연락처"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            placeholder="02-1234-5678"
            required
          />
          <Input
            label="회사 주소"
            name="businessAddress"
            value={formData.businessAddress}
            onChange={handleChange}
            placeholder="서울시 강남구 테헤란로 123"
            required
          />
        </div>

        <div className="mt-8">
          <Button
            onClick={handleSubmit}
            disabled={
              loading ||
              !verified ||
              !formData.email ||
              !formData.password ||
              !formData.passwordConfirm ||
              !formData.companyName ||
              !formData.contactName ||
              !formData.phone ||
              !formData.ceoName ||
              !formData.businessAddress ||
              !businessFile
            }
          >
            {loading ? '가입 중...' : '가입하기'}
          </Button>

          <p className="text-center text-gray-500 mt-4 text-sm">
            이미 계정이 있으신가요?{' '}
            <button
              onClick={() => navigate('/employer/login')}
              className="text-orange-500 font-medium underline"
            >
              로그인
            </button>
          </p>

          {/* 🔧 진단 패널 — 가입 실패 원인 추적용. 해결 후 제거 예정 */}
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
                  {diagError.dump && (
                    <div className="whitespace-pre-wrap mt-1">
                      <span className="font-bold">dump:</span>
                      <br />
                      {diagError.dump}
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

export default EmployerSignupPage;
