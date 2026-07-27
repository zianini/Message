import React from 'react';
import { ArrowRightLeft, Users, MessageSquareCode } from 'lucide-react';

interface MappingConfigProps {
  phoneBookHeaders: string[];
  messageHeaders: string[];
  
  phoneBookIdCol: string;
  phoneBookPhoneCol: string;
  messageIdCol: string;
  messageContentCol: string;
  
  onChangePhoneBookId: (val: string) => void;
  onChangePhoneBookPhone: (val: string) => void;
  onChangeMessageId: (val: string) => void;
  onChangeMessageContent: (val: string) => void;
}

export default function MappingConfig({
  phoneBookHeaders,
  messageHeaders,
  phoneBookIdCol,
  phoneBookPhoneCol,
  messageIdCol,
  messageContentCol,
  onChangePhoneBookId,
  onChangePhoneBookPhone,
  onChangeMessageId,
  onChangeMessageContent,
}: MappingConfigProps) {
  
  if (phoneBookHeaders.length === 0 && messageHeaders.length === 0) {
    return null;
  }

  return (
    <div className="bg-[#1E293B]/40 backdrop-blur-md rounded-2xl border border-slate-700/50 p-6 space-y-6 shadow-xl">
      <div className="flex items-center gap-2.5 pb-4 border-b border-slate-700/50">
        <div className="p-2 bg-sky-500/10 text-sky-400 rounded-xl border border-sky-500/20">
          <ArrowRightLeft className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">엑셀 열(Column) 매핑 설정</h3>
          <p className="text-xs text-slate-400 mt-0.5">업로드한 엑셀 파일의 열 중에서 식별 키, 전화번호, 메시지 내용이 들어있는 열을 각각 지정합니다.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Phone book column config */}
        <div className="bg-slate-900/30 p-5 rounded-xl border border-slate-700/40 space-y-4">
          <div className="flex items-center gap-2 text-white">
            <Users className="w-4 h-4 text-sky-400" />
            <h4 className="text-sm font-bold">1. 전화번호부 파일 열 설정</h4>
          </div>
          
          {phoneBookHeaders.length === 0 ? (
            <p className="text-xs text-slate-500 italic">전화번호부 파일을 먼저 업로드해 주세요.</p>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  학생 매핑 기준 열 (이름, ID, 학번 등)
                </label>
                <select
                  value={phoneBookIdCol}
                  onChange={(e) => onChangePhoneBookId(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-sky-500 text-slate-100"
                >
                  <option value="">-- 열 선택 --</option>
                  {phoneBookHeaders.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 mt-1">메시지 대상자 파일과 대조할 학생 키값 열입니다.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  전화번호 데이터 열
                </label>
                <select
                  value={phoneBookPhoneCol}
                  onChange={(e) => onChangePhoneBookPhone(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-sky-500 text-slate-100"
                >
                  <option value="">-- 열 선택 --</option>
                  {phoneBookHeaders.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 mt-1">학생의 전화번호가 입력되어 있는 열입니다.</p>
              </div>
            </div>
          )}
        </div>

        {/* Message source column config */}
        <div className="bg-slate-900/30 p-5 rounded-xl border border-slate-700/40 space-y-4">
          <div className="flex items-center gap-2 text-white">
            <MessageSquareCode className="w-4 h-4 text-sky-400" />
            <h4 className="text-sm font-bold">2. 매쓰홀릭 학습이력 파일 열 설정</h4>
          </div>

          {messageHeaders.length === 0 ? (
            <p className="text-xs text-slate-500 italic">매쓰홀릭 학습이력 파일을 먼저 업로드해 주세요.</p>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  학생 매핑 기준 열 (이름, ID, 학번 등)
                </label>
                <select
                  value={messageIdCol}
                  onChange={(e) => onChangeMessageId(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-sky-500 text-slate-100"
                >
                  <option value="">-- 열 선택 --</option>
                  {messageHeaders.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 mt-1">전화번호를 찾을 때 매칭할 학생 키값 열입니다.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  메시지 본문 내용 열 (학습이력)
                </label>
                <select
                  value={messageContentCol}
                  onChange={(e) => onChangeMessageContent(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-sky-500 text-slate-100"
                >
                  <option value="">-- 열 선택 --</option>
                  {messageHeaders.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 mt-1">발송할 메시지(학습이력) 텍스트가 입력되어 있는 열입니다.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

