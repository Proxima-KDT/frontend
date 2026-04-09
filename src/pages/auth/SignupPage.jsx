import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import AuthLayout from '@/components/layout/AuthLayout';
import Card from '@/components/common/Card';
import Input from '@/components/common/Input';
import Select from '@/components/common/Select';
import Button from '@/components/common/Button';
import { Mail, Lock, User } from 'lucide-react';

export default function SignupPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { signUp } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: '',
    password: '',
    passwordConfirm: '',
    name: '',
    role: '',
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!form.email) newErrors.email = '이메일을 입력하세요';
    if (form.password.length < 8) newErrors.password = '8자 이상 입력하세요';
    else if (!/(?=.*[a-zA-Z])(?=.*[0-9])/.test(form.password))
      newErrors.password = '영문과 숫자를 포함해야 합니다';
    if (form.password !== form.passwordConfirm)
      newErrors.passwordConfirm = '비밀번호가 일치하지 않습니다';
    if (!form.name) newErrors.name = '이름을 입력하세요';
    if (!form.role) newErrors.role = '역할을 선택하세요';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await signUp(form.email, form.password, form.name, form.role);
      showToast({
        type: 'success',
        message: '회원가입이 완료되었습니다! 로그인해주세요.',
      });
      navigate('/login');
    } catch (err) {
      showToast({
        type: 'error',
        message: err.message || '회원가입에 실패했습니다.',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
    if (errors[field]) setErrors({ ...errors, [field]: null });
  };

  return (
    <AuthLayout>
      <Card>
        <div className="text-center mb-6">
          <h1 className="text-h2 font-bold text-gray-900">회원가입</h1>
          <p className="text-body-sm text-gray-500 mt-1">
            EduPilot에 가입하세요
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="이메일"
            type="email"
            placeholder="이메일을 입력하세요"
            value={form.email}
            onChange={updateField('email')}
            error={errors.email}
            icon={Mail}
          />
          <Input
            label="비밀번호"
            type="password"
            placeholder="8자 이상, 영문과 숫자 포함"
            value={form.password}
            onChange={updateField('password')}
            error={errors.password}
            icon={Lock}
          />
          <Input
            label="비밀번호 확인"
            type="password"
            placeholder="비밀번호를 다시 입력하세요"
            value={form.passwordConfirm}
            onChange={updateField('passwordConfirm')}
            error={errors.passwordConfirm}
            icon={Lock}
          />
          <Input
            label="이름"
            placeholder="이름을 입력하세요"
            value={form.name}
            onChange={updateField('name')}
            error={errors.name}
            icon={User}
          />
          <Select
            label="역할"
            value={form.role}
            onChange={updateField('role')}
            error={errors.role}
            options={[
              { value: 'student', label: '학생' },
              { value: 'teacher', label: '강사' },
              { value: 'admin', label: '관리자(멘토)' },
            ]}
          />

          <Button type="submit" fullWidth size="lg" loading={loading}>
            회원가입
          </Button>
        </form>

        <p className="text-center text-body-sm text-gray-500 mt-4">
          이미 계정이 있으신가요?{' '}
          <Link
            to="/login"
            className="text-student-600 font-semibold hover:underline"
          >
            로그인
          </Link>
        </p>
      </Card>
    </AuthLayout>
  );
}
