import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { 
  FileSpreadsheet, 
  Upload, 
  Trash2, 
  AlertCircle,
  Sparkles,
  HelpCircle as QuestionIcon,
  X,
  CheckCircle2,
  ChevronDown,
  Sliders,
  Settings2
} from 'lucide-react';

import { 
  ConvertedRecord, 
  ConverterSettings, 
  DashboardStats 
} from './types';
import { 
  convertAndFilterRecords, 
  calculateStats
} from './utils/converter';

import Dashboard from './components/Dashboard';
import SettingsPanel from './components/SettingsPanel';
import MappingConfig from './components/MappingConfig';
import PreviewTable from './components/PreviewTable';
import MatholicTemplateConfig from './components/MatholicTemplateConfig';

export default function App() {
  // File Upload State
  const [phoneBookFile, setPhoneBookFile] = useState<File | null>(null);
  const [messageFile, setMessageFile] = useState<File | null>(null);
  
  // Parsed Raw JSON Rows
  const [phoneBookRows, setPhoneBookRows] = useState<any[]>([]);
  const [messageRows, setMessageRows] = useState<any[]>([]);
  
  // Column Headers found in Excel
  const [phoneBookHeaders, setPhoneBookHeaders] = useState<string[]>([]);
  const [messageHeaders, setMessageHeaders] = useState<string[]>([]);

  // Selected column mappings
  const [phoneBookIdCol, setPhoneBookIdCol] = useState('');
  const [phoneBookPhoneCol, setPhoneBookPhoneCol] = useState('');
  const [messageIdCol, setMessageIdCol] = useState('');
  const [messageContentCol, setMessageContentCol] = useState('');

  // Conversion Configuration Settings
  const [settings, setSettings] = useState<ConverterSettings>(() => {
    const saved = localStorage.getItem('aligo_converter_settings');
    const defaultSettings: ConverterSettings = {
      deduplicate: true,
      deduplicateStrategy: 'keep_highest_score',
      excludeKeywords: ['보류', '테스트'],
      phoneBookIdCol: '',
      phoneBookPhoneCol: '',
      messageIdCol: '',
      messageContentCol: '',
      addHeader: true,
      headerPhoneName: '수신번호',
      headerContentName: '메세지내용',
      templateMode: 'auto',
      template1: '[쉐마수학]\n{이름}학생의 {평가명} 점수는 {점수}점입니다.',
      template2: '[쉐마수학]\n{이름}학생의 {평가명} 점수는 {점수}점입니다.',
      excludeOdaubYusa: true,
      excludeDates: true,
    };
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        let t1 = parsed.template1 || defaultSettings.template1;
        let t2 = parsed.template2 || defaultSettings.template2;
        if (t1 && !t1.includes('[쉐마수학]')) {
          t1 = `[쉐마수학]\n${t1}`;
        }
        if (t2 && !t2.includes('[쉐마수학]')) {
          t2 = `[쉐마수학]\n${t2}`;
        }
        return { ...defaultSettings, ...parsed, template1: t1, template2: t2 };
      } catch (e) {
        return defaultSettings;
      }
    }
    return defaultSettings;
  });

  // Converted Results
  const [convertedRecords, setConvertedRecords] = useState<ConvertedRecord[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalProcessed: 0,
    successCount: 0,
    correctedCount: 0,
    duplicateCount: 0,
    keywordFilteredCount: 0,
    invalidCount: 0,
    smsCount: 0,
    lmsCount: 0,
    totalBytes: 0,
  });

  // Help Modal state
  const [showHelp, setShowHelp] = useState(false);

  // Accordion Toggle States for compact screen organization (Default: Closed)
  const [isMappingOpen, setIsMappingOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // File Drag & Drop hover states
  const [dragOverPhoneBook, setDragOverPhoneBook] = useState(false);
  const [dragOverMessage, setDragOverMessage] = useState(false);

  // Auto-map columns when headers are parsed
  const autoMapHeaders = (headers: string[], type: 'phonebook' | 'message') => {
    if (type === 'phonebook') {
      // Find ID column (strictly prioritize "아이디" or "id" to lock mapping key to ID)
      const idMatch = headers.find(h => h.trim() === '아이디') || 
                      headers.find(h => h.toLowerCase().includes('아이디')) || 
                      headers.find(h => h.toLowerCase().includes('id')) ||
                      headers.find(h => ['학번', '학생', '학생명', 'name'].some(c => h.toLowerCase().includes(c)));
      if (idMatch) setPhoneBookIdCol(idMatch);

      // Find Phone number column
      const phoneCandidates = ['전화', '번호', '연락처', '휴대폰', '핸드폰', '폰', 'phone', 'contact', 'tel', 'mobile'];
      const phoneMatch = headers.find(h => phoneCandidates.some(c => h.toLowerCase().includes(c)));
      if (phoneMatch) setPhoneBookPhoneCol(phoneMatch);
    } else {
      // Find ID column for Matholic history (strictly prioritize "아이디" or "id" to lock mapping key to ID)
      const idMatch = headers.find(h => h.trim() === '아이디') || 
                      headers.find(h => h.toLowerCase().includes('아이디')) || 
                      headers.find(h => h.toLowerCase().includes('id')) ||
                      headers.find(h => ['학번', '학생명', '학생', '수신', 'name'].some(c => h.toLowerCase().includes(c)));
      if (idMatch) setMessageIdCol(idMatch);

      // Find Message Content column
      const contentCandidates = ['내용', '메시지', '메세지', '본문', '문자', '발송', 'content', 'msg', 'message', 'text', '시험', '평가', '점수'];
      const contentMatch = headers.find(h => contentCandidates.some(c => h.toLowerCase().includes(c)));
      if (contentMatch) setMessageContentCol(contentMatch);
    }
  };

  // Excel file loader handler
  const handleFileLoad = (file: File, type: 'phonebook' | 'message') => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) return;
        
        const workbook = XLSX.read(data, { type: 'binary' });
        
        // 1. 메세지 내용파일은 3번째 시트의 학습이력을 가지고와야함.
        let sheetName = workbook.SheetNames[0];
        if (type === 'message') {
          if (workbook.SheetNames.length >= 3) {
            sheetName = workbook.SheetNames[2];
          } else {
            alert(`매쓰홀릭 학습이력 파일은 3번째 시트에 데이터가 있어야 합니다. 현재 파일에는 ${workbook.SheetNames.length}개의 시트만 존재하여 첫 번째 시트를 불러옵니다.`);
          }
        }
        
        const sheet = workbook.Sheets[sheetName];
        
        // Convert sheet data to JSON containing all columns
        const json: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });
        
        if (json.length === 0) {
          alert('엑셀 파일에 데이터가 비어있습니다. 데이터를 확인하고 다시 시도해 주세요.');
          return;
        }

        // Extract headers from first non-empty row keys
        const headers = Object.keys(json[0] || {});

        if (type === 'phonebook') {
          setPhoneBookFile(file);
          setPhoneBookRows(json);
          setPhoneBookHeaders(headers);
          autoMapHeaders(headers, 'phonebook');
        } else {
          setMessageFile(file);
          setMessageRows(json);
          setMessageHeaders(headers);
          autoMapHeaders(headers, 'message');
        }
      } catch (err) {
        console.error(err);
        alert('엑셀 파일을 읽는 도중 오류가 발생했습니다. 표준 Excel (.xlsx) 파일이 맞는지 확인해 주세요.');
      }
    };
    reader.readAsBinaryString(file);
  };

  // Open file picker with directory memory (Phonebook: remembered folder / Matholic: default Downloads folder)
  const handlePickFileWithPicker = async (type: 'phonebook' | 'message') => {
    if ('showOpenFilePicker' in window) {
      try {
        const pickerOpts: any = {
          types: [
            {
              description: 'Excel & CSV Files',
              accept: {
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
                'application/vnd.ms-excel': ['.xls'],
                'text/csv': ['.csv'],
              },
            },
          ],
          excludeAcceptAllOption: false,
          multiple: false,
        };

        if (type === 'phonebook') {
          // 전화번호부: 매번 올리는 파일의 폴더 주소를 기억하도록 고유 id 사용
          pickerOpts.id = 'phonebook-excel-dir';
        } else {
          // 매쓰홀릭 학습이력: 디폴트가 다운로드(downloads) 폴더가 되도록 startIn 및 id 지정
          pickerOpts.id = 'matholic-downloads-excel-dir';
          pickerOpts.startIn = 'downloads';
        }

        const [fileHandle] = await (window as any).showOpenFilePicker(pickerOpts);
        const file = await fileHandle.getFile();
        handleFileLoad(file, type);
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return; // 사용자가 창을 닫은 경우
        console.warn('showOpenFilePicker error, falling back to input click:', err);
      }
    }

    // Fallback for browsers without File System Access API
    const inputId = type === 'phonebook' ? 'phonebook-upload-input' : 'message-upload-input';
    document.getElementById(inputId)?.click();
  };

  // Demo / Sample Data injection
  const loadDemoData = () => {
    // 1. Mock Phone Book data
    const mockPhoneBook = [
      { 아이디: 'std001', 이름: '강서준', 전화번호: '010-1234-5678' },
      { 아이디: 'std002', 이름: '이서연', 전화번호: '01011112222' }, // Needs auto-correction
      { 아이디: 'std003', 이름: '박우진', 전화번호: '1033334444' },  // Needs auto-correction (starts with 10)
      { 아이디: 'std004', 이름: '최예은', 전화번호: '010-4444-5555' },
      { 아이디: 'std005', 이름: '정다원', 전화번호: '+82 10-5555-6666' }, // Needs auto-correction (int'l)
      { 아이디: 'std006', bgm: '수신자_한지성', 이름: '한지성', 전화번호: '01012345678' }, // Duplicate phone number with std001 (강서준)
      { 아이디: 'std007', 이름: '임채원', 전화번호: '010-invalid' }, // Invalid format
      { 아이디: 'std008', 이름: '강태현', 전화번호: '' }, // Missing number
    ];

    // 2. Mock Messages/Schedule data as Matholic Learning History style
    const mockMessages = [
      // Case 1: Multiple records for std001 - Higher score (98) from '학습명' column should be kept, lower (95, 80) filtered
      { 아이디: 'std001', 학생이름: '강서준', 평가명: '7월 진단평가(5-1)', 학습유형: '진단평가', 점수: '95', 완료일: '2026-07-17', 내용: '[쉐마수학]\n강서준 학생의 7월 진단평가(5-1) 점수는 95점입니다.' }, // Friday (2026-07-17), has "진단평가" -> "진단평가"
      { 아이디: 'std001', 학생이름: '강서준', 평가명: '자습테스트(5-1)', 학습유형: '자습테스트', 점수: '80', 완료일: '2026-07-16', 내용: '[쉐마수학]\n강서준 학생의 자습테스트(5-1) 점수는 80점입니다.' },
      { 아이디: 'std001', 학생이름: '강서준', 학습명: '5-1 심화 복습과정', 학습유형: '자습테스트', 점수: '98', 완료일: '2026-07-17', 내용: '[쉐마수학]\n강서준 학생의 5-1 심화 복습과정 점수는 98점입니다.' }, // Friday (2026-07-17), no "진단평가" in name -> "주간평가" as fallback
      
      // Case 2: Assessment template match (type 1)
      { 아이디: 'std002', 학생이름: '이서연', 평가명: '7월 주간평가(6-1)', 학습유형: '주간평가', 점수: '90', 완료일: '2026-07-17', 내용: '[쉐마수학]\n이서연 학생의 7월 주간평가(6-1) 점수는 90점입니다.' },
      
      // Case 3: Standard template match (type 2) - 학습유형이 '진단평가'이더라도 제목에 '자습'이 있으므로 자습테스트로 분류
      { 아이디: 'std003', 학생이름: '박우진', 평가명: '6-1 자습테스트', 학습유형: '진단평가', 점수: '85', 완료일: '2026-07-16', 내용: '[쉐마수학]\n박우진 학생의 자습테스트(6-1) 점수는 85점입니다.' },
      
      // Case 4: Excluded by '오답유사' type
      { 아이디: 'std004', 학생이름: '최예은', 평가명: '유사오답 정복 5-2', 학습유형: '오답유사', 점수: '100', 완료일: '2026-07-17', 내용: '[쉐마수학]\n최예은 학생의 유사오답 정복 5-2 점수는 100점입니다.' },
      
      // Case 5: Contains '테스트' exclusion keyword
      { 아이디: 'std005', 학생이름: '정다원', 평가명: '시스템 임시 테스트 평가', 학습유형: '자습테스트', 점수: '70', 완료일: '2026-07-16', 내용: '[쉐마수학]\n정다원 학생의 시스템 임시 테스트 평가 점수는 70점입니다.' },
      
      // Case 6: Duplicate recipient phone number with std001 (will be filtered by deduplication)
      { 아이디: 'std006', 학생이름: '한지성', 평가명: '5월 주간평가 5-1', 학습유형: '주간평가', 점수: '92', 완료일: '2026-07-17', 내용: '[쉐마수학]\n한지성 학생의 5월 주간평가 5-1 점수는 92점입니다.' },
      
      // Case 7: Invalid phone mapping
      { 아이디: 'std007', 학생이름: '임채원', 평가명: '5-1 자습테스트', 학습유형: '자습테스트', 점수: '88', 완료일: '2026-07-16', 내용: '[쉐마수학]\n임채원 학생의 5-1 자습테스트 점수는 88점입니다.' },
      
      // Case 8: Missing phone mapping
      { 아이디: 'std008', 학생이름: '강태현', 평가명: '5-1 자습테스트', 학습유형: '자습테스트', 점수: '75', 완료일: '2026-07-16', 내용: '[쉐마수학]\n강태현 학생의 5-1 자습테스트 점수는 75점입니다.' },
 
       // Case 9: Excluded by Date format ('7월 20일' pattern check)
      { 아이디: 'std003', 학생이름: '박우진', 평가명: '7월 20일 일일평가', 학습유형: '일일평가', 점수: '93', 완료일: '2026-07-20', 내용: '[쉐마수학]\n박우진 학생의 7월 20일 일일평가 점수는 93점입니다.' },
    ];

    setPhoneBookHeaders(['아이디', '이름', '전화번호']);
    setPhoneBookRows(mockPhoneBook);
    setPhoneBookIdCol('아이디');
    setPhoneBookPhoneCol('전화번호');
    
    // Create actual mock File objects to show in the UI
    const mockPhoneFile = new File([''], '학원_학생_전화번호부_샘플.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    setPhoneBookFile(mockPhoneFile);

    setMessageHeaders(['아이디', '학생이름', '평가명', '학습유형', '점수', '완료일', '내용']);
    setMessageRows(mockMessages);
    setMessageIdCol('아이디');
    setMessageContentCol('내용');

    const mockMsgFile = new File([''], '매쓰홀릭_학습이력_샘플.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    setMessageFile(mockMsgFile);
  };

  // Reset all uploaded state
  const handleClearAll = () => {
    setPhoneBookFile(null);
    setPhoneBookRows([]);
    setPhoneBookHeaders([]);
    setPhoneBookIdCol('');
    setPhoneBookPhoneCol('');

    setMessageFile(null);
    setMessageRows([]);
    setMessageHeaders([]);
    setMessageIdCol('');
    setMessageContentCol('');

    setConvertedRecords([]);
  };

  // Main processing side effect: Triggered when settings, rows, or mapping changes
  useEffect(() => {
    if (
      phoneBookRows.length === 0 || 
      messageRows.length === 0 || 
      !phoneBookIdCol || 
      !phoneBookPhoneCol || 
      !messageIdCol || 
      !messageContentCol
    ) {
      setConvertedRecords([]);
      return;
    }

    // 1. Convert row formats to match helper requirements
    const formattedPhoneBook = phoneBookRows.map((r) => ({
      idOrName: String(r[phoneBookIdCol] || ''),
      phone: String(r[phoneBookPhoneCol] || ''),
    }));

    const formattedMessageList = messageRows.map((r) => ({
      idOrName: String(r[messageIdCol] || ''),
      content: String(r[messageContentCol] || ''),
      rawRow: r,
    }));

    // 2. Perform conversions and filtering
    const results = convertAndFilterRecords(formattedPhoneBook, formattedMessageList, settings);
    setConvertedRecords(results);
  }, [
    phoneBookRows, 
    messageRows, 
    phoneBookIdCol, 
    phoneBookPhoneCol, 
    messageIdCol, 
    messageContentCol, 
    settings
  ]);

  // Compute stats side effect
  useEffect(() => {
    const calculated = calculateStats(convertedRecords);
    setStats(calculated);
  }, [convertedRecords]);

  // Save settings to localStorage when changed
  useEffect(() => {
    localStorage.setItem('aligo_converter_settings', JSON.stringify(settings));
  }, [settings]);

  // Handle direct inline update from PreviewTable
  const handleUpdateRecord = (updated: ConvertedRecord) => {
    setConvertedRecords((prev) => 
      prev.map((item) => item.index === updated.index ? updated : item)
    );
  };

  // Handle direct row exclusion/deletion from PreviewTable
  const handleDeleteRecord = (indexToDelete: number) => {
    setConvertedRecords((prev) => 
      prev.filter((item) => item.index !== indexToDelete)
    );
  };

  // Export to Aligo XLSX
  const handleExportAligoXlsx = () => {
    // 1. Filter out only the successfully matched and corrected messages
    const sendableRecords = convertedRecords.filter(
      (r) => r.status === 'success' || r.status === 'corrected'
    );

    if (sendableRecords.length === 0) {
      alert('발송 가능한 상태인 수신자 데이터가 없습니다. 미리보기 테이블의 데이터를 확인해 주세요.');
      return;
    }

    // 2. Convert to Aligo standard columns (A: Phone number, B: Message text)
    const phoneHeader = settings.addHeader ? settings.headerPhoneName : 'A';
    const contentHeader = settings.addHeader ? settings.headerContentName : 'B';

    // To prevent exceljs header issues, if we don't want header rows, we construct using a simple array of arrays
    let sheetData: any[] = [];
    
    if (settings.addHeader) {
      // [{ "수신번호": "010-1111-2222", "메세지내용": "본문" }]
      sheetData = sendableRecords.map((r) => ({
        [phoneHeader]: r.correctedPhone,
        [contentHeader]: r.correctedContent,
      }));
    } else {
      // [[ "010-1111-2222", "본문" ]]
      sheetData = sendableRecords.map((r) => [
        r.correctedPhone,
        r.correctedContent
      ]);
    }

    const ws = settings.addHeader 
      ? XLSX.utils.json_to_sheet(sheetData)
      : XLSX.utils.aoa_to_sheet(sheetData);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'AligoSMS_Format');

    // 3. Write Excel file
    XLSX.writeFile(wb, `aligo_sms_upload_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  // Drag & Drop Handlers
  const onDragOver = (e: React.DragEvent, type: 'phone' | 'msg') => {
    e.preventDefault();
    if (type === 'phone') setDragOverPhoneBook(true);
    else setDragOverMessage(true);
  };

  const onDragLeave = (type: 'phone' | 'msg') => {
    if (type === 'phone') setDragOverPhoneBook(false);
    else setDragOverMessage(false);
  };

  const onDrop = (e: React.DragEvent, type: 'phone' | 'msg') => {
    e.preventDefault();
    if (type === 'phone') {
      setDragOverPhoneBook(false);
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        handleFileLoad(files[0], 'phonebook');
      }
    } else {
      setDragOverMessage(false);
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        handleFileLoad(files[0], 'message');
      }
    }
  };

  const hasLoadedFiles = phoneBookRows.length > 0 && messageRows.length > 0;
  const isMappingComplete = phoneBookIdCol && phoneBookPhoneCol && messageIdCol && messageContentCol;

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-200 antialiased font-sans flex flex-col">
      {/* Top Navigation / Clean Header */}
      <header className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500 flex items-center justify-center text-slate-950 shadow-lg shadow-sky-500/10">
              <FileSpreadsheet className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight text-white flex items-center gap-2">
                <span className="notranslate" translate="no">알리고</span> 문자파일 변환기
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  v1.2 PRO
                </span>
              </h1>
              <p className="text-[11px] text-slate-400">대량 발송용 엑셀 가공 및 자동 정제 솔루션</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHelp(!showHelp)}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 border border-slate-700 transition-colors cursor-pointer"
            >
              <QuestionIcon className="w-4 h-4 text-slate-400" />
              이용 방법 안내
            </button>
            
            {!hasLoadedFiles && (
              <button
                onClick={loadDemoData}
                className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 transition-colors border border-sky-500/20 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-sky-400 animate-pulse" />
                샘플 데이터 즉시 불러오기
              </button>
            )}

            {hasLoadedFiles && (
              <button
                onClick={handleClearAll}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 text-rose-400 hover:bg-rose-950/20 border border-rose-800/60 rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                비우기
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        
        {/* Help Panel Details */}
        {showHelp && (
          <div className="bg-sky-950/40 text-slate-300 rounded-2xl p-6 shadow-xl border border-sky-800/60 relative backdrop-blur-md">
            <button
              onClick={() => setShowHelp(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full cursor-pointer hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-sky-400" />
              <span className="notranslate" translate="no">알리고</span> 대량 발송용 엑셀 변환 규칙 가이드
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4 text-xs">
              <div className="space-y-1 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                <h4 className="font-bold text-sky-400">1. 파일 준비 및 개별 업로드</h4>
                <p className="text-slate-300 leading-relaxed">
                  [학생 전화번호부 엑셀]과 [개별 발송 메시지 내용 엑셀] 두 종류를 따로따로 올려주세요. 학생이름 또는 학번, 아이디 등 <strong>공통 식별키</strong>가 양쪽 파일에 존재해야 정상적으로 자동 매칭됩니다.
                </p>
              </div>
              <div className="space-y-1 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                <h4 className="font-bold text-sky-400">2. 실시간 자동 보정 및 필터</h4>
                <p className="text-slate-300 leading-relaxed">
                  중복 수신번호 제거 옵션을 켜두시면 1개 번호당 단 1건의 문자만 전송되도록 고릅니다. 또한, 전화번호에 포함된 괄호나 특수기호를 지워 <strong>010-0000-0000</strong> 표준 규격으로 보정합니다.
                </p>
              </div>
              <div className="space-y-1 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                <h4 className="font-bold text-sky-400">3. <span className="notranslate" translate="no">알리고</span> 엑셀 규격과 다운로드</h4>
                <p className="text-slate-300 leading-relaxed">
                  변환 결과가 완료되면 A열은 정제된 수신번호, B열은 메시지 본문으로 생성되며 하단 미리보기에서 자유롭게 편집 및 불필요 행을 지운 뒤 최종 엑셀 다운로드를 받으실 수 있습니다.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Drag & Drop Files Upload Panel */}
        {!hasLoadedFiles && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Box A: Phone Book Excel Uploader / Uploaded Indicator */}
            {phoneBookRows.length > 0 ? (
              <div className="border-2 border-emerald-500/30 rounded-2xl p-8 text-center transition-all bg-emerald-950/10 backdrop-blur-xs relative overflow-hidden flex flex-col items-center justify-center min-h-[260px] shadow-lg shadow-emerald-500/5">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-4 border border-emerald-500/20">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2">
                  업로드 완료
                </span>
                <h3 className="text-sm font-bold text-white">학생별 아이디 & 전화번호부 파일</h3>
                <div className="mt-3 bg-slate-900/60 border border-slate-800 rounded-xl py-2.5 px-4 w-full max-w-xs text-left">
                  <div className="text-xs text-slate-300 font-semibold truncate" title={phoneBookFile?.name}>
                    {phoneBookFile?.name || '샘플_전화번호부.xlsx'}
                  </div>
                  <div className="text-[10px] text-emerald-400 font-medium mt-1">
                    총 {phoneBookRows.length.toLocaleString()}개의 데이터 행 감지됨
                  </div>
                </div>
                <button
                  onClick={() => {
                    setPhoneBookFile(null);
                    setPhoneBookRows([]);
                    setPhoneBookHeaders([]);
                    setPhoneBookIdCol('');
                    setPhoneBookPhoneCol('');
                  }}
                  className="mt-4 flex items-center gap-1.5 text-xs font-semibold px-4 py-2 text-rose-400 hover:bg-rose-500/10 border border-rose-800/40 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  파일 삭제 / 변경
                </button>
              </div>
            ) : (
              <div
                onDragOver={(e) => onDragOver(e, 'phone')}
                onDragLeave={() => onDragLeave('phone')}
                onDrop={(e) => onDrop(e, 'phone')}
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all bg-slate-800/30 backdrop-blur-xs relative overflow-hidden flex flex-col items-center justify-center min-h-[260px] ${
                  dragOverPhoneBook 
                    ? 'border-sky-500 bg-sky-500/10 shadow-lg shadow-sky-500/5' 
                    : 'border-slate-700 hover:border-slate-600'
                }`}
              >
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  id="phonebook-upload-input"
                  className="hidden"
                  onChange={(e) => {
                    const files = e.target.files;
                    if (files && files.length > 0) handleFileLoad(files[0], 'phonebook');
                  }}
                />
                <div className="w-14 h-14 rounded-2xl bg-slate-900/60 flex items-center justify-center text-slate-400 mb-4 border border-slate-800">
                  <Upload className="w-7 h-7" />
                </div>
                <h3 className="text-sm font-bold text-white">학생별 아이디 & 전화번호부 파일</h3>
                <p className="text-xs text-slate-400 mt-1.5 max-w-[280px]">
                  학생의 식별키(아이디/이름 등)와 전화번호가 기록되어 있는 엑셀 파일을 올려주세요.
                </p>
                <button
                  type="button"
                  onClick={() => handlePickFileWithPicker('phonebook')}
                  className="mt-5 px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-md flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  전화번호부 파일 올리기
                </button>
                <div className="text-[10px] text-slate-500 mt-2.5 flex items-center gap-1">
                  <span className="text-sky-400 font-semibold">📁 이전 지정 폴더 자동 기억</span>
                  <span>• Excel / CSV 지원</span>
                </div>
              </div>
            )}

            {/* Box B: Message content / Matholic Learning History Uploader / Uploaded Indicator */}
            {messageRows.length > 0 ? (
              <div className="border-2 border-emerald-500/30 rounded-2xl p-8 text-center transition-all bg-emerald-950/10 backdrop-blur-xs relative overflow-hidden flex flex-col items-center justify-center min-h-[260px] shadow-lg shadow-emerald-500/5">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-4 border border-emerald-500/20">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2">
                  업로드 완료 (3번째 시트)
                </span>
                <h3 className="text-sm font-bold text-white">매쓰홀릭 학습이력 파일</h3>
                <div className="mt-3 bg-slate-900/60 border border-slate-800 rounded-xl py-2.5 px-4 w-full max-w-xs text-left">
                  <div className="text-xs text-slate-300 font-semibold truncate" title={messageFile?.name}>
                    {messageFile?.name || '샘플_매쓰홀릭_학습이력.xlsx'}
                  </div>
                  <div className="text-[10px] text-emerald-400 font-medium mt-1">
                    총 {messageRows.length.toLocaleString()}개의 데이터 행 감지됨
                  </div>
                </div>
                <button
                  onClick={() => {
                    setMessageFile(null);
                    setMessageRows([]);
                    setMessageHeaders([]);
                    setMessageIdCol('');
                    setMessageContentCol('');
                  }}
                  className="mt-4 flex items-center gap-1.5 text-xs font-semibold px-4 py-2 text-rose-400 hover:bg-rose-500/10 border border-rose-800/40 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  파일 삭제 / 변경
                </button>
              </div>
            ) : (
              <div
                onDragOver={(e) => onDragOver(e, 'msg')}
                onDragLeave={() => onDragLeave('msg')}
                onDrop={(e) => onDrop(e, 'msg')}
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all bg-slate-800/30 backdrop-blur-xs relative overflow-hidden flex flex-col items-center justify-center min-h-[260px] ${
                  dragOverMessage 
                    ? 'border-sky-500 bg-sky-500/10 shadow-lg shadow-sky-500/5' 
                    : 'border-slate-700 hover:border-slate-600'
                }`}
              >
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  id="message-upload-input"
                  className="hidden"
                  onChange={(e) => {
                    const files = e.target.files;
                    if (files && files.length > 0) handleFileLoad(files[0], 'message');
                  }}
                />
                <div className="w-14 h-14 rounded-2xl bg-slate-900/60 flex items-center justify-center text-slate-400 mb-4 border border-slate-800">
                  <Upload className="w-7 h-7" />
                </div>
                <h3 className="text-sm font-bold text-white">매쓰홀릭 학습이력 파일</h3>
                <p className="text-xs text-slate-400 mt-1.5 max-w-[280px]">
                  학생 식별키(아이디/이름)와 전송할 학습이력(3번째 시트)이 담긴 매쓰홀릭 엑셀 파일을 올려주세요.
                </p>
                <button
                  type="button"
                  onClick={() => handlePickFileWithPicker('message')}
                  className="mt-5 px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-md flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  학습이력 파일 올리기
                </button>
                <div className="text-[10px] text-slate-500 mt-2.5 flex items-center gap-1">
                  <span className="text-purple-400 font-semibold">📥 Downloads 폴더 기본 선택</span>
                  <span>• 3번째 시트 자동 인식</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Display Uploaded File Info Cards */}
        {hasLoadedFiles && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* File Info A */}
            <div className="bg-slate-800/40 rounded-xl border border-slate-700/50 p-4 flex items-center justify-between backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center text-slate-400 border border-slate-800">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase">전화번호부 파일</div>
                  <div className="text-xs font-bold text-white truncate max-w-[240px]" title={phoneBookFile?.name}>
                    {phoneBookFile?.name || '샘플_전화번호부.xlsx'}
                  </div>
                  <div className="text-[10px] text-sky-400 font-medium">총 {phoneBookRows.length}개의 데이터 행 감지됨</div>
                </div>
              </div>
              <button
                onClick={() => {
                  setPhoneBookFile(null);
                  setPhoneBookRows([]);
                  setPhoneBookHeaders([]);
                  setPhoneBookIdCol('');
                  setPhoneBookPhoneCol('');
                }}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* File Info B */}
            <div className="bg-slate-800/40 rounded-xl border border-slate-700/50 p-4 flex items-center justify-between backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center text-slate-400 border border-slate-800">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase">매쓰홀릭 학습이력 파일 (3번째 시트)</div>
                  <div className="text-xs font-bold text-white truncate max-w-[240px]" title={messageFile?.name}>
                    {messageFile?.name || '샘플_매쓰홀릭_학습이력.xlsx'}
                  </div>
                  <div className="text-[10px] text-sky-400 font-medium">총 {messageRows.length}개의 데이터 행 감지됨</div>
                </div>
              </div>
              <button
                onClick={() => {
                  setMessageFile(null);
                  setMessageRows([]);
                  setMessageHeaders([]);
                  setMessageIdCol('');
                  setMessageContentCol('');
                }}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Columns Mapping Selectors (Toggleable Accordion) */}
        {hasLoadedFiles && (
          <div className="bg-[#1E293B]/40 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-xl overflow-hidden transition-all">
            <button
              type="button"
              onClick={() => setIsMappingOpen(!isMappingOpen)}
              className="w-full px-6 py-4 bg-slate-900/50 hover:bg-slate-900/80 flex items-center justify-between text-left transition-colors border-b border-slate-700/30 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-sky-500/10 text-sky-400 rounded-xl border border-sky-500/20">
                  <Settings2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">1. 엑셀 열 매핑 설정</h3>
                    {isMappingComplete ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                        매핑 완료
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold">
                        매핑 필요
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    전화번호부: <strong className="text-sky-300 font-mono">{phoneBookIdCol || '미지정'}</strong>(식별) / <strong className="text-sky-300 font-mono">{phoneBookPhoneCol || '미지정'}</strong>(전화) ↔ 학습이력: <strong className="text-sky-300 font-mono">{messageIdCol || '미지정'}</strong>(식별)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                <span>{isMappingOpen ? '설정 접기' : '매핑 변경/펼치기'}</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isMappingOpen ? 'rotate-180' : ''}`} />
              </div>
            </button>

            {isMappingOpen && (
              <div className="p-6">
                <MappingConfig
                  phoneBookHeaders={phoneBookHeaders}
                  messageHeaders={messageHeaders}
                  phoneBookIdCol={phoneBookIdCol}
                  phoneBookPhoneCol={phoneBookPhoneCol}
                  messageIdCol={messageIdCol}
                  messageContentCol={messageContentCol}
                  onChangePhoneBookId={setPhoneBookIdCol}
                  onChangePhoneBookPhone={setPhoneBookPhoneCol}
                  onChangeMessageId={setMessageIdCol}
                  onChangeMessageContent={setMessageContentCol}
                />
              </div>
            )}
          </div>
        )}

        {/* If files uploaded but column mapping is not set yet */}
        {hasLoadedFiles && !isMappingComplete && (
          <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/20 flex gap-3 text-amber-400 text-xs backdrop-blur-xs">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <h4 className="font-bold text-amber-300">열 매핑 대기 중</h4>
              <p className="mt-1 leading-relaxed text-slate-300">
                전화번호부와 메시지 내용 파일의 어떤 열들을 서로 연동할지 지정을 완료해야 변환 및 대시보드가 활성화됩니다. 상단의 매핑 설정을 클릭하여 확인해 주세요.
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Rules & Configurations (Toggleable Accordion) */}
        {hasLoadedFiles && isMappingComplete && (
          <div className="space-y-6">
            {/* Environment & Filtering Settings Accordion */}
            <div className="bg-[#1E293B]/40 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-xl overflow-hidden transition-all">
              <button
                type="button"
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className="w-full px-6 py-4 bg-slate-900/50 hover:bg-slate-900/80 flex items-center justify-between text-left transition-colors border-b border-slate-700/30 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white">2. 정제 및 변환 환경 설정</h3>
                      <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 text-[10px] font-bold">
                        스마트 자동 분류 & 문구 정제
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      자습테스트/주간평가/진단평가 스마트 자동 분류 조건, 중복제거, 날짜/키워드 제외 옵션 설정
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                  <span>{isSettingsOpen ? '설정 접기' : '펼쳐서 환경설정 변경'}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isSettingsOpen ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {isSettingsOpen && (
                <div className="p-6 space-y-6">
                  <MatholicTemplateConfig
                    settings={settings}
                    onChangeSettings={setSettings}
                    hasLoadedFiles={hasLoadedFiles}
                  />

                  <SettingsPanel 
                    settings={settings} 
                    onChangeSettings={setSettings} 
                  />
                </div>
              )}
            </div>

            {/* Step 4: Summary Analysis Dashboard */}
            <Dashboard 
              stats={stats} 
              onExport={handleExportAligoXlsx} 
              disabledExport={convertedRecords.length === 0} 
            />

            {/* Step 5: Advanced Preview Table */}
            <PreviewTable 
              records={convertedRecords} 
              onUpdateRecord={handleUpdateRecord} 
              onDeleteRecord={handleDeleteRecord}
              excludeKeywords={settings.excludeKeywords}
            />
          </div>
        )}
      </main>

      {/* Footer design with zero AI telemetry details */}
      <footer className="mt-auto bg-[#0B0F19] border-t border-slate-800/80 py-6 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>&copy; {new Date().getFullYear()} <span className="notranslate" translate="no">알리고</span> 문자파일 변환기. All rights reserved.</span>
          <div className="flex gap-4">
            <span className="text-slate-700">|</span>
            <span className="text-slate-400">본 도구는 <span className="notranslate" translate="no">알리고(Aligo)</span> 엑셀 일괄 업로드 규격을 완벽 지원합니다.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

