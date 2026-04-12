import { useState, useEffect, useMemo } from 'react';
import { UserPlus, Mail, User, Lock, MapPin, Phone, Copy } from 'lucide-react';
import Card from '@/components/common/Card';
import Input from '@/components/common/Input';
import Select from '@/components/common/Select';
import Button from '@/components/common/Button';
import { adminApi } from '@/api/admin';
import { useToast } from '@/context/ToastContext';

const INITIAL_FORM = {
  email: '',
  name: '',
  password: '',
  address: '',
  phone: '',
  course_id: '',
  cohort_id: '',
};

function generatePassword() {
  const chars =
    'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let pw = '';
  for (let i = 0; i < 10; i += 1) {
    pw += chars[Math.floor(Math.random() * chars.length)];
  }
  return pw;
}

export default function RegisterStudent() {
  const { showToast } = useToast();
  const [form, setForm] = useState(INITIAL_FORM);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastCreated, setLastCreated] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    adminApi
      .getCourses()
      .then((data) => setCourses(data || []))
      .catch(() =>
        showToast({ type: 'error', message: '과정 목록을 불러오지 못했습니다.' }),
      );
  }, [showToast]);

  const update = (key) => (e) => {
    const value = e.target.value;
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      // 과정이 바뀌면 기수 초기화
      if (key === 'course_id') next.cohort_id = '';
      return next;
    });
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const selectedCourse = useMemo(
    () => courses.find((c) => c.id === form.course_id) || null,
    [courses, form.course_id],
  );
  const isMainCourse = selectedCourse?.track_type === 'main';

  const courseOptions = useMemo(() => {
    const labelFor = (c) => {
      const tag = c.track_type === 'main' ? '[메인]' : '[서브]';
      return `${tag} ${c.name} (${c.classroom}, ${c.duration_months}개월, ${c.daily_start_time}~${c.daily_end_time})`;
    };
    const main = courses.filter((c) => c.track_type === 'main').map((c) => ({ value: c.id, label: labelFor(c) }));
    const sub = courses.filter((c) => c.track_type === 'sub').map((c) => ({ value: c.id, label: labelFor(c) }));
    return [...main, ...sub];
  }, [courses]);

  // 신규 학생 등록은 "예정(upcoming)" 기수만 활성.
  // 진행중/수료 기수는 비활성 옵션으로 노출해 사유를 보여준다.
  const cohortOptions = useMemo(() => {
    if (!selectedCourse) return [];
    return (selectedCourse.cohorts || []).map((co) => {
      let suffix;
      let disabled;
      if (co.status === 'upcoming') {
        suffix = co.start_date ? ` — 예정 (${co.start_date} 시작)` : ' — 예정';
        disabled = false;
      } else if (co.status === 'in_progress') {
        suffix = ' — 진행중 (마감)';
        disabled = true;
      } else {
        suffix = ' — 수료';
        disabled = true;
      }
      return {
        value: String(co.id),
        label: `${co.cohort_number}기${suffix}`,
        disabled,
      };
    });
  }, [selectedCourse]);

  const hasUpcomingCohort = useMemo(
    () => cohortOptions.some((opt) => !opt.disabled),
    [cohortOptions],
  );

  const validate = () => {
    const next = {};
    if (!form.email) next.email = '이메일을 입력하세요.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      next.email = '올바른 이메일 형식이 아닙니다.';
    if (!form.name.trim()) next.name = '이름을 입력하세요.';
    if (!form.password || form.password.length < 6)
      next.password = '비밀번호는 6자 이상이어야 합니다.';
    if (!form.course_id) next.course_id = '과정을 선택하세요.';
    if (isMainCourse && !form.cohort_id)
      next.cohort_id = '메인 과정은 기수를 선택해야 합니다.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = {
        email: form.email,
        name: form.name,
        password: form.password,
        address: form.address || null,
        phone: form.phone || null,
        course_id: form.course_id,
        cohort_id: isMainCourse && form.cohort_id ? Number(form.cohort_id) : null,
      };
      const res = await adminApi.createStudent(payload);
      setLastCreated({
        email: res.email,
        name: res.name,
        password: form.password,
      });
      showToast({ type: 'success', message: '학생 계정이 생성되었습니다.' });
      setForm(INITIAL_FORM);
    } catch (err) {
      const raw = err?.response?.data?.detail;
      const detail = Array.isArray(raw)
        ? raw.map((d) => d?.msg || JSON.stringify(d)).join(', ')
        : typeof raw === 'string'
          ? raw
          : '계정 생성에 실패했습니다.';
      showToast({ type: 'error', message: detail });
    } finally {
      setLoading(false);
    }
  };

  const copyCredentials = () => {
    if (!lastCreated) return;
    const text = `이메일: ${lastCreated.email}\n비밀번호: ${lastCreated.password}`;
    navigator.clipboard?.writeText(text).then(
      () => showToast({ type: 'success', message: '계정 정보를 복사했습니다.' }),
      () => showToast({ type: 'error', message: '복사에 실패했습니다.' }),
    );
  };

  return (
    <div className="mx-auto max-w-2xl rounded-3xl bg-[#efede8] px-4 py-6 sm:px-6 md:-mx-2 md:px-8 md:py-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e8eef2]">
          <UserPlus className="h-5 w-5 text-[#5c6675]" />
        </div>
        <div>
          <h1 className="text-[1.65rem] font-semibold text-[#2d3138]">학생 등록</h1>
          <p className="text-sm text-[#7a756c]">
            관리자가 학생 계정을 생성합니다. 학생은 1개의 과정만 수강할 수 있습니다.
          </p>
        </div>
      </div>

      <Card className="rounded-2xl border border-[#e2ded7] bg-[#f8f7f4] shadow-none">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="이메일"
            type="email"
            placeholder="student@example.com"
            value={form.email}
            onChange={update('email')}
            icon={Mail}
            error={errors.email}
          />
          <Input
            label="이름"
            placeholder="홍길동"
            value={form.name}
            onChange={update('name')}
            icon={User}
            error={errors.name}
          />
          <Input
            label="주소"
            placeholder="서울특별시 ..."
            value={form.address}
            onChange={update('address')}
            icon={MapPin}
          />
          <Input
            label="연락처"
            placeholder="010-0000-0000"
            value={form.phone}
            onChange={update('phone')}
            icon={Phone}
          />
          <div className="flex flex-col gap-1.5">
            <Input
              label="임시 비밀번호"
              type="text"
              placeholder="6자 이상"
              value={form.password}
              onChange={update('password')}
              icon={Lock}
              error={errors.password}
            />
            <button
              type="button"
              onClick={() =>
                setForm((prev) => ({ ...prev, password: generatePassword() }))
              }
              className="self-start text-caption font-medium text-[#4e5f6e] hover:underline"
            >
              자동 생성
            </button>
          </div>
          <Select
            label="수강 과정"
            options={courseOptions}
            value={form.course_id}
            onChange={update('course_id')}
            placeholder="과정을 선택하세요"
            error={errors.course_id}
          />
          {isMainCourse && (
            <div className="flex flex-col gap-1.5">
              <Select
                label="기수"
                options={cohortOptions}
                value={form.cohort_id}
                onChange={update('cohort_id')}
                placeholder="기수를 선택하세요"
                error={errors.cohort_id}
              />
              {!hasUpcomingCohort && (
                <p className="text-caption text-warning-600">
                  등록 가능한 다음 기수가 없습니다. 먼저 기수를 추가해주세요.
                </p>
              )}
            </div>
          )}
          {selectedCourse && !isMainCourse && (
            <p className="text-caption text-gray-500 -mt-1">
              서브 과정은 기수 구분이 없습니다.
            </p>
          )}
          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={loading} icon={UserPlus} fullWidth>
              학생 등록
            </Button>
          </div>
        </form>
      </Card>

      {lastCreated && (
        <Card className="mt-4 rounded-2xl border border-[#c9d8c4] bg-[#eef4ec] shadow-none">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="mb-2 text-body-sm font-semibold text-[#3d5a42]">
                {lastCreated.name}님 계정이 생성되었습니다.
              </p>
              <div className="space-y-1 text-body-sm text-[#2d3138]">
                <p>
                  <span className="text-[#6b7568]">이메일</span>{' '}
                  <span className="font-mono">{lastCreated.email}</span>
                </p>
                <p>
                  <span className="text-[#6b7568]">임시 비밀번호</span>{' '}
                  <span className="font-mono">{lastCreated.password}</span>
                </p>
              </div>
              <p className="mt-2 text-caption text-[#5f6a5c]">
                학생에게 이 정보를 전달해 주세요. 페이지를 벗어나면 비밀번호는 다시 확인할 수 없습니다.
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={Copy}
              onClick={copyCredentials}
            >
              복사
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
