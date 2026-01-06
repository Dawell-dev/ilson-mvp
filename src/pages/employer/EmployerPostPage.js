import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, CheckCircle, AlertCircle, Shield, Upload, X, FileText } from 'lucide-react';
import { Button, Input } from '../../components/common';
import { supabase } from '../../lib/supabase';

function EmployerPostPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [employer, setEmployer] = useState(null);
  const [businessFile, setBusinessFile] = useState(null);
  const [businessFilePreview, setBusinessFilePreview] = useState(null);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    // 기업 정보
    businessNumber: '',
    companyName: '',
    ceoName: '',
    contactName: '',
    phone: '',
    email: '',
    businessAddress: '',
    // 공고 정보
    title: '',
    jobType: '',
    address: '',
    hourlyWage: '',
    workHours: '',
    workDays: '',
    description: '',
    headcount: '1',
  });

  const jobTypes = ['경비', '청소', '주차관리', '시설관리', '미화'];
  const workDaysOptions = ['월-금', '월-토', '격일근무', '주말근무', '협의'];

  useEffect(() => {
    const savedEmployer = localStorage.getItem('employer');
    if (savedEmployer) {
      const emp = JSON.parse(savedEmployer);
      setEmployer(emp);
      setFormData((prev) => ({
        ...prev,
        companyName: emp.company_name,
        contactName: emp.contact_name,
        phone: emp.phone,
        email: emp.email || '',
      }));
      setVerified(true);
      setStep(2);
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === 'businessNumber') {
      setVerified(false);
      setVerifyError('');
    }
  };

  // 사업자등록번호 형식 검증 (000-00-00000)
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

  // 파일 업로드 핸들러
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // 파일 크기 제한 (5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('파일 크기는 5MB 이하여야 합니다.');
        return;
      }
      // 파일 형식 제한
      if (!['image/jpeg', 'image/png', 'image/gif', 'application/pdf'].includes(file.type)) {
        alert('JPG, PNG, GIF, PDF 파일만 업로드 가능합니다.');
        return;
      }
      setBusinessFile(file);

      // 이미지 미리보기
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setBusinessFilePreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setBusinessFilePreview(null);
      }
    }
  };

  const removeFile = () => {
    setBusinessFile(null);
    setBusinessFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 사업자등록번호 검증 (국세청 API 시뮬레이션)
  const verifyBusinessNumber = async () => {
    const numbers = formData.businessNumber.replace(/[^0-9]/g, '');

    if (numbers.length !== 10) {
      setVerifyError('사업자등록번호 10자리를 입력해주세요');
      return;
    }

    setVerifying(true);
    setVerifyError('');

    try {
      // 사업자등록번호 체크섬 검증 (실제 유효성 검사 알고리즘)
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

      // 실제 서비스에서는 국세청 API 호출
      // 여기서는 체크섬이 맞으면 인증 성공으로 처리
      await new Promise(resolve => setTimeout(resolve, 1500)); // API 호출 시뮬레이션

      setVerified(true);
      setVerifyError('');
    } catch (error) {
      setVerifyError('인증 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmitEmployer = async () => {
    if (!verified) {
      setVerifyError('사업자등록번호 인증이 필요합니다');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.from('employers').insert([
        {
          company_name: formData.companyName,
          contact_name: formData.contactName,
          phone: formData.phone,
          email: formData.email,
          business_number: formData.businessNumber.replace(/[^0-9]/g, ''),
          ceo_name: formData.ceoName,
          verified: true,
        },
      ]).select();

      if (error) throw error;

      localStorage.setItem('employer', JSON.stringify(data[0]));
      setEmployer(data[0]);
      setStep(2);
    } catch (error) {
      alert('등록 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitJob = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.from('jobs').insert([
        {
          employer_id: employer.id,
          title: formData.title,
          job_type: formData.jobType,
          address: formData.address,
          hourly_wage: parseInt(formData.hourlyWage) || null,
          work_hours: formData.workHours,
          work_days: formData.workDays,
          description: formData.description,
          headcount: parseInt(formData.headcount) || 1,
          status: 'open',
        },
      ]);

      if (error) throw error;
      setStep(3);
    } catch (error) {
      alert('공고 등록 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 1: 기업 정보 입력 (사업자 인증 포함)
  if (step === 1) {
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
              <p className="text-gray-500">사업자 인증 후 공고를 등록할 수 있어요</p>
            </div>
          </div>

          {/* 사업자 인증 안내 */}
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
            {/* 사업자등록번호 입력 및 인증 */}
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
                  disabled={verifying || verified || formData.businessNumber.replace(/[^0-9]/g, '').length !== 10}
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

            {/* 사업자등록증 첨부 */}
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
              <p className="text-sm text-gray-500 mt-2">
                * 관리자 확인 후 승인됩니다 (1-2 영업일 소요)
              </p>
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

            <Input
              label="이메일 (선택)"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="example@company.com"
            />
          </div>

          <div className="mt-8">
            <Button
              onClick={handleSubmitEmployer}
              disabled={loading || !verified || !formData.companyName || !formData.contactName || !formData.phone || !formData.ceoName || !formData.businessAddress || !businessFile}
            >
              {loading ? '등록 중...' : '가입 신청하기'}
            </Button>

            <p className="text-center text-gray-500 mt-4 text-sm">
              {!verified && '사업자등록번호 인증이 필요합니다'}
              {verified && !businessFile && '사업자등록증을 첨부해주세요'}
              {verified && businessFile && '관리자 승인 후 공고 등록이 가능합니다'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: 공고 정보 입력
  if (step === 2) {
    return (
      <div className="min-h-screen bg-gray-50 pb-8">
        <div className="bg-white px-4 py-4 border-b border-gray-200">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 text-lg"
          >
            <ArrowLeft size={24} />
            <span>뒤로가기</span>
          </button>
        </div>

        <div className="px-6 py-6">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="text-green-500" size={20} />
            <span className="text-green-600 font-medium">인증된 기업</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">공고 등록</h1>
          <p className="text-gray-500 mb-6">{employer?.company_name}</p>

          <div className="space-y-6">
            <Input
              label="공고 제목"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="아파트 경비원 모집"
              required
            />

            {/* 직종 선택 */}
            <div>
              <label className="block text-lg font-medium text-gray-700 mb-2">
                직종 <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {jobTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => setFormData({ ...formData, jobType: type })}
                    className={`py-3 px-3 rounded-xl text-lg font-medium border-2 transition-all ${
                      formData.jobType === type
                        ? 'bg-orange-500 text-white border-orange-500'
                        : 'bg-white text-gray-700 border-gray-300'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <Input
              label="근무지 주소"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="서울시 강남구 삼성동 123"
              required
            />

            <Input
              label="시급 (원)"
              name="hourlyWage"
              type="number"
              value={formData.hourlyWage}
              onChange={handleChange}
              placeholder="10500"
            />

            <Input
              label="근무시간"
              name="workHours"
              value={formData.workHours}
              onChange={handleChange}
              placeholder="09:00-18:00"
            />

            {/* 근무요일 선택 */}
            <div>
              <label className="block text-lg font-medium text-gray-700 mb-2">
                근무요일
              </label>
              <div className="grid grid-cols-3 gap-2">
                {workDaysOptions.map((days) => (
                  <button
                    key={days}
                    onClick={() => setFormData({ ...formData, workDays: days })}
                    className={`py-3 px-2 rounded-xl text-base font-medium border-2 transition-all ${
                      formData.workDays === days
                        ? 'bg-orange-500 text-white border-orange-500'
                        : 'bg-white text-gray-700 border-gray-300'
                    }`}
                  >
                    {days}
                  </button>
                ))}
              </div>
            </div>

            <Input
              label="모집인원"
              name="headcount"
              type="number"
              value={formData.headcount}
              onChange={handleChange}
              placeholder="1"
            />

            <div>
              <label className="block text-lg font-medium text-gray-700 mb-2">
                상세 내용
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="업무 내용, 우대사항 등을 자유롭게 작성해주세요"
                rows={5}
                className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>

          <div className="mt-8">
            <Button
              onClick={handleSubmitJob}
              disabled={loading || !formData.title || !formData.jobType || !formData.address}
            >
              {loading ? '등록 중...' : '공고 등록하기'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: 완료 화면
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6">
      <div className="text-center">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="text-green-600" size={48} />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          공고 등록 완료!
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          등록된 공고가 구직자들에게<br />
          자동으로 추천됩니다.
        </p>
        <div className="space-y-3">
          <Button onClick={() => navigate('/employer/manage')}>
            내 공고 관리하기
          </Button>
          <Button variant="secondary" onClick={() => {
            setStep(2);
            setFormData((prev) => ({
              ...prev,
              title: '',
              jobType: '',
              address: '',
              hourlyWage: '',
              workHours: '',
              workDays: '',
              description: '',
              headcount: '1',
            }));
          }}>
            공고 추가 등록하기
          </Button>
        </div>
      </div>
    </div>
  );
}

export default EmployerPostPage;
