import { useState, useEffect, useMemo } from 'react';
import { UserCog, Mail, User, Lock, MapPin, Phone, Copy } from 'lucide-react';
import Card from '@/components/common/Card';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import { adminApi } from '@/api/admin';
import { useToast } from '@/context/ToastContext';

const INITIAL_FORM = {
  email: '',
  name: '',
  password: '',
  address: '',
  phone: '',
  course_ids: [],
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

export default function RegisterTeacher() {
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
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const mainCourses = useMemo(
    () => courses.filter((c) => c.track_type === 'main'),
    [courses],
  );
  const subCourses = useMemo(
    () => courses.filter((c) => c.track_type === 'sub'),
    [courses],
  );

  // 트랙별 최대 1개 선택. 같은 트랙의 다른 과정을 고르면 기존 선택을 대체하고,
  // 같은 항목을 다시 누르면 해제한다.
  const toggleCourse = (courseId) => {
    const target = courses.find((c) => c.id === courseId);
    if (!target) return;
    setForm((prev) => {
      const already = prev.course_ids.includes(courseId);
      if (already) {
        return {
          ...prev,
          course_ids: prev.course_ids.filter((id) => id !== courseId),
        };
      }
      const sameTrackIds = new Set(
        courses
          .filter((c) => c.track_type === target.track_type)
          .map((c) => c.id),
      );
      const kept = prev.course_ids.filter((id) => !sameTrackIds.has(id));
      return { ...prev, course_ids: [...kept, courseId] };
    });
    setErrors((prev) => ({ ...prev, course_ids: undefined }));
  };

  const validate = () => {
    const next = {};
    if (!form.email) next.email = '이메일을 입력하세요.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      next.email = '올바른 이메일 형식이 아닙니다.';
    if (!form.name.trim()) next.name = '이름을 입력하세요.';
    if (!form.password || form.password.length < 6)
      next.password = '비밀번호는 6자 이상이어야 합니다.';
    if (form.course_ids.length === 0)
      next.course_ids = '최소 1개의 과정을 선택하세요.';
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
        course_ids: form.course_ids,
      };
      const res = await adminApi.createTeacher(payload);
      setLastCreated({
        email: res.email,
        name: res.name,
        password: form.password,
      });
      showToast({ type: 'success', message: '강사 계정이 생성되었습니다.' });
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

  const renderCourseCheckbox = (c) => {
    const checked = form.course_ids.includes(c.id);
    return (
      <label
        key={c.id}
        className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${
          checked
            ? 'border-[#8a9bab] bg-[#e8eef2]'
            : 'border-[#e2ded7] bg-white/60 hover:border-[#cfc8be]'
        }`}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={() => toggleCourse(c.id)}
          className="mt-1"
        />
        <div className="flex-1 min-w-0">
          <div className="text-body-sm font-medium text-gray-900">{c.name}</div>
          <div className="text-caption text-gray-500">
            {c.classroom} · {c.duration_months}개월 · {c.daily_start_time}~{c.daily_end_time}
          </div>
        </div>
      </label>
    );
  };

  return (
    <div className="mx-auto max-w-2xl rounded-3xl bg-[#efede8] px-4 py-6 sm:px-6 md:-mx-2 md:px-8 md:py-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e8eef2]">
          <UserCog className="h-5 w-5 text-[#5c6675]" />
        </div>
        <div>
          <h1 className="text-[1.65rem] font-semibold text-[#2d3138]">강사 등록</h1>
          <p className="text-sm text-[#7a756c]">
            관리자가 강사 계정을 생성합니다. 강사는 여러 과정을 담당할 수 있습니다.
          </p>
        </div>
      </div>

      <Card className="rounded-2xl border border-[#e2ded7] bg-[#f8f7f4] shadow-none">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="이메일"
            type="email"
            placeholder="teacher@example.com"
            value={form.email}
            onChange={update('email')}
            icon={Mail}
            error={errors.email}
          />
          <Input
            label="이름"
            placeholder="박서연"
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

          <div className="flex flex-col gap-1.5">
            <label className="text-body-sm font-medium text-[#2d3138]">
              담당 과정{' '}
              <span className="text-caption font-normal text-[#7a756c]">
                (메인·서브 각 1개씩, 최소 1개)
              </span>
            </label>
            {mainCourses.length > 0 && (
              <div className="flex flex-col gap-2">
                <div className="mt-1 text-caption font-semibold text-[#8b8478]">메인 과정</div>
                {mainCourses.map(renderCourseCheckbox)}
              </div>
            )}
            {subCourses.length > 0 && (
              <div className="flex flex-col gap-2">
                <div className="mt-2 text-caption font-semibold text-[#8b8478]">서브 과정</div>
                {subCourses.map(renderCourseCheckbox)}
              </div>
            )}
            {errors.course_ids && (
              <p className="text-caption text-error-500">{errors.course_ids}</p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={loading} icon={UserCog} fullWidth>
              강사 등록
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
                강사에게 이 정보를 전달해 주세요. 페이지를 벗어나면 비밀번호는 다시 확인할 수 없습니다.
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
