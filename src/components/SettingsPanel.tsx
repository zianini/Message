import React, { useState } from 'react';
import { ConverterSettings } from '../types';
import { 
  Settings, 
  Plus, 
  X, 
  ShieldAlert
} from 'lucide-react';

interface SettingsPanelProps {
  settings: ConverterSettings;
  onChangeSettings: (settings: ConverterSettings) => void;
}

export default function SettingsPanel({ settings, onChangeSettings }: SettingsPanelProps) {
  const [newKeyword, setNewKeyword] = useState('');

  const handleToggleDeduplicate = () => {
    onChangeSettings({
      ...settings,
      deduplicate: !settings.deduplicate,
    });
  };

  const handleAddKeyword = (e: React.FormEvent) => {
    e.preventDefault();
    const keyword = newKeyword.trim();
    if (keyword && !settings.excludeKeywords.includes(keyword)) {
      onChangeSettings({
        ...settings,
        excludeKeywords: [...settings.excludeKeywords, keyword],
      });
      setNewKeyword('');
    }
  };

  const handleRemoveKeyword = (keywordToRemove: string) => {
    onChangeSettings({
      ...settings,
      excludeKeywords: settings.excludeKeywords.filter((kw) => kw !== keywordToRemove),
    });
  };

  const handleToggleHeader = () => {
    onChangeSettings({
      ...settings,
      addHeader: !settings.addHeader,
    });
  };

  const handleHeaderNameChange = (field: 'phone' | 'content', value: string) => {
    onChangeSettings({
      ...settings,
      [field === 'phone' ? 'headerPhoneName' : 'headerContentName']: value,
    });
  };

  return (
    <div className="bg-[#1E293B]/40 backdrop-blur-md rounded-2xl border border-slate-700/50 p-6 space-y-6 shadow-xl">
      <div className="flex items-center gap-2.5 pb-4 border-b border-slate-700/50">
        <div className="p-2 bg-sky-500/10 text-sky-400 rounded-xl border border-sky-500/20">
          <Settings className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">정제 및 변환 환경설정</h3>
          <p className="text-xs text-slate-400 mt-0.5">중복 방지, 형식 자동 수정, 제외 문자열 등의 세부 규칙을 정의합니다.</p>
        </div>
      </div>

      {/* Grid of config sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Side: Phone & Deduplication Settings */}
        <div className="space-y-5">
          {/* Deduplication Toggle & Setup */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2.5 text-sm font-semibold text-slate-200 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={settings.deduplicate}
                  onChange={handleToggleDeduplicate}
                  className="w-4 h-4 text-sky-500 rounded border-slate-600 bg-slate-900 focus:ring-sky-500 focus:ring-offset-slate-900 cursor-pointer"
                />
                수신번호 중복 전송 방지 필터링
              </label>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                settings.deduplicate 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {settings.deduplicate ? '활성화됨' : '비활성화'}
              </span>
            </div>
            
            <p className="text-xs text-slate-400">
              동일 수신자에게 중복된 문자 발송을 방지합니다. 여러 이력 중 <strong>점수가 가장 높은 기록 1건만</strong> 전송 대상으로 자동 정제합니다.
            </p>
          </div>

          {/* Autocorrect explanation banner */}
          <div className="bg-emerald-950/20 rounded-xl p-4 border border-emerald-500/20 space-y-2">
            <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-emerald-500" />
              오류 방지 데이터 형식 자동 교정 작동 중
            </h4>
            <ul className="text-xs text-slate-300 list-disc list-inside space-y-1.5 pl-1">
              <li>특수문자 및 공백 제거 (예: <code className="bg-emerald-500/10 border border-emerald-500/20 px-1 py-0.5 rounded text-emerald-300 font-mono text-[10px]">010.1234.5678</code> &rarr; <code className="bg-emerald-500/10 border border-emerald-500/20 px-1 py-0.5 rounded text-emerald-300 font-mono text-[10px]">010-1234-5678</code>)</li>
              <li>국가 번호 제거 및 <code className="bg-emerald-500/10 border border-emerald-500/20 px-1 py-0.5 rounded text-emerald-300 font-mono text-[10px]">010</code> 자동 완성 (<code className="bg-emerald-500/10 border border-emerald-500/20 px-1 py-0.5 rounded text-emerald-300 font-mono text-[10px]">8210-</code> 또는 <code className="bg-emerald-500/10 border border-emerald-500/20 px-1 py-0.5 rounded text-emerald-300 font-mono text-[10px]">10-1234-</code>)</li>
              <li>공백 및 90Byte 초과 장문 자동 감지 및 LMS 자동 변환 분석</li>
            </ul>
          </div>
        </div>

        {/* Right Side: Exclude Specific Strings & Export Headers */}
        <div className="space-y-5">
          {/* Keyword Exclusion section */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-slate-200">
              특정 문자열(단어) 자동 제거 필터
            </label>
            <p className="text-xs text-slate-400">
              메시지 내용에서 아래 등록된 단어가 포함되어 있으면, 해당 단어만 지운 후(제거) 발송합니다. (예: 보류, 테스트)
            </p>

            <form onSubmit={handleAddKeyword} className="flex gap-2">
              <input
                type="text"
                placeholder="제외(제거)할 단어 입력 (예: 보류)"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                className="flex-1 bg-slate-900/60 border border-slate-700 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-sky-500 text-slate-100 placeholder:text-slate-500"
              />
              <button
                type="submit"
                className="bg-sky-600 hover:bg-sky-500 text-white rounded-lg px-4 py-2 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                추가
              </button>
            </form>

            <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto p-1.5 border border-slate-700/40 rounded-lg bg-slate-900/30 min-h-[44px]">
              {settings.excludeKeywords.length === 0 ? (
                <span className="text-xs text-slate-500 m-auto">등록된 제외 단어가 없습니다.</span>
              ) : (
                settings.excludeKeywords.map((kw) => (
                  <span
                    key={kw}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/20 text-xs"
                  >
                    {kw}
                    <button
                      type="button"
                      onClick={() => handleRemoveKeyword(kw)}
                      className="text-sky-400 hover:text-sky-300 focus:outline-none cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Excel Export formatting (Headers) */}
          <div className="space-y-3 pt-4 border-t border-slate-700/50">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2.5 text-sm font-semibold text-slate-200 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={settings.addHeader}
                  onChange={handleToggleHeader}
                  className="w-4 h-4 text-sky-500 rounded border-slate-600 bg-slate-900 focus:ring-sky-500 focus:ring-offset-slate-900 cursor-pointer"
                />
                첫 번째 행에 열 제목(헤더) 추가
              </label>
            </div>
            <p className="text-xs text-slate-400">
              체크 해제 시, 헤더 없이 A열에 수신번호, B열에 내용으로만 데이터가 시작됩니다.
            </p>

            {settings.addHeader && (
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-900/30 rounded-xl border border-slate-700/50">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">A열 헤더 이름</label>
                  <input
                    type="text"
                    value={settings.headerPhoneName}
                    onChange={(e) => handleHeaderNameChange('phone', e.target.value)}
                    className="w-full bg-slate-900/60 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-sky-500 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">B열 헤더 이름</label>
                  <input
                    type="text"
                    value={settings.headerContentName}
                    onChange={(e) => handleHeaderNameChange('content', e.target.value)}
                    className="w-full bg-slate-900/60 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-sky-500 text-slate-100"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

