import { useState, useMemo, useEffect } from 'react';
import { profileApi } from '@/api/profile';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import Skeleton from '@/components/common/Skeleton';
import StudentProfileView from '@/components/common/StudentProfileView';
import { SKILL_LABEL_MAP } from '@/utils/skillDisplay';

export default function MyPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [profile, setProfile] = useState(null);
  const [skillScores, setSkillScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState([]);
  const [fileUploading, setFileUploading] = useState(false);

  useEffect(() => {
    Promise.all([profileApi.getMe(), profileApi.getSkillScores()])
      .then(([prof, scores]) => {
        setProfile(prof);
        setSkillScores(scores);
        // 메인 과정(기수 있는) 수강생만 파일 로드
        if (prof.cohort_number) {
          profileApi
            .getFiles()
            .then(setFiles)
            .catch(() => {});
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // profileApi.getSkillScores()가 반환하는 subject는 raw key일 수 있으므로 display label로 정규화
  const normalizedSkillScores = useMemo(
    () =>
      skillScores.map((item) => ({
        ...item,
        subject: SKILL_LABEL_MAP[item.subject] || item.subject,
      })),
    [skillScores],
  );

  const displayProfile = useMemo(() => {
    if (!profile) return null;
    return {
      ...profile,
      name: profile?.name?.trim() || user?.name?.trim() || '이름 없음',
    };
  }, [profile, user]);

  async function handleAvatarUpload(file) {
    try {
      const result = await profileApi.uploadAvatar(file);
      setProfile((prev) => ({ ...prev, avatar_url: result.avatar_url }));
      showToast({
        type: 'success',
        message: '프로필 사진이 업데이트되었습니다.',
      });
    } catch {
      showToast({ type: 'error', message: '이미지 업로드에 실패했습니다.' });
    }
  }

  async function handleFileUpload(file, fileType) {
    setFileUploading(true);
    try {
      const newFile = await profileApi.uploadFile(file, fileType);
      setFiles((prev) => [newFile, ...prev]);
      showToast({ type: 'success', message: '파일이 업로드되었습니다.' });
    } catch {
      showToast({ type: 'error', message: '파일 업로드에 실패했습니다.' });
    } finally {
      setFileUploading(false);
    }
  }

  async function handleFileDelete(fileId) {
    try {
      await profileApi.deleteFile(fileId);
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
      showToast({ type: 'success', message: '파일이 삭제되었습니다.' });
    } catch {
      showToast({ type: 'error', message: '파일 삭제에 실패했습니다.' });
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 rounded-3xl bg-[#F9F8F6] p-6">
        <Skeleton width="160px" height="32px" rounded="rounded-lg" />
        <Skeleton width="100%" height="200px" rounded="rounded-2xl" />
        <Skeleton width="100%" height="300px" rounded="rounded-2xl" />
      </div>
    );
  }

  return (
    <StudentProfileView
      profile={displayProfile}
      skillScores={normalizedSkillScores}
      files={files}
      readOnly={false}
      onAvatarUpload={handleAvatarUpload}
      onFileUpload={handleFileUpload}
      onFileDelete={handleFileDelete}
      fileUploading={fileUploading}
    />
  );
}
