import { useState, useEffect } from 'react';
import { questionsApi } from '@/api/questions';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import QuestionForm from '@/components/forms/QuestionForm';
import {
  HelpCircle,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Clock,
  Trash2,
  Pencil,
  Check,
  X,
} from 'lucide-react';

export default function Questions() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [openAnswerId, setOpenAnswerId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    questionsApi
      .getList()
      .then(setQuestions)
      .catch(() => {});
  }, []);

  const myQuestions = questions.filter((q) => q.user_id === user?.id);

  const handleSubmitQuestion = async ({ content, isAnonymous }) => {
    try {
      const newQ = await questionsApi.create(content, isAnonymous);
      setQuestions((prev) => [newQ, ...prev]);
      showToast({ type: 'success', message: '吏덈Ц???깅줉?섏뿀?듬땲??' });
    } catch {
      showToast({ type: 'error', message: '吏덈Ц ?깅줉???ㅽ뙣?덉뒿?덈떎.' });
    }
  };

  const handleEditStart = (q) => {
    setEditingId(q.id);
    setEditContent(q.content);
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditContent('');
  };

  const handleEditSave = async (id) => {
    if (!editContent.trim()) return;
    setSaving(true);
    try {
      const updated = await questionsApi.update(id, editContent.trim());
      setQuestions((prev) => prev.map((q) => (q.id === id ? updated : q)));
      setEditingId(null);
      setEditContent('');
      showToast({ type: 'success', message: '吏덈Ц???섏젙?섏뿀?듬땲??' });
    } catch {
      showToast({ type: 'error', message: '?섏젙???ㅽ뙣?덉뒿?덈떎.' });
    } finally {
      setSaving(false);
    }
  };

  const toggleAnswer = (id) => {
    setOpenAnswerId((prev) => (prev === id ? null : id));
  };

  const handleDelete = async () => {
    const id = deleteConfirmId;
    if (!id) return;
    setDeleteConfirmId(null);
    setDeletingId(id);
    try {
      await questionsApi.delete(id);
      setQuestions((prev) => prev.filter((q) => q.id !== id));
      showToast({ type: 'success', message: '吏덈Ц????젣?섏뿀?듬땲??' });
    } catch {
      showToast({ type: 'error', message: '??젣???ㅽ뙣?덉뒿?덈떎.' });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-[1.65rem] font-semibold tracking-tight text-[#2c2b28]">吏덈Ц</h1>
          <p className="mt-1 text-[0.95rem] text-[#6b6560]">
            沅곴툑???먯쓣 吏덈Ц?섏꽭??
          </p>
        </div>

        {/* Question Form */}
        <Card>
          <h2 className="text-h3 font-semibold text-[#2c2b28] mb-3">
            <HelpCircle className="mr-1.5 inline-block h-5 w-5 -mt-0.5 text-[#6f8391]" />
            吏덈Ц ?묒꽦
          </h2>
          <QuestionForm onSubmit={handleSubmitQuestion} />
        </Card>

        {/* My Question History */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-h3 font-semibold text-[#2c2b28]">
              ??吏덈Ц ?대젰
            </h2>
            <span className="text-caption text-[#9c988e]">
              珥?{myQuestions.length}嫄?            </span>
          </div>

          {myQuestions.length === 0 ? (
            <p className="text-body-sm text-gray-400 text-center py-8">
              吏덈Ц ?대젰???놁뒿?덈떎.
            </p>
          ) : (
            <div className="space-y-3">
              {myQuestions.map((q) => (
                <div
                  key={q.id}
                  className="rounded-2xl border border-[#eceae4] overflow-hidden bg-white shadow-[0_2px_16px_rgba(45,42,38,0.04)]"
                >
                  {/* 吏덈Ц ??*/}
                  <div className="p-4 bg-[#fbfaf7]">
                    {editingId === q.id ? (
                      /* ?? ?몄쭛 紐⑤뱶 ?? */
                      <div className="space-y-2">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 text-body-sm text-gray-800 leading-relaxed border border-student-300 rounded-lg resize-none outline-none focus:ring-2 focus:ring-student-100 bg-white"
                          autoFocus
                        />
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={handleEditCancel}
                            disabled={saving}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-caption font-medium text-gray-500 hover:bg-gray-200 transition-colors disabled:opacity-40"
                          >
                            <X className="w-3.5 h-3.5" />
                            痍⑥냼
                          </button>
                          <button
                            onClick={() => handleEditSave(q.id)}
                            disabled={saving || !editContent.trim()}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-caption font-medium bg-student-600 text-white hover:bg-student-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Check className="w-3.5 h-3.5" />
                            {saving ? '???以?..' : '???}
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* ?? ?쇰컲 紐⑤뱶 ?? */
                      <>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className="text-body-sm text-[#3d3a36] leading-relaxed flex-1">
                            {q.content}
                          </p>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {q.is_anonymous ? (
                              <Badge variant="default">
                                <EyeOff className="w-3 h-3 mr-1 inline-block -mt-0.5" />
                                ?듬챸
                              </Badge>
                            ) : (
                              <Badge variant="info">
                                <Eye className="w-3 h-3 mr-1 inline-block -mt-0.5" />
                                ?ㅻ챸
                              </Badge>
                            )}
                            {!q.answer && (
                              <>
                                <button
                                  onClick={() => handleEditStart(q)}
                                  disabled={!!editingId || deletingId === q.id}
                                  className="p-1.5 rounded-lg text-gray-300 hover:text-student-500 hover:bg-student-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                  title="吏덈Ц ?섏젙"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setDeleteConfirmId(q.id)}
                                  disabled={!!editingId || deletingId === q.id}
                                  className="p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                  title="吏덈Ц ??젣"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-caption text-gray-400">
                            {!q.is_anonymous && q.author && (
                              <>
                                <span>{q.author}</span>
                                <span>&middot;</span>
                              </>
                            )}
                            <span>{q.created_at}</span>
                          </div>

                          {q.answer ? (
                            <button
                              onClick={() => toggleAnswer(q.id)}
                              className="flex items-center gap-1.5 text-caption font-medium text-[#4f6475] transition-colors hover:text-[#3f5568]"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              ?듬? ?뺤씤
                              {openAnswerId === q.id ? (
                                <ChevronUp className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5" />
                              )}
                            </button>
                          ) : (
                            <span className="flex items-center gap-1 text-caption text-gray-400">
                              <Clock className="w-3.5 h-3.5" />
                              ?듬? ?湲곗쨷
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {/* ?듬? ?곸뿭 (?꾩퐫?붿뼵) */}
                  {q.answer && openAnswerId === q.id && (
                    <div className="border-t border-[#e3edf3] bg-[#f4f8fb] p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageCircle className="h-4 w-4 text-[#6f8391]" />
                        <span className="text-caption font-semibold text-[#4f6475]">
                          媛뺤궗 ?듬?
                        </span>
                        {q.answered_at && (
                          <span className="text-caption text-[#8aa0b1]">
                            &middot; {q.answered_at}
                          </span>
                        )}
                      </div>
                      <p className="text-body-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {q.answer}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* ??젣 ?뺤씤 紐⑤떖 */}
      <Modal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        title="吏덈Ц ??젣"
        maxWidth="max-w-sm"
      >
        <div className="space-y-4">
          <p className="text-body-sm text-gray-700">
            ??吏덈Ц????젣?섏떆寃좎뒿?덇퉴? ??젣??吏덈Ц? 蹂듦뎄?????놁뒿?덈떎.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDeleteConfirmId(null)}>
              痍⑥냼
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              ??젣
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
