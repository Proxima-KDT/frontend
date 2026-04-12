import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Users, Calendar } from 'lucide-react';
import { teacherApi } from '@/api/teacher';
import { useCourse } from '@/context/CourseContext';
import Card from '@/components/common/Card';
import ProgressBar from '@/components/common/ProgressBar';
import SkillRadarChart from '@/components/charts/SkillRadarChart';
import Skeleton from '@/components/common/Skeleton';

const SKILL_COLORS = [
  'bg-blue-500',
  'bg-green-500',
  'bg-violet-500',
  'bg-orange-500',
  'bg-pink-500',
];

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const { selectedCourseId, selectedCourse } = useCourse();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedCourseId) {
      setStudents([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    teacherApi
      .getStudents(selectedCourseId)
      .then(setStudents)
      .finally(() => setLoading(false));
  }, [selectedCourseId]);

  const avgAttendance = students.length
    ? Math.round(
        students.reduce((sum, s) => sum + (s.attendance_rate ?? 0), 0) /
          students.length,
      )
    : 0;
  const stats = [
    {
      label: '전체 학생',
      value: students.length,
      icon: Users,
      color: 'text-primary-500',
      bg: 'bg-primary-50',
    },
    {
      label: '평균 출석률',
      value: `${avgAttendance}%`,
      icon: Calendar,
      color: 'text-success-500',
      bg: 'bg-success-50',
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-h1 font-bold text-gray-900">수강생 현황</h1>
        {selectedCourse && (
          <>
            <p className="text-body-sm text-gray-500 mt-1">
              {selectedCourse.track_type === 'main' ? '[메인] ' : '[서브] '}
              {selectedCourse.name}
              {selectedCourse.classroom ? ` · ${selectedCourse.classroom}` : ''}
            </p>
            <p className="text-caption text-gray-400 mt-0.5">
              {selectedCourse.start_date && selectedCourse.end_date
                ? `${selectedCourse.start_date} ~ ${selectedCourse.end_date}${selectedCourse.cohort_number ? ` · ${selectedCourse.cohort_number}기` : ''}`
                : selectedCourse.duration_months
                  ? `${selectedCourse.duration_months}개월 과정`
                  : null}
            </p>
          </>
        )}
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}
              >
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-caption text-gray-500">{stat.label}</p>
                <p className="text-h3 font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* 학생 카드 그리드 */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {students.map((student) => {
            const skillData = Object.entries(student.skills || {}).map(
              ([subject, score]) => ({
                subject,
                score,
                fullMark: 100,
              }),
            );

            // 레이더 차트용: 긴 라벨 축약
            const radarData = skillData.map((item) => ({
              ...item,
              subject:
                item.subject === '프로젝트.과제.시험'
                  ? '프로젝트..'
                  : item.subject,
            }));

            return (
              <Card
                key={student.id}
                hoverable
                onClick={() => navigate(`/teacher/students/${student.id}`)}
              >
                <div className="flex items-start gap-4 mb-4">
                  {/* 직사각형 프로필 사진 */}
                  <div className="shrink-0 w-20 h-24 rounded-2xl overflow-hidden border-2 border-white shadow-md">
                    {student.avatar_url ? (
                      <img
                        src={student.avatar_url}
                        alt={student.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-student-400 to-student-600 flex items-center justify-center">
                        <span className="text-white text-xl font-bold">
                          {student.name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pt-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-body font-semibold text-gray-900 truncate">
                        {student.name}
                      </h3>
                    </div>
                    <p className="text-caption text-gray-500">
                      {student.email}
                    </p>
                  </div>
                </div>

                {/* 역량 분석 - MyPage 스타일 2열 레이아웃 */}
                <div className="grid grid-cols-2 gap-3">
                  <SkillRadarChart
                    data={radarData}
                    color="#3B82F6"
                    size="mini"
                  />
                  <div className="flex flex-col justify-center gap-2">
                    {skillData.map((skill, idx) => (
                      <ProgressBar
                        key={skill.subject}
                        value={skill.score}
                        label={skill.subject}
                        color={SKILL_COLORS[idx]}
                        size="sm"
                      />
                    ))}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
