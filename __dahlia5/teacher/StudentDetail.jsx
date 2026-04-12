import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  Mail,
  Calendar,
  Clock,
  FileText,
  FolderOpen,
  TrendingUp,
  UserCircle,
} from 'lucide-react';
import { teacherApi } from '@/api/teacher';
import { useToast } from '@/context/ToastContext';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';
import Textarea from '@/components/common/Textarea';
import ProgressBar from '@/components/common/ProgressBar';
import SkillRadarChart from '@/components/charts/SkillRadarChart';
import Skeleton from '@/components/common/Skeleton';

const SKILL_LABELS = {
  異쒓껐: '異쒓껐',
  AI_留먰븯湲? 'AI 留먰븯湲?,
  AI_硫댁젒: 'AI 硫댁젒',
  ?ы듃?대━?? '?ы듃?대━??,
  ?꾨줈?앺듃_怨쇱젣_?쒗뿕: '?꾨줈?앺듃/怨쇱젣/?쒗뿕',
};

const RADAR_LABELS = {
  異쒓껐: '異쒓껐',
  AI_留먰븯湲? 'AI留먰븯湲?,
  AI_硫댁젒: 'AI硫댁젒',
  ?ы듃?대━?? '?ы듃?대━??,
  ?꾨줈?앺듃_怨쇱젣_?쒗뿕: '?꾨줈?앺듃',
};

const SKILL_COLORS = [
  'bg-blue-500',
  'bg-green-500',
  'bg-violet-500',
  'bg-orange-500',
  'bg-pink-500',
];

const STATUS_CONFIG = {
  present: { color: 'bg-success-500', label: '異쒖꽍' },
  late: { color: 'bg-warning-500', label: '吏媛? },
  absent: { color: 'bg-error-500', label: '寃곗꽍' },
  early_leave: { color: 'bg-warning-300', label: '議고눜' },
};

const DAY_NAMES = ['??, '??, '??, '??, '紐?, '湲?, '??];

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton width="180px" height="20px" rounded="rounded" />
      <Skeleton width="100%" height="130px" rounded="rounded-2xl" />
      <Skeleton width="100%" height="300px" rounded="rounded-2xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton width="100%" height="220px" rounded="rounded-2xl" />
        <Skeleton width="100%" height="220px" rounded="rounded-2xl" />
      </div>
    </div>
  );
}

export default function StudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [student, setStudent] = useState(null);
  const [weekAttendance, setWeekAttendance] = useState([]);
  const [notes, setNotes] = useState('');
  const [notesSaving, setNotesSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      teacherApi.getStudent(id),
      teacherApi.getStudentWeeklyAttendance(id),
    ])
      .then(([s, att]) => {
        setStudent(s);
        setNotes(s.notes || '');
        setWeekAttendance(att || []);
      })
      .catch(() =>
        showToast({
          message: '?숈깮 ?뺣낫瑜?遺덈윭?ㅼ? 紐삵뻽?듬땲??',
          type: 'error',
        }),
      )
      .finally(() => setLoading(false));
  }, [id]);

  const handleSaveNotes = useCallback(async () => {
    setNotesSaving(true);
    try {
      await teacherApi.updateNotes(id, notes);
      showToast({ message: '?명듃媛 ??λ릺?덉뒿?덈떎.', type: 'success' });
    } catch {
      showToast({ message: '??μ뿉 ?ㅽ뙣?덉뒿?덈떎.', type: 'error' });
    } finally {
      setNotesSaving(false);
    }
  }, [id, notes, showToast]);

  if (loading) return <LoadingSkeleton />;

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <UserCircle className="w-12 h-12 mb-3 text-gray-300" />
        <p className="text-body-md">?숈깮 ?뺣낫瑜?遺덈윭?????놁뒿?덈떎.</p>
      </div>
    );
  }

  const skillData = Object.entries(student.skills || {}).map(
    ([key, score]) => ({
      key,
      label: SKILL_LABELS[key] || key,
      radarLabel: RADAR_LABELS[key] || key,
      score: score ?? 0,
      fullMark: 100,
    }),
  );

  const radarData = skillData.map((item) => ({
    subject: item.radarLabel,
    score: item.score,
    fullMark: 100,
  }));

  const overallScore = skillData.length
    ? (
        skillData.reduce((sum, item) => sum + item.score, 0) / skillData.length
      ).toFixed(1)
    : '0.0';
  const weekColumns = ['W1', 'W2', 'W3', 'W4', 'W5', 'TODAY'];
  const statusPalette = {
    present: 'bg-[#5d666c]',
    late: 'bg-[#e0be4f]',
    absent: 'bg-[#cfa5a2]',
    empty: 'bg-[#d9d6cf]',
  };

  return (
    <div className="space-y-5 rounded-3xl bg-[#efede8] px-4 py-6 sm:px-6 md:-mx-2 md:px-8 md:py-8">
      <button
        onClick={() => navigate('/teacher')}
        className="flex items-center gap-1.5 text-body-sm text-[#7c766d] hover:text-[#2f333a] transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        ?섍컯???꾪솴?쇰줈 ?뚯븘媛湲?      </button>

      <Card className="rounded-3xl border border-[#dfdbd4] bg-[#f8f7f4] shadow-none">
        <div className="flex items-start gap-4">
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-[#ddd8cf] bg-[#d8e1e7]">
            {student.avatar_url ? (
              <img
                src={student.avatar_url}
                alt={student.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-[#4f6070]">
                {student.name?.charAt(0) ?? '?'}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2">
              <h2 className="text-[2rem] text-[#2f333a]">
                {student.name}
              </h2>
              <Badge variant="soft-info">?섍컯??/Badge>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-[#6f6a61]">
              {student.email && (
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-[#9b968d]" />
                  {student.email}
                </span>
              )}
              {student.enrolled_at && (
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-[#9b968d]" />
                  ?깅줉??{student.enrolled_at}
                </span>
              )}
              {student.last_active && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-[#9b968d]" />
                  理쒓렐 ?쒕룞 {student.last_active}
                </span>
              )}
            </div>
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#e8eef5] px-3 py-1.5 text-sm font-semibold text-[#3d5a6e]">
              <TrendingUp className="h-3.5 w-3.5" />
              異쒖꽍瑜?{student.attendance_rate ?? 0}%
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[300px_1fr]">
        <Card className="rounded-3xl border border-[#dfdbd4] bg-[#f8f7f4] shadow-none">
          <p className="text-[1.9rem] text-[#2f333a]">
            Competency Hexagon
          </p>
          <div className="mt-3">
            <SkillRadarChart data={radarData} color="#636e76" size="sm" />
          </div>
          <div className="mt-4 border-t border-[#e3dfd8] pt-3">
            <p className="text-[0.7rem] uppercase tracking-[0.12em] text-[#8b8478]">
              醫낇빀 ?먯닔
            </p>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-[2rem] font-semibold text-[#303742]">{overallScore}</span>
              <span className="text-sm text-[#7a756c]">/100</span>
              <Badge variant="soft-amber">High Potential</Badge>
            </div>
          </div>
        </Card>

        <Card className="rounded-3xl border border-[#dfdbd4] bg-[#f2f1ee] shadow-none">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_300px]">
            <div>
              <p className="text-[1.9rem] text-[#2f333a]">
                AI 愿李??몄궗?댄듃 (AI Observation Insights)
              </p>
              <p className="mt-3 text-sm leading-relaxed text-[#5f5a53]">
                {student.name} ?섍컯?앹? 怨쇱젣 ?꾩꽦?꾨뒗 ?믪?留?異쒖꽍 蹂?숈씠 ?덉뼱 ?④린 猷⑦떞 肄붿묶怨?二쇨컙 ?쇰뱶諛?泥댄겕瑜?蹂묓뻾?섎㈃ ?숈뒿 吏?띿꽦??醫뗭븘吏묐땲??
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="soft-info">Analytical Learner</Badge>
                <Badge variant="soft-success">Visual Maven</Badge>
              </div>
            </div>
            <div className="rounded-2xl border border-[#e1ddd6] bg-white/80 p-4">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-[#8b8478]">
                異붿쿇 寃쎈줈 (Recommended Trajectory)
              </p>
              <ul className="mt-3 space-y-2 text-sm text-[#4f4a43]">
                <li>??怨좊궃??怨쇱젣 以묒떖 二쇨컙 ?ㅼ뒿 ?뺣?</li>
                <li>??1:1 ?쇰뱶諛??몄뀡?쇰줈 諛쒗몴/硫댁젒 媛꾧레 蹂댁셿</li>
                <li>???ы듃?대━??臾몄꽌???먮쫫 媛쒖꽑</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
        <Card className="rounded-3xl border border-[#dfdbd4] bg-[#f8f7f4] shadow-none">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[1.8rem] text-[#2f333a]">
              Weekly Attendance Pulse
            </p>
            <div className="flex gap-3 text-[11px] text-[#7a756c]">
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#5d666c]" />異쒖꽍</span>
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#e0be4f]" />吏媛?/span>
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#cfa5a2]" />寃곗꽍</span>
            </div>
          </div>
          <div className="grid grid-cols-6 gap-4">
            {weekColumns.map((label, idx) => (
              <div key={label} className="space-y-2 text-center">
                <p className="text-[11px] font-semibold text-[#7b766c]">{label}</p>
                {[0, 1, 2, 3, 4].map((row) => {
                  const record = weekAttendance[idx + row];
                  const status = record?.status ?? 'empty';
                  return (
                    <div
                      key={`${label}-${row}`}
                      className={`mx-auto h-6 w-6 rounded-md ${statusPalette[status] || statusPalette.empty} ${label === 'TODAY' ? 'ring-1 ring-[#727b84]' : ''}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </Card>

        <Card className="rounded-3xl border border-[#dfdbd4] bg-[#f8f7f4] shadow-none">
          <p className="text-[1.8rem] text-[#2f333a]">
            Archive & Artifacts
          </p>
          <div className="mt-4 space-y-2.5">
            {(student.files || []).slice(0, 4).map((file, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl border border-[#e5e1da] bg-white/85 px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#eef0f2] text-[#57626d]">
                    {file.type === 'resume' ? <FileText className="h-4 w-4" /> : <FolderOpen className="h-4 w-4" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#353a42]">{file.name}</p>
                    <p className="text-[11px] text-[#7f7a72]">{file.uploaded_at}</p>
                  </div>
                </div>
                <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-[#5b6674]">
                  蹂닿린
                </a>
              </div>
            ))}
            <button className="w-full rounded-xl border border-dashed border-[#cfc9bf] py-2 text-sm font-semibold text-[#7a756c]">
              + ??臾몄꽌 異붽?
            </button>
          </div>
        </Card>
      </div>

      <Card className="rounded-3xl border border-[#dfdbd4] bg-[#f2f1ee] shadow-none">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[2rem] text-[#2f333a]">
            Instructor Consultation Notes
          </p>
          <Button
            size="sm"
            onClick={handleSaveNotes}
            loading={notesSaving}
            className="!rounded-full !bg-[#5f6972] !px-4 !text-white hover:!bg-[#4f5961]"
          >
            ???(Save Entry)
          </Button>
        </div>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={5}
          placeholder="?곷떞 愿李??댁슜, ?됰룞 ?뱀꽦, ?ㅼ쓬 紐⑺몴瑜?湲곕줉?섏꽭??"
        />
        <div className="mt-4 border-t border-[#e0ddd6] pt-3">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[#8b8478]">
            Session History
          </p>
          <p className="mt-2 text-sm text-[#58534c]">
            ??理쒓렐 硫대떞 硫붾え? ??λ맂 ?명듃???숈깮 吏???대젰?쇰줈 ?꾩쟻?⑸땲??
          </p>
        </div>
      </Card>
    </div>
  );
}
