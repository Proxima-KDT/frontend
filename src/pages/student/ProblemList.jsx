import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Code2,
  Globe,
  Database,
  GitBranch,
  Users,
  Brain,
  ChevronRight,
  BookOpen,
  Download,
  Sparkles,
} from 'lucide-react';
import { subjectsApi } from '@/api/subjects';
import Card from '@/components/common/Card';
import ProgressBar from '@/components/common/ProgressBar';
import Skeleton from '@/components/common/Skeleton';

const iconMap = {
  Code2,
  Globe,
  Database,
  GitBranch,
  Users,
  Brain,
  Download,
  Sparkles,
};

const courseTagMap = {
  'course-langchain': {
    label: 'AI 영상',
    color: 'bg-violet-100 text-violet-700',
  },
  'course-bigdata': { label: '빅데이터', color: 'bg-teal-100 text-teal-700' },
  'course-python-ai': {
    label: '파이썬 AI',
    color: 'bg-orange-100 text-orange-700',
  },
  'course-dbms': { label: 'DBMS', color: 'bg-blue-100 text-blue-700' },
};

const statusMap = {
  completed: { label: '학습 완료', className: 'bg-[#e9eff3] text-[#4f6475]' },
  in_progress: { label: '학습 중', className: 'bg-[#f4ecd7] text-[#7a6330]' },
  upcoming: { label: '예정', className: 'bg-[#efede7] text-[#8d877e]' },
};

function getSubjectStatus(progress) {
  if (!progress) return 'upcoming';
  if (progress.percent >= 100) return 'completed';
  if (progress.percent > 0) return 'in_progress';
  return 'upcoming';
}

export default function ProblemList() {
  const navigate = useNavigate();
  const location = useLocation();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    subjectsApi
      .getList()
      .then((data) => {
        if (!cancelled) setSubjects(data);
      })
      .catch(() => {
        if (!cancelled) setSubjects([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [location.key]);

  if (loading) {
    return (
      <div
        className="space-y-6 rounded-3xl px-2 py-4 sm:px-4 md:-mx-2 md:px-6 md:py-8"
        style={{ backgroundColor: '#F7F5F0' }}
      >
        <div>
          <h1 className="text-h1 font-bold text-gray-900">
            개념 학습 & 문제풀이
          </h1>
          <p className="text-body-sm text-gray-500 mt-1">
            커리큘럼에 맞는 개념을 학습하고 문제를 풀어보세요
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton
              key={i}
              width="100%"
              height="120px"
              rounded="rounded-2xl"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className="space-y-6 rounded-3xl px-2 py-4 sm:px-4 md:-mx-2 md:px-6 md:py-8"
      style={{ backgroundColor: '#F7F5F0' }}
    >
      <div>
        <h1 className="text-h1 font-bold text-gray-900">
          개념 학습 & 문제풀이
        </h1>
        <p className="text-body-sm text-gray-500 mt-1">
          커리큘럼에 맞는 개념을 학습하고 문제를 풀어보세요
        </p>
      </div>

      {subjects.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-body text-gray-400">등록된 과목이 없습니다</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subjects.map((subject) => {
            const Icon = iconMap[subject.icon];
            const progress = subject.progress ?? {
              solved: 0,
              total: subject.total_problems ?? 0,
              percent: 0,
            };
            const status = getSubjectStatus(progress);
            const statusInfo = statusMap[status];

            return (
              <Card
                key={subject.id}
                hoverable
                onClick={() => navigate(`/student/problems/${subject.id}`)}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#eef2f4] flex items-center justify-center shrink-0">
                    {Icon ? (
                      <Icon className="w-6 h-6 text-[#4e5a61]" />
                    ) : (
                      <BookOpen className="w-6 h-6 text-[#4e5a61]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-body font-semibold text-gray-900 truncate">
                        {subject.title}
                      </h3>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${statusInfo.className}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                    {subject.course_tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {subject.course_tags.map((tag) => {
                          const info = courseTagMap[tag];
                          if (!info) return null;
                          return (
                            <span
                              key={tag}
                              className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${info.color}`}
                            >
                              {info.label}
                            </span>
                          );
                        })}
                      </div>
                    )}
                    <p className="text-caption text-gray-500 mb-3 line-clamp-1">
                      {subject.description}
                    </p>

                    <ProgressBar
                      value={progress.percent ?? 0}
                      color={
                        status === 'completed'
                          ? 'bg-[#6f8391]'
                          : status === 'in_progress'
                            ? 'bg-[#b79b5d]'
                            : 'bg-[#c8c2b7]'
                      }
                      size="sm"
                      showValue={false}
                    />
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-caption text-gray-400">
                        <BookOpen className="w-3.5 h-3.5 inline mr-1" />
                        {subject.concepts?.length ?? 0}개 개념 ·{' '}
                        {progress.total}문제
                      </span>
                      <span className="text-caption font-medium text-gray-600">
                        {progress.solved}/{progress.total} 완료
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300 shrink-0 mt-1" />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
