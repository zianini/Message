import React from 'react';
import { ConverterSettings } from '../types';
import { 
  Sparkles, 
  Settings2, 
  HelpCircle, 
  Filter, 
  Award,
  Check,
  FileText,
  Calendar
} from 'lucide-react';

interface MatholicTemplateConfigProps {
  settings: ConverterSettings;
  onChangeSettings: (settings: ConverterSettings) => void;
  hasLoadedFiles: boolean;
}

export default function MatholicTemplateConfig({ 
  settings, 
  onChangeSettings,
  hasLoadedFiles
}: MatholicTemplateConfigProps) {

  const handleTemplateModeChange = (mode: 'auto' | 'type1' | 'type2') => {
    onChangeSettings({
      ...settings,
      templateMode: mode
    });
  };

  const handleTemplate1Change = (val: string) => {
    onChangeSettings({
      ...settings,
      template1: val
    });
  };

  const handleTemplate2Change = (val: string) => {
    onChangeSettings({
      ...settings,
      template2: val
    });
  };

  const handleToggleExcludeOdaub = () => {
    onChangeSettings({
      ...settings,
      excludeOdaubYusa: !settings.excludeOdaubYusa
    });
  };

  const handleToggleExcludeDates = () => {
    onChangeSettings({
      ...settings,
      excludeDates: !settings.excludeDates
    });
  };

  return (
    <div className="bg-[#1E293B]/40 backdrop-blur-md rounded-2xl border border-sky-500/20 p-6 space-y-6 shadow-xl relative overflow-hidden">
      {/* Background glow decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-700/50">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-sky-500/10 text-sky-400 rounded-xl border border-sky-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-1.5">
              매쓰홀릭 발송 메시지 및 필터 규칙 설정
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">매쓰홀릭 3번째 시트의 학습이력 데이터를 활용해 동적으로 알림톡을 디자인합니다.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-xs text-slate-400 self-end sm:self-auto bg-slate-950/40 px-3 py-1.5 rounded-lg border border-slate-800">
          <span className="inline-block w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>
          <span>점수 자동 연동됨</span>
        </div>
      </div>

      {/* 1. Template Mode Options */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-slate-200">
          메시지 형태 선택 및 분류 규칙
        </label>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 bg-slate-950/40 p-1.5 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => handleTemplateModeChange('auto')}
            className={`flex flex-col items-center justify-center p-3 text-center rounded-lg border transition-all cursor-pointer ${
              settings.templateMode === 'auto'
                ? 'bg-sky-500/15 border-sky-400 text-sky-300 shadow-md'
                : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-800/30'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold">스마트 자동 분류</span>
              {settings.templateMode === 'auto' && <Check className="w-3.5 h-3.5 text-sky-400" />}
            </div>
            <span className="text-[10px] text-slate-400 mt-1">
              '주간평가', '진단평가'는 1형식, 그 외 자습 등은 2형식 자동 분기
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTemplateModeChange('type1')}
            className={`flex flex-col items-center justify-center p-3 text-center rounded-lg border transition-all cursor-pointer ${
              settings.templateMode === 'type1'
                ? 'bg-sky-500/15 border-sky-400 text-sky-300 shadow-md'
                : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-800/30'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold">진단/주간평가 형식 고정</span>
              {settings.templateMode === 'type1' && <Check className="w-3.5 h-3.5 text-sky-400" />}
            </div>
            <span className="text-[10px] text-slate-400 mt-1">
              평가명 구분 없이 무조건 진단/주간평가 형태(1형식)로 발송
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTemplateModeChange('type2')}
            className={`flex flex-col items-center justify-center p-3 text-center rounded-lg border transition-all cursor-pointer ${
              settings.templateMode === 'type2'
                ? 'bg-sky-500/15 border-sky-400 text-sky-300 shadow-md'
                : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-800/30'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold">자습테스트 형식 고정</span>
              {settings.templateMode === 'type2' && <Check className="w-3.5 h-3.5 text-sky-400" />}
            </div>
            <span className="text-[10px] text-slate-400 mt-1">
              평가명 구분 없이 무조건 자습테스트 형태(2형식)로 발송
            </span>
          </button>
        </div>
      </div>

      {/* 2. Live Editable Templates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Template 1 Box */}
        <div className={`p-4 rounded-xl border transition-all ${
          settings.templateMode === 'auto' || settings.templateMode === 'type1'
            ? 'bg-slate-900/40 border-sky-500/20'
            : 'bg-slate-950/20 border-slate-800/40 opacity-40'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              1형식: 진단 및 주간평가 템플릿
            </span>
            <span className="text-[10px] bg-sky-500/10 text-sky-400 px-2 py-0.5 rounded border border-sky-500/20 font-medium">
              자동 치환 지원
            </span>
          </div>
          
          <textarea
            value={settings.template1}
            onChange={(e) => handleTemplate1Change(e.target.value)}
            disabled={settings.templateMode === 'type2'}
            rows={3}
            placeholder="[쉐마수학]&#10;{이름}학생의 {평가명} 점수는 {점수}점입니다."
            className="w-full bg-slate-950/60 border border-slate-700/60 rounded-lg p-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-500 font-sans leading-relaxed"
          />
          <p className="text-[10px] text-slate-500 mt-1.5">
            사용 가능 변수: <code className="text-sky-400 font-mono">{`{이름}`}</code>, <code className="text-sky-400 font-mono">{`{평가명}`}</code>, <code className="text-sky-400 font-mono">{`{점수}`}</code>
          </p>
        </div>

        {/* Template 2 Box */}
        <div className={`p-4 rounded-xl border transition-all ${
          settings.templateMode === 'auto' || settings.templateMode === 'type2'
            ? 'bg-slate-900/40 border-sky-500/20'
            : 'bg-slate-950/20 border-slate-800/40 opacity-40'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              2형식: 자습테스트 등 일반 평가 템플릿
            </span>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 font-medium">
              자동 치환 지원
            </span>
          </div>
          
          <textarea
            value={settings.template2}
            onChange={(e) => handleTemplate2Change(e.target.value)}
            disabled={settings.templateMode === 'type1'}
            rows={3}
            placeholder="[쉐마수학]&#10;{이름}학생의 {평가명} 점수는 {점수}점입니다."
            className="w-full bg-slate-950/60 border border-slate-700/60 rounded-lg p-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-500 font-sans leading-relaxed"
          />
          <p className="text-[10px] text-slate-500 mt-1.5">
            사용 가능 변수: <code className="text-emerald-400 font-mono">{`{이름}`}</code>, <code className="text-emerald-400 font-mono">{`{평가명}`}</code>, <code className="text-emerald-400 font-mono">{`{점수}`}</code>
          </p>
        </div>
      </div>

      {/* 3. Specialized Filters Toggle */}
      <div className="pt-4 border-t border-slate-700/50 grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Toggle A: '오답유사' 제외 처리 */}
        <div className="p-4 bg-slate-900/30 rounded-xl border border-slate-700/30 flex items-start gap-3.5 justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-rose-400" />
              <h4 className="text-xs font-bold text-white">학습유형 '오답유사' 자동 필터링</h4>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              오답 유사 유형의 학습은 문자로 보내지 않으므로 전송 대상 목록에서 자동으로 걸러냅니다.
            </p>
          </div>
          
          <label className="relative inline-flex items-center cursor-pointer mt-1">
            <input
              type="checkbox"
              checked={settings.excludeOdaubYusa}
              onChange={handleToggleExcludeOdaub}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
          </label>
        </div>

        {/* Toggle B: 시험지명에서 날짜 자동 제거 */}
        <div className="p-4 bg-slate-900/30 rounded-xl border border-slate-700/30 flex items-start gap-3.5 justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-bold text-white">시험지명에서 날짜 자동 제거</h4>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              학습명(시험지명)에 포함된 날짜 정보('7월 10일', '07.10' 등) 및 요일을 자동으로 감지하여 문자 내용에서 깨끗이 제거해 줍니다.
            </p>
          </div>
          
          <label className="relative inline-flex items-center cursor-pointer mt-1">
            <input
              type="checkbox"
              checked={settings.excludeDates}
              onChange={handleToggleExcludeDates}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
          </label>
        </div>

      </div>
    </div>
  );
}
