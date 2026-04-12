import { Link } from 'react-router-dom';
import AuthLayout from '@/components/layout/AuthLayout';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { ShieldAlert } from 'lucide-react';

// 자가 가입은 비활성화되었습니다. 모든 계정은 관리자가 생성합니다.
export default function SignupPage() {
  return (
    <AuthLayout>
      <Card>
        <div className="flex flex-col items-center text-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-warning-50 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6 text-warning-500" />
          </div>
          <h1 className="text-h2 font-bold text-gray-900">
            회원가입이 제한되었습니다
          </h1>
          <p className="text-body-sm text-gray-500 leading-relaxed">
            EduPilot의 학생·강사 계정은 관리자가 직접 등록합니다.
            <br />
            계정 발급이 필요하다면 담당 관리자(멘토)에게 문의해 주세요.
          </p>
        </div>

        <Link to="/login">
          <Button type="button" variant="warm" fullWidth size="lg">
            로그인으로 돌아가기
          </Button>
        </Link>
      </Card>
    </AuthLayout>
  );
}
