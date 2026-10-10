import React from 'react';
import { 
  X, 
  BookOpen, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  ArrowRight,
  Filter,
  Check,
  Calendar,
  Sparkles
} from 'lucide-react';

interface CourseProcessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CourseProcessModal({ isOpen, onClose }: CourseProcessModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                수학 과정명 자동 판별 과정 및 규칙 가이드
                <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  스마트 파이프라인
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                수학 과정명(1-1, 6-2, 공통수학1 등)이 어떤 우선순위와 규칙으로 결정되는지 상세히 안내합니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300 custom-scrollbar">
          
          {/* Section 1: 4-Step Pipeline */}
          <div>
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-400" />
              과정명 결정 4단계 우선순위 파이프라인
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              
              {/* Step 1 */}
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                      1단계 · 최우선 순위
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">STEP 1</span>
                  </div>
                  <h4 className="font-bold text-white text-xs mb-1">엑셀 전용 과정 컬럼 확인</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    업로드된 엑셀에 <strong className="text-slate-200">‘과정명’, ‘과정’, ‘교재명’, ‘과목’</strong> 등의 전용 헤더가 있는 경우, 해당 열의 값을 최우선으로 가져옵니다.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-700/40 text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                  <Check className="w-3 h-3 flex-shrink-0" />
                  예: 과정명 열 = &quot;6-1&quot; → &quot;6-1&quot; 즉시 확정
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      2단계 · 기본 규칙
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">STEP 2</span>
                  </div>
                  <h4 className="font-bold text-white text-xs mb-1">시험지명 / 학습명 정밀 추출</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    ‘학습명’ 또는 ‘시험지명’ 제목 텍스트에서 학년-학기 및 고등 과정을 정규식 단어 경계로 정밀 탐색합니다.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-700/40 text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                  <Check className="w-3 h-3 flex-shrink-0" />
                  예: &quot;1-1 진단평가&quot;, &quot;7월 진단평가(1-1)&quot; → &quot;1-1&quot;
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      3단계 · 안전 열 탐색
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">STEP 3</span>
                  </div>
                  <h4 className="font-bold text-white text-xs mb-1">기타 안전 열 검사 (오매칭 차단)</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    날짜(완료일, 채점일), 전화번호, 학생ID, 점수 등 오매칭을 일으키는 열을 엄격히 배제하고 안전한 설명/교재 열만 검사합니다.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-700/40 text-[10px] text-amber-400 font-medium flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 flex-shrink-0" />
                  완료일 &quot;2026-10-08&quot;의 &quot;6-1&quot; 오인식 완전 차단
                </div>
              </div>

              {/* Step 4 */}
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      4단계 · 수동 제어
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">STEP 4</span>
                  </div>
                  <h4 className="font-bold text-white text-xs mb-1">미추출 시 플레이스홀더 및 일괄 대입</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    과정명을 찾을 수 없는 경우 <strong className="text-amber-300">[과정명]</strong>으로 표시되며, 상단 일괄 대입기나 표 내 드롭다운으로 즉시 지정 가능합니다.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-700/40 text-[10px] text-purple-400 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                  상단 [일괄 대입]으로 한 번에 수백 건도 1초 대입
                </div>
              </div>

            </div>
          </div>

          {/* Section 2: Kang Na-yeon Case Study (Real World Problem Resolution) */}
          <div className="p-4 rounded-xl bg-sky-950/40 border border-sky-500/30">
            <h4 className="text-xs font-bold text-sky-300 flex items-center gap-2 mb-2">
              <HelpCircle className="w-4 h-4 text-sky-400" />
              실제 사례 분석: 강나연 학생의 1-1 과정명이 6-1로 나왔던 이유와 해결책
            </h4>
            
            <div className="space-y-2.5 text-[11px] leading-relaxed text-slate-300">
              <div className="flex items-start gap-2 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-bold flex-shrink-0 mt-0.5">
                  발생 원인
                </span>
                <p>
                  강나연 학생의 시험지명은 <strong className="text-white">&quot;1-1 진단평가&quot;</strong>, 시험 완료일은 <strong className="text-white">&quot;2026-10-08&quot;</strong>이었습니다.
                  <br />
                  과거 단순 문자열 포함 검사 방식에서는 완료일 텍스트인 <code className="bg-slate-800 px-1 py-0.5 rounded text-amber-300">202[6-1]0-08</code> 안에서 <strong className="text-amber-300">&quot;6-1&quot;</strong>이 감지되고, 날짜 제거 기능이 &quot;1-1&quot;을 월/일 날짜로 오인해 지우면서 6-1로 잘못 지정되었던 현상입니다.
                </p>
              </div>

              <div className="flex items-start gap-2 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold flex-shrink-0 mt-0.5">
                  개선 조치
                </span>
                <p>
                  1. <strong className="text-emerald-300">정규식 단어 경계((?&lt;!\d)...(?!\d))</strong>를 적용하여 2026-10-08, 010-6123-4567처럼 앞뒤에 숫자가 붙은 날짜·전화번호는 과정명으로 절대 인식하지 않습니다.
                  <br />
                  2. 날짜 제거 규칙에서 하이픈(-) 형태의 <strong className="text-emerald-300">&quot;1-1&quot;, &quot;6-1&quot;</strong>은 과정명으로 보호하여 시험지명의 1-1이 정상 보존됩니다.
                  <br />
                  3. 각 학생 레코드마다 <strong className="text-sky-300">‘과정명 추출 출처’</strong>를 실시간으로 기록하여 표에서 투명하게 확인할 수 있습니다.
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Supported Courses List */}
          <div>
            <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-slate-400" />
              자동 인식 지원 수학 과정 목록
            </h4>
            <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/50 space-y-2 text-[11px]">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 w-20 flex-shrink-0 font-medium">초등 / 중등:</span>
                <div className="flex flex-wrap gap-1">
                  {['1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '4-1', '4-2', '5-1', '5-2', '6-1', '6-2'].map(c => (
                    <span key={c} className="px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20 text-[10px] font-mono">
                      {c}
                    </span>
                  ))}
                  <span className="text-[10px] text-slate-500 self-center">(중1-1, 초5-1, 1상, 1하 표기도 자동 대응)</span>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1 border-t border-slate-700/30">
                <span className="text-slate-400 w-20 flex-shrink-0 font-medium">고등 / 특수:</span>
                <div className="flex flex-wrap gap-1">
                  {['공통수학1', '공통수학2', '수학(상)', '수학(하)', '대수', '미적분Ⅰ', '확률과 통계', '기하'].map(c => (
                    <span key={c} className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 text-[10px]">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg text-xs transition-all cursor-pointer shadow-md"
          >
            확인 및 닫기
          </button>
        </div>

      </div>
    </div>
  );
}
