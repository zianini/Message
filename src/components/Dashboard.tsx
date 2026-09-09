import React from 'react';
import { DashboardStats } from '../types';
import { 
  CheckCircle2, 
  AlertTriangle, 
  CopyMinus, 
  Filter, 
  FileText, 
  MessageSquare, 
  Smartphone, 
  FileDown
} from 'lucide-react';

interface DashboardProps {
  stats: DashboardStats;
  onExport: () => void;
  disabledExport: boolean;
}

export default function Dashboard({ stats, onExport, disabledExport }: DashboardProps) {
  const successPercentage = stats.totalProcessed > 0 
    ? Math.round(((stats.successCount + stats.correctedCount) / stats.totalProcessed) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Visual Header / Summary Bar */}
      <div className="bg-[#1E293B]/60 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-slate-700/80">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded-full border border-sky-500/20">
              변환 대시보드
            </span>
            <h2 className="text-2xl font-bold mt-2 text-white font-sans tracking-tight">
              <span className="notranslate" translate="no">알리고</span> 전송 대기 분석 리포트
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              전체 업로드된 데이터 중 발송 가능한 수신자 수와 가용 SMS/LMS 비용 가이드를 확인하세요.
            </p>
          </div>
          <div>
            <button
              onClick={onExport}
              disabled={disabledExport}
              id="export-aligo-xlsx-btn"
              className={`flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold transition-all shadow-lg ${
                disabledExport
                  ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed shadow-none'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white font-bold active:scale-[0.98] cursor-pointer shadow-emerald-600/10'
              }`}
            >
              <FileDown className="w-5 h-5" />
              <span className="notranslate" translate="no">알리고</span> 양식 엑셀 다운로드
            </button>
          </div>
        </div>

        {/* Dynamic conversion progress */}
        <div className="mt-6 pt-6 border-t border-slate-700/50 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center">
              <svg className="w-12 h-12 transform -rotate-90">
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  className="stroke-slate-800"
                  strokeWidth="4"
                  fill="transparent"
                />
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  className="stroke-sky-400 transition-all duration-500"
                  strokeWidth="4"
                  fill="transparent"
                  strokeDasharray={125.6}
                  strokeDashoffset={125.6 - (125.6 * successPercentage) / 100}
                />
              </svg>
              <span className="absolute text-xs font-bold font-mono text-sky-400">
                {successPercentage}%
              </span>
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-200">정제 성공률</div>
              <div className="text-xs text-slate-400">오류 수정 및 유효번호 기준</div>
            </div>
          </div>
          <div className="hidden sm:block h-8 w-px bg-slate-700" />
          <div className="flex flex-wrap gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              최종 발송가능: <strong className="text-slate-200">{stats.successCount + stats.correctedCount}건</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              중복 제외: <strong className="text-slate-200">{stats.duplicateCount}건</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              오류/누락: <strong className="text-slate-200">{stats.invalidCount}건</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Grid of details cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total uploaded */}
        <div className="bg-slate-800/40 rounded-2xl p-5 border border-slate-700/50 shadow-xs flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">업로드 총 레코드</p>
            <h3 className="text-2xl font-bold text-white mt-1 font-mono">
              {stats.totalProcessed.toLocaleString()} <span className="text-sm font-medium text-slate-400">건</span>
            </h3>
            <p className="text-xs text-slate-500 mt-2">전화번호 매핑 완료 대상</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/80 text-slate-300">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        {/* Ready to send (Success + Corrected) */}
        <div className="bg-slate-800/40 rounded-2xl p-5 border border-slate-700/50 shadow-xs flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">발송 승인 완료</p>
            <h3 className="text-2xl font-bold text-emerald-400 mt-1 font-mono">
              {(stats.successCount + stats.correctedCount).toLocaleString()} <span className="text-sm font-medium text-emerald-500">건</span>
            </h3>
            <p className="text-xs text-emerald-400/80 mt-2">
              정상 {stats.successCount}건 / 교정 {stats.correctedCount}건
            </p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* SMS Count */}
        <div className="bg-slate-800/40 rounded-2xl p-5 border border-slate-700/50 shadow-xs flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-sky-400 uppercase tracking-wider">SMS 발송 (90Byte 이하)</p>
            <h3 className="text-2xl font-bold text-sky-400 mt-1 font-mono">
              {stats.smsCount.toLocaleString()} <span className="text-sm font-medium text-sky-400">건</span>
            </h3>
            <p className="text-xs text-slate-500 mt-2"><span className="notranslate" translate="no">알리고</span> 1건 차감 기준</p>
          </div>
          <div className="p-3 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Smartphone className="w-5 h-5" />
          </div>
        </div>

        {/* LMS Count */}
        <div className="bg-slate-800/40 rounded-2xl p-5 border border-slate-700/50 shadow-xs flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-violet-400 uppercase tracking-wider">LMS 발송 (90Byte 초과)</p>
            <h3 className="text-2xl font-bold text-violet-400 mt-1 font-mono">
              {stats.lmsCount.toLocaleString()} <span className="text-sm font-medium text-violet-400">건</span>
            </h3>
            <p className="text-xs text-slate-500 mt-2">장문 <span className="notranslate" translate="no">알리고</span> 3건 차감 기준</p>
          </div>
          <div className="p-3 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
            <MessageSquare className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Excluded and filters stats */}
      <div className="bg-slate-800/20 rounded-2xl p-5 border border-slate-700/40 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <CopyMinus className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-semibold uppercase">중복 번호 필터링</div>
            <div className="text-lg font-bold text-slate-200 mt-0.5 font-mono">
              {stats.duplicateCount} <span className="text-xs font-normal text-slate-500">건 제외됨</span>
            </div>
            <div className="text-xs text-slate-500 mt-0.5">다중 수신 방지</div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Filter className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-semibold uppercase">특정 문자열 필터링</div>
            <div className="text-lg font-bold text-slate-200 mt-0.5 font-mono">
              {stats.keywordFilteredCount} <span className="text-xs font-normal text-slate-500">건 제외됨</span>
            </div>
            <div className="text-xs text-slate-500 mt-0.5">금지 키워드 포함 대상</div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-semibold uppercase">오류 및 매핑 실패</div>
            <div className="text-lg font-bold text-slate-200 mt-0.5 font-mono">
              {stats.invalidCount} <span className="text-xs font-normal text-slate-500">건 보류됨</span>
            </div>
            <div className="text-xs text-slate-500 mt-0.5">전화번호 없음, 비어있는 번호 등</div>
          </div>
        </div>
      </div>
    </div>
  );
}

