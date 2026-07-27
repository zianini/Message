import React, { useState, useMemo } from 'react';
import { ConvertedRecord } from '../types';
import { 
  Search, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  ChevronLeft, 
  ChevronRight,
  Eye,
  BookOpen,
  AlertTriangle,
  HelpCircle
} from 'lucide-react';
import { getByteLength, cleanAndFormatPhoneNumber } from '../utils/converter';

interface PreviewTableProps {
  records: ConvertedRecord[];
  onUpdateRecord: (updated: ConvertedRecord) => void;
  onDeleteRecord: (index: number) => void;
  excludeKeywords: string[];
}

// 대표 수학 과정명 옵션
const COURSE_OPTIONS = [
  '5-1', '5-2', '6-1', '6-2', 
  '1-1', '1-2', '2-1', '2-2', '3-1', '3-2',
  '공통수학1', '공통수학2', '대수', '미적분Ⅰ', '확률과 통계', '기하'
];

export default function PreviewTable({ 
  records, 
  onUpdateRecord, 
  onDeleteRecord,
  excludeKeywords
}: PreviewTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'valid' | 'unclassified' | 'filtered' | 'invalid'>('all');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Inline editing state
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editPhone, setEditPhone] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editCourseName, setEditCourseName] = useState('');

  // Batch course assignment
  const [selectedBatchCourse, setSelectedBatchCourse] = useState('');

  // Reset page when filter or search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, rowsPerPage]);

  // 과정명이 추출되지 않은 건 수
  const missingCourseCount = useMemo(() => {
    return records.filter(r => r.isCourseNameMissing || r.courseName === '[과정명]' || !r.courseName).length;
  }, [records]);

  // 미분류 예외 건 수
  const unclassifiedCount = useMemo(() => {
    return records.filter(r => r.status === 'unclassified' || r.isUnclassified).length;
  }, [records]);

  const handleStartEdit = (record: ConvertedRecord) => {
    setEditingIndex(record.index);
    setEditPhone(record.correctedPhone);
    setEditContent(record.correctedContent);
    setEditCourseName(record.courseName || '');
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
  };

  // 개별 과정명 즉시 대입
  const handleApplyCourseName = (record: ConvertedRecord, newCourse: string) => {
    if (!newCourse.trim()) return;

    let updatedContent = record.correctedContent;
    
    // 과정명 치환 [과정명] 또는 기존 과정명 -> 신규 과정명
    if (record.courseName && record.courseName !== '[과정명]') {
      updatedContent = updatedContent.replace(new RegExp(record.courseName, 'g'), newCourse);
    } else {
      updatedContent = updatedContent.replace(/\[과정명\]/g, newCourse);
      // 만약 템플릿에 평가명 부분만 있었다면 추가 교체
      if (!updatedContent.includes(newCourse)) {
        updatedContent = updatedContent.replace(/([0-9]{1,2}월\s*진단평가|주간평가|자습테스트)/g, `${newCourse} $1`);
      }
    }

    const finalBytes = getByteLength(updatedContent);
    const messageType = finalBytes > 90 ? 'LMS' : 'SMS';

    onUpdateRecord({
      ...record,
      courseName: newCourse,
      isCourseNameMissing: false,
      correctedContent: updatedContent,
      bytes: finalBytes,
      messageType,
      // 과정명이 입력되었으므로 상태가 unclassified면 corrected로 업데이트
      status: record.status === 'unclassified' ? 'corrected' : record.status,
      statusReason: record.status === 'unclassified' ? `과정명(${newCourse}) 입력 완료` : record.statusReason,
    });
  };

  // 과정명 미입력 건에 대해 일괄 지정 적용
  const handleApplyBatchCourse = () => {
    if (!selectedBatchCourse.trim()) {
      alert('적용할 과정명을 선택해 주세요.');
      return;
    }

    records.forEach(r => {
      if (r.isCourseNameMissing || r.courseName === '[과정명]' || !r.courseName) {
        handleApplyCourseName(r, selectedBatchCourse);
      }
    });

    alert(`과정명이 없던 레코드들에 '${selectedBatchCourse}' 과정명이 성공적으로 대입되었습니다.`);
    setSelectedBatchCourse('');
  };

  const handleSaveEdit = (record: ConvertedRecord) => {
    const phoneEval = cleanAndFormatPhoneNumber(editPhone);

    let status: ConvertedRecord['status'] = record.status;
    let statusReason = record.statusReason;

    if (!editPhone.trim()) {
      status = 'invalid';
      statusReason = '전화번호가 누락되었습니다.';
    } else if (!phoneEval.isValid) {
      status = 'invalid';
      statusReason = phoneEval.reason;
    } else if (!editContent.trim()) {
      status = 'invalid';
      statusReason = '메시지 내용이 비어있습니다.';
    } else if (phoneEval.isCorrected) {
      status = 'corrected';
      statusReason = phoneEval.reason;
    } else if (status === 'invalid' || status === 'unclassified') {
      status = 'corrected';
      statusReason = '사용자 직접 수정 완료';
    }

    // Apply excludeKeywords filter
    let finalContent = editContent;
    const removedKeywords: string[] = [];
    if (status !== 'invalid' && excludeKeywords.length > 0) {
      excludeKeywords.forEach((keyword) => {
        const trimmed = keyword.trim();
        if (trimmed) {
          const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(escaped, 'gi');
          if (regex.test(finalContent)) {
            finalContent = finalContent.replace(regex, '');
            removedKeywords.push(trimmed);
          }
        }
      });
    }

    if (removedKeywords.length > 0) {
      if (status === 'success') {
        status = 'corrected';
        statusReason = `제외 문자열(${removedKeywords.join(', ')}) 제거`;
      } else if (status === 'corrected') {
        statusReason = `${statusReason} & 제외 문자열 제거`;
      }
    }

    const finalBytes = getByteLength(finalContent);
    const messageType = finalBytes > 90 ? 'LMS' : 'SMS';

    onUpdateRecord({
      ...record,
      correctedPhone: phoneEval.isValid ? phoneEval.formatted : editPhone,
      correctedContent: finalContent,
      courseName: editCourseName || record.courseName,
      isCourseNameMissing: !editCourseName.trim(),
      bytes: finalBytes,
      messageType,
      status,
      statusReason,
    });

    setEditingIndex(null);
  };

  // Filtered & Searched data
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      // 1. Search filter
      const matchesSearch = 
        r.idOrName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.correctedPhone.includes(searchTerm) ||
        r.correctedContent.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.courseName && r.courseName.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchesSearch) return false;

      // 2. Status filter
      if (statusFilter === 'all') return true;
      if (statusFilter === 'valid') {
        return r.status === 'success' || r.status === 'corrected';
      }
      if (statusFilter === 'unclassified') {
        return r.status === 'unclassified' || r.isUnclassified;
      }
      if (statusFilter === 'filtered') {
        return r.status === 'filtered_duplicate' || r.status === 'filtered_keyword' || r.status === 'filtered_odaub_yusa';
      }
      if (statusFilter === 'invalid') {
        return r.status === 'invalid';
      }
      return true;
    });
  }, [records, searchTerm, statusFilter]);

  // Pagination slice
  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredRecords.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredRecords, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(filteredRecords.length / rowsPerPage) || 1;

  if (records.length === 0) {
    return null;
  }

  return (
    <div className="bg-[#1E293B]/40 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-xl overflow-hidden space-y-0">
      
      {/* 과정명 미입력 안내 및 일괄 지정 바 */}
      {missingCourseCount > 0 && (
        <div className="bg-amber-950/40 border-b border-amber-500/30 p-4 px-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-amber-300">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              학습명에 과정명(예: 5-1, 공통수학1 등)이 없는 데이터가 <strong className="text-white font-mono">{missingCourseCount}건</strong> 있습니다.
            </span>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={selectedBatchCourse}
              onChange={(e) => setSelectedBatchCourse(e.target.value)}
              className="bg-slate-900 border border-amber-500/40 text-amber-100 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-amber-400"
            >
              <option value="">-- 일괄 지정할 과정명 선택 --</option>
              {COURSE_OPTIONS.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <button
              onClick={handleApplyBatchCourse}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap shadow-sm"
            >
              일괄 대입
            </button>
          </div>
        </div>
      )}

      {/* Header and control bar */}
      <div className="p-6 border-b border-slate-700/50 bg-slate-900/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-sky-500/10 text-sky-400 rounded-xl border border-sky-500/20">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">변환 결과 대기명단 미리보기</h3>
              <p className="text-xs text-slate-400 mt-0.5">스마트 자동 분류된 수신번호, 과정명 및 메시지 내용을 실시간 조회 및 직접 수정합니다.</p>
            </div>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            검색 결과: <strong className="text-sky-400 font-mono">{filteredRecords.length}</strong> / {records.length}건
          </span>
        </div>

        {/* Filters and search inputs */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mt-5">
          {/* Search bar */}
          <div className="md:col-span-2 relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="학생 이름, 연락처, 과정명, 메시지 내용 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900/60 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-sky-500 text-slate-100 placeholder:text-slate-500"
            />
          </div>

          {/* Status filter selection tabs/dropdown */}
          <div className="md:col-span-2 flex bg-slate-900/60 rounded-lg p-1 text-xs font-semibold text-slate-400 border border-slate-700/40">
            <button
              onClick={() => setStatusFilter('all')}
              className={`flex-1 py-1 rounded-md text-center transition-all cursor-pointer ${
                statusFilter === 'all' ? 'bg-slate-800 text-white shadow-md' : 'hover:text-slate-200'
              }`}
            >
              전체
            </button>
            <button
              onClick={() => setStatusFilter('valid')}
              className={`flex-1 py-1 rounded-md text-center transition-all cursor-pointer ${
                statusFilter === 'valid' ? 'bg-emerald-600/90 text-white shadow-md' : 'hover:text-slate-200'
              }`}
            >
              발송가능
            </button>
            <button
              onClick={() => setStatusFilter('unclassified')}
              className={`flex-1 py-1 rounded-md text-center transition-all cursor-pointer relative ${
                statusFilter === 'unclassified' ? 'bg-orange-600/90 text-white shadow-md' : 'hover:text-slate-200'
              }`}
            >
              미분류 ({unclassifiedCount})
            </button>
            <button
              onClick={() => setStatusFilter('filtered')}
              className={`flex-1 py-1 rounded-md text-center transition-all cursor-pointer ${
                statusFilter === 'filtered' ? 'bg-amber-600/90 text-white shadow-md' : 'hover:text-slate-200'
              }`}
            >
              제외됨
            </button>
            <button
              onClick={() => setStatusFilter('invalid')}
              className={`flex-1 py-1 rounded-md text-center transition-all cursor-pointer ${
                statusFilter === 'invalid' ? 'bg-rose-600/90 text-white shadow-md' : 'hover:text-slate-200'
              }`}
            >
              오류
            </button>
          </div>

          {/* Page size controller */}
          <div className="flex items-center justify-end gap-2 text-xs text-slate-400">
            <span>표시:</span>
            <select
              value={rowsPerPage}
              onChange={(e) => setRowsPerPage(Number(e.target.value))}
              className="bg-slate-900/80 border border-slate-700 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-sky-500 text-slate-100"
            >
              <option value="10">10개씩</option>
              <option value="25">25개씩</option>
              <option value="50">50개씩</option>
              <option value="100">100개씩</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Area */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900/40 border-b border-slate-700/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="py-3.5 px-4 w-12 text-center">No</th>
              <th className="py-3.5 px-4 w-36">수신번호 (A열)</th>
              <th className="py-3.5 px-4 w-36">과정명/분류</th>
              <th className="py-3.5 px-4">메시지 내용 (B열)</th>
              <th className="py-3.5 px-4 w-28 text-center">상태</th>
              <th className="py-3.5 px-4 w-24 text-center">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs">
            {paginatedRecords.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-500 italic">
                  일치하는 레코드가 없습니다. 다른 검색어나 필터를 설정해 보세요.
                </td>
              </tr>
            ) : (
              paginatedRecords.map((r, i) => {
                const isEditing = editingIndex === r.index;
                const seq = (currentPage - 1) * rowsPerPage + i + 1;

                // Color configuration based on status
                let statusBadge = '';
                switch (r.status) {
                  case 'success':
                    statusBadge = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
                    break;
                  case 'corrected':
                    statusBadge = 'bg-teal-500/10 text-teal-400 border border-teal-500/20';
                    break;
                  case 'unclassified':
                    statusBadge = 'bg-orange-500/20 text-orange-400 border border-orange-500/30';
                    break;
                  case 'filtered_duplicate':
                    statusBadge = 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
                    break;
                  case 'filtered_keyword':
                    statusBadge = 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
                    break;
                  case 'filtered_odaub_yusa':
                    statusBadge = 'bg-pink-500/10 text-pink-400 border border-pink-500/20';
                    break;
                  case 'invalid':
                    statusBadge = 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
                    break;
                }

                return (
                  <tr key={r.index} className={`hover:bg-slate-800/30 transition-colors ${
                    r.status === 'invalid' ? 'bg-rose-950/10' : r.status === 'unclassified' ? 'bg-orange-950/10' : ''
                  }`}>
                    {/* Index */}
                    <td className="py-3.5 px-4 text-center font-mono text-slate-500">{seq}</td>

                    {/* Phone Number */}
                    <td className="py-3.5 px-4 font-mono">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs focus:outline-none focus:border-sky-500 font-mono text-slate-100"
                        />
                      ) : (
                        <div className="flex flex-col">
                          <span className={r.status === 'corrected' ? 'text-teal-400 font-semibold' : 'text-slate-300'}>
                            {r.correctedPhone || '-'}
                          </span>
                          {r.status === 'corrected' && r.originalPhone !== r.correctedPhone && (
                            <span className="text-[10px] text-slate-500 line-through">
                              {r.originalPhone}
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* 과정명 & 평가유형 */}
                    <td className="py-3.5 px-4">
                      {isEditing ? (
                        <select
                          value={editCourseName}
                          onChange={(e) => setEditCourseName(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs focus:outline-none focus:border-sky-500 text-slate-100"
                        >
                          <option value="">-- 과정명 선택 --</option>
                          {COURSE_OPTIONS.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      ) : (
                        <div className="flex flex-col items-start gap-1">
                          {r.courseName && r.courseName !== '[과정명]' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20 font-medium text-[11px]">
                              <BookOpen className="w-3 h-3 text-sky-400" />
                              {r.courseName}
                            </span>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                                과정명 미입력
                              </span>
                              <select
                                onChange={(e) => handleApplyCourseName(r, e.target.value)}
                                defaultValue=""
                                className="bg-slate-900 border border-amber-500/40 text-amber-200 rounded px-1.5 py-0.5 text-[10px] focus:outline-none"
                              >
                                <option value="" disabled>지정하기</option>
                                {COURSE_OPTIONS.map(c => (
                                  <option key={c} value={c}>{c}</option>
                                ))}
                              </select>
                            </div>
                          )}
                          <span className="text-[10px] text-slate-400">
                            {r.evalType || '미분류'}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Message Content */}
                    <td className="py-3.5 px-4">
                      {isEditing ? (
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={2}
                          className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs focus:outline-none focus:border-sky-500 text-slate-100"
                        />
                      ) : (
                        <div className="group relative">
                          <p className="text-slate-300 whitespace-pre-wrap break-all text-xs" title={r.correctedContent}>
                            {r.correctedContent}
                          </p>
                        </div>
                      )}
                    </td>

                    {/* Status Badge & Reasons */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statusBadge}`}>
                          {r.status === 'success' && '정상 수신'}
                          {r.status === 'corrected' && '형식 교정'}
                          {r.status === 'unclassified' && '미분류 예외'}
                          {r.status === 'filtered_duplicate' && '중복 제외'}
                          {r.status === 'filtered_keyword' && '날짜 제외'}
                          {r.status === 'filtered_odaub_yusa' && '오답유사 제외'}
                          {r.status === 'invalid' && '오류 보류'}
                        </span>
                        {r.statusReason && (
                          <span className="text-[9px] text-slate-500 max-w-[140px] truncate block" title={r.statusReason}>
                            {r.statusReason}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Row Controls */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => handleSaveEdit(r)}
                              title="저장"
                              className="p-1 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              title="취소"
                              className="p-1 rounded bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 transition-colors cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleStartEdit(r)}
                              title="수정"
                              className="p-1.5 rounded bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteRecord(r.index)}
                              title="삭제"
                              className="p-1.5 rounded bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-slate-700 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      <div className="p-4 border-t border-slate-700/50 bg-slate-900/30 flex items-center justify-between text-xs text-slate-400">
        <div>
          총 <strong className="text-white">{filteredRecords.length}</strong>개 항목 중 {((currentPage - 1) * rowsPerPage) + 1} - {Math.min(currentPage * rowsPerPage, filteredRecords.length)} 표시
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg border border-slate-700 bg-slate-800/60 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700 text-slate-200 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-mono text-slate-300">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-lg border border-slate-700 bg-slate-800/60 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700 text-slate-200 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
