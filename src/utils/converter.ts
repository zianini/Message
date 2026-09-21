import { ConvertedRecord, ConverterSettings, DashboardStats, MessageRecord } from '../types';

/**
 * Calculates the byte length of a string under standard Korean SMS rules (EUC-KR approximation):
 * - ASCII characters: 1 byte
 * - Korean / non-ASCII characters: 2 bytes
 */
export function getByteLength(str: string): number {
  if (!str) return 0;
  let byteLen = 0;
  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i);
    if (charCode <= 0x007f) {
      byteLen += 1; // English, numbers, spaces, standard punctuation
    } else {
      byteLen += 2; // Hangul, Chinese characters, full-width symbols
    }
  }
  return byteLen;
}

/**
 * Clean and format a Korean phone number into the standard "010-XXXX-XXXX" format.
 * Automatically handles:
 * - Hyphens or spaces: "010 1234 5678" -> "010-1234-5678"
 * - Country code: "821012345678" or "+82 10-1234-5678" -> "010-1234-5678"
 * - Missing leading zero: "1012345678" -> "010-1234-5678"
 * Returns an object with the corrected number and a flag indicating if it was auto-corrected.
 */
export function cleanAndFormatPhoneNumber(phoneRaw: string | number | null | undefined): {
  isValid: boolean;
  formatted: string;
  isCorrected: boolean;
  reason?: string;
} {
  if (phoneRaw === null || phoneRaw === undefined) {
    return { isValid: false, formatted: '', isCorrected: false, reason: '전화번호가 누락되었습니다.' };
  }

  const rawString = String(phoneRaw).trim();
  if (!rawString) {
    return { isValid: false, formatted: '', isCorrected: false, reason: '전화번호가 비어있습니다.' };
  }

  // Extract digits only
  let digits = rawString.replace(/\D/g, '');

  // Handle international code (e.g., 821012345678)
  if (digits.startsWith('82') && digits.length >= 11) {
    digits = '0' + digits.slice(2);
  }

  // Handle missing leading zero for standard Korean mobiles (e.g., 1012345678)
  if (digits.startsWith('10') && digits.length === 10) {
    digits = '0' + digits;
  }

  // Validate basic Korean mobile phone formats:
  // Usually starts with 010, 011, 016, 017, 018, 019
  // Lengths: 10 or 11 digits
  if (!digits.startsWith('01')) {
    return {
      isValid: false,
      formatted: rawString,
      isCorrected: false,
      reason: '올바른 한국 핸드폰 번호 형식(010으로 시작)이 아닙니다.',
    };
  }

  if (digits.length !== 10 && digits.length !== 11) {
    return {
      isValid: false,
      formatted: rawString,
      isCorrected: false,
      reason: `전화번호 자릿수가 올바르지 않습니다. (현재 ${digits.length}자리)`,
    };
  }

  // Format as 010-XXXX-XXXX or 01X-XXX-XXXX
  let formatted = '';
  if (digits.length === 11) {
    formatted = `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  } else {
    // 10 digits
    formatted = `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  const isCorrected = formatted !== rawString;

  return {
    isValid: true,
    formatted,
    isCorrected,
    reason: isCorrected ? '번호 형식이 표준 규격(010-0000-0000)으로 교정되었습니다.' : undefined,
  };
}

// 엑셀 로우에서 특정 패턴의 키 값을 추출하는 헬퍼
export function getValueByKeywords(row: Record<string, any> | undefined, keywords: string[]): string {
  if (!row) return '';
  
  // 1단계: 정확히 일치하는 컬럼 헤더가 있는지 먼저 확인 (완전 일치 우선)
  for (const key of Object.keys(row)) {
    const cleanKey = key.trim().toLowerCase();
    if (keywords.some(k => cleanKey === k.toLowerCase())) {
      return String(row[key] || '').trim();
    }
  }

  // 2단계: 부분 일치 확인 (단, 오탐지를 방지하기 위한 예외 처리 포함)
  for (const key of Object.keys(row)) {
    const cleanKey = key.trim().toLowerCase();
    
    // 시험지명/학습명/제목 등을 찾을 때 '학습일', '학습유형' 등의 날짜/타입 컬럼이 잘못 매칭되는 것을 방지
    const isSearchingForExam = keywords.includes('시험지명') || keywords.includes('시험명') || keywords.includes('학습명') || keywords.includes('제목');
    if (isSearchingForExam) {
      if (cleanKey.includes('일') || cleanKey.includes('date') || cleanKey.includes('유형') || cleanKey.includes('구분') || cleanKey.includes('type')) {
        continue;
      }
    }

    if (keywords.some(k => cleanKey.includes(k.toLowerCase()))) {
      return String(row[key] || '').trim();
    }
  }
  return '';
}

// 점수 문자열을 숫자로 안전하게 파싱하는 헬퍼
export function parseScore(scoreStr: string): number {
  if (!scoreStr) return 0;
  const numStr = scoreStr.replace(/[^0-9.]/g, '');
  const parsed = parseFloat(numStr);
  return isNaN(parsed) ? 0 : parsed;
}

// 금요일인지 체크하는 헬퍼
export function isFriday(dateStr: string): boolean {
  if (!dateStr) return false;
  const clean = dateStr.trim();
  
  const num = Number(clean);
  if (!isNaN(num) && num > 40000 && num < 60000) {
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + num * 24 * 60 * 60 * 1000);
    return date.getDay() === 5;
  }

  const matchK = clean.match(/(?:(\d{4})년\s*)?(\d{1,2})월\s*(\d{1,2})일/);
  if (matchK) {
    const year = matchK[1] ? parseInt(matchK[1]) : new Date().getFullYear();
    const month = parseInt(matchK[2]) - 1;
    const day = parseInt(matchK[3]);
    const date = new Date(year, month, day);
    return date.getDay() === 5;
  }

  const matchDots = clean.match(/(?:(\d{2,4})[-./])?(\d{1,2})[-./](\d{1,2})/);
  if (matchDots) {
    let year = new Date().getFullYear();
    if (matchDots[1]) {
      const parsedYear = parseInt(matchDots[1]);
      if (parsedYear < 100) {
        year = 2000 + parsedYear;
      } else {
        year = parsedYear;
      }
    }
    const month = parseInt(matchDots[2]) - 1;
    const day = parseInt(matchDots[3]);
    const date = new Date(year, month, day);
    return date.getDay() === 5;
  }

  if (clean.includes('(금)') || clean.includes('금요일') || clean.toLowerCase().includes('fri')) {
    return true;
  }

  const parsedDate = new Date(clean);
  if (!isNaN(parsedDate.getTime())) {
    return parsedDate.getDay() === 5;
  }

  return false;
}

// 과정명(5-1, 공통수학1 등) 추출 헬퍼
export function extractCourseName(examName: string, content: string, row?: Record<string, any>): string {
  const courses = [
    '5-1', '5-2', '6-1', '6-2', '1-1', '1-2', '2-1', '2-2', '3-1', '3-2',
    '공통수학1', '공통수학2', '대수', '미적분Ⅰ', '확률과 통계', '확통', '미적분2', '기하'
  ];
  // 1. Check examName first
  for (const course of courses) {
    if (examName.includes(course)) {
      return course;
    }
  }
  // 2. Check all string values in the row (especially '학습명' or other custom columns)
  if (row) {
    for (const key of Object.keys(row)) {
      const val = String(row[key] || '');
      for (const course of courses) {
        if (val.includes(course)) {
          return course;
        }
      }
    }
  }
  // 3. Check content
  for (const course of courses) {
    if (content.includes(course)) {
      return course;
    }
  }
  return '';
}

// 시험지명(학습명)에서 날짜 형식('7월 10일', '07.10', '7/10', '2026-07-10' 등) 및 요일을 제거하는 헬퍼
export function stripDateFromName(name: string): string {
  if (!name) return '';
  let clean = name;

  // 1. 괄호와 요일이 붙은 날짜 패턴 -> (7/10), [07.10], (7월 10일 금), [7월 10일(금)] 등 제거
  clean = clean.replace(/[([{\s]*(?:\d{4}년\s*)?\d{1,2}월\s*\d{1,2}일(?:\s*\([월화수목금토일]\))?[\])}\s]*/gi, ' ');
  clean = clean.replace(/[([{\s]*\d{1,2}[-./]\d{1,2}(?:\s*\([월화수목금토일]\))?[\])}\s]*/gi, ' ');

  // 2. 일반 날짜 패턴 -> 2026년 7월 10일, 7월 10일, 2026-07-10, 7/10 등 제거
  clean = clean.replace(/(?:\d{4}년\s*)?\d{1,2}월\s*\d{1,2}일/gi, ' ');
  clean = clean.replace(/\d{4}[-./]\d{1,2}[-./]\d{1,2}/gi, ' ');
  clean = clean.replace(/\b\d{1,2}[-./]\d{1,2}\b/gi, ' ');

  // 3. 요일 단독 패턴 -> (금), (월), 금요일 등 제거
  clean = clean.replace(/[([{\s]*[월화수목금토일]요일[\])}\s]*/gi, ' ');
  clean = clean.replace(/[([{\s]*\([월화수목금토일]\)[\])}\s]*/gi, ' ');

  // 공백 정리
  clean = clean.replace(/\s+/g, ' ').trim();
  return clean;
}

// 날짜 문자열에서 월(Month)을 추출하는 헬퍼
export function getMonthFromDate(dateStr: string): number {
  if (!dateStr) return new Date().getMonth() + 1;
  const clean = dateStr.trim();
  
  const num = Number(clean);
  if (!isNaN(num) && num > 40000 && num < 60000) {
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + num * 24 * 60 * 60 * 1000);
    return date.getMonth() + 1;
  }

  const matchK = clean.match(/(?:(\d{4})년\s*)?(\d{1,2})월\s*(\d{1,2})일/);
  if (matchK) {
    return parseInt(matchK[2], 10);
  }

  const matchDots = clean.match(/(?:(\d{2,4})[-./])?(\d{1,2})[-./](\d{1,2})/);
  if (matchDots) {
    return parseInt(matchDots[2], 10);
  }

  const parsedDate = new Date(clean);
  if (!isNaN(parsedDate.getTime())) {
    return parsedDate.getMonth() + 1;
  }

  return new Date().getMonth() + 1;
}

// 주간평가 / 진단평가 / 자습테스트 평가유형 자동 분류 헬퍼
export function determineEvaluationType(
  row: Record<string, any> | undefined,
  examName: string,
  learningType: string
): string {
  const cleanType = (learningType || '').trim().toLowerCase();
  const cleanExam = (examName || '').trim().toLowerCase();

  // 1. 최우선 규칙: 학습유형이 "진단평가"이더라도 제목(학습명)에 "자습"이 있으면 "자습테스트"로 분류
  //    (제목/시험지명에 "자습" 또는 "자습테스트"가 포함되어 있으면 최우선으로 "자습테스트")
  if (cleanExam.includes('자습') || cleanExam.includes('자습테스트')) {
    return '자습테스트';
  }

  // 2. 자습테스트: 학습유형이 "학습지" 포함 + 학습명에 "lv" 포함
  if (cleanType.includes('학습지')) {
    if (cleanExam.includes('lv')) {
      return '자습테스트';
    }
  }

  // 3. 학습유형이 "진단평가" 포함
  if (cleanType.includes('진단평가')) {
    // 3-1. 주간평가: 학습명에 "주간평가", "주간 평가" 포함
    if (cleanExam.includes('주간평가') || cleanExam.includes('주간 평가')) {
      return '주간평가';
    }

    // 3-2. 진단평가: 학습명에 "진단평가", "진단 평가" 포함
    if (cleanExam.includes('진단평가') || cleanExam.includes('진단 평가')) {
      const dateStr = getValueByKeywords(row, ['완료일', '학습일', '날짜', 'date', '일자', '완료일자']);
      const month = getMonthFromDate(dateStr);
      return `${month}월 진단평가`;
    }
  }

  // 4. 학습유형 컬럼이 비어있거나 매칭되지 않더라도 학습명에 주간평가/진단평가가 명확히 명시된 경우
  if (cleanExam.includes('주간평가') || cleanExam.includes('주간 평가')) {
    return '주간평가';
  }
  if (cleanExam.includes('진단평가') || cleanExam.includes('진단 평가')) {
    const dateStr = getValueByKeywords(row, ['완료일', '학습일', '날짜', 'date', '일자', '완료일자']);
    const month = getMonthFromDate(dateStr);
    return `${month}월 진단평가`;
  }

  // 5. 그 밖에 예외 사항: 위 조건을 만족하지 못하는 경우 미분류('')
  return '';
}

// 메시지 내용 및 관련 메타데이터를 세부 생성하는 헬퍼
export function generateMessageContentDetail(
  row: Record<string, any> | undefined,
  settings: ConverterSettings,
  defaultContent: string,
  forceOriginalExam: boolean = false,
  overrideCourseName?: string
): {
  content: string;
  evalType: string;
  courseName: string;
  isCourseNameMissing: boolean;
  isUnclassified: boolean;
} {
  if (!row) {
    return {
      content: defaultContent,
      evalType: '미분류',
      courseName: '',
      isCourseNameMissing: true,
      isUnclassified: true,
    };
  }

  const name = getValueByKeywords(row, ['학생명', '학생이름', '이름', 'name']);
  const exam = getValueByKeywords(row, ['시험지명', '시험명', '평가명', '평가이름', '시험지', '평가', '학습명', '학습', '제목', '학습제목', 'title']);
  const scoreStr = getValueByKeywords(row, ['점수', '득점', '성적', 'score']);
  const learningType = getValueByKeywords(row, ['학습유형', '유형', '구분', 'type']);
  
  // 필수 필드가 하나도 없으면 일반 메시지로 간주하고 기본값 유지
  if (!name && !exam && !scoreStr) {
    return {
      content: defaultContent,
      evalType: '미분류',
      courseName: '',
      isCourseNameMissing: true,
      isUnclassified: true,
    };
  }

  // 과정명 및 평가유형 추출
  let examName = exam || '';
  if (settings.excludeDates) {
    examName = stripDateFromName(examName);
  }

  const detectedCourse = extractCourseName(examName, defaultContent, row);
  const courseName = overrideCourseName !== undefined ? overrideCourseName : detectedCourse;
  const isCourseNameMissing = !courseName.trim();

  const rawEvalType = determineEvaluationType(row, examName, learningType);
  const isUnclassified = !rawEvalType;
  const evalType = rawEvalType || '미분류';

  // 평가명 포맷 구축
  let formattedExam = examName;
  if (!forceOriginalExam) {
    if (courseName && rawEvalType) {
      formattedExam = `${evalType}(${courseName})`;
    } else if (courseName) {
      formattedExam = `${evalType}(${courseName})`;
    } else if (rawEvalType) {
      formattedExam = evalType;
    } else {
      formattedExam = examName || '미분류';
    }
  }

  // 템플릿 모드 선택
  let template = '';
  const isAssessment = evalType.includes('진단평가') || evalType.includes('주간평가');

  if (settings.templateMode === 'auto') {
    template = isAssessment ? settings.template1 : settings.template2;
  } else if (settings.templateMode === 'type1') {
    template = settings.template1;
  } else {
    template = settings.template2;
  }

  // 플레이스홀더 치환
  const cleanName = name || '학생';
  const cleanScore = scoreStr || '0';
  const displayCourseName = courseName || '[과정명]';

  let content = template
    .replace(/{이름}/g, cleanName)
    .replace(/{학생이름}/g, cleanName)
    .replace(/{평가명}/g, formattedExam)
    .replace(/{평가이름}/g, formattedExam)
    .replace(/{학습명}/g, formattedExam)
    .replace(/{학습}/g, formattedExam)
    .replace(/{과정명}/g, displayCourseName)
    .replace(/{과정}/g, displayCourseName)
    .replace(/{평가유형}/g, evalType)
    .replace(/{평가구분}/g, evalType)
    .replace(/{점수}/g, cleanScore);

  return {
    content,
    evalType,
    courseName,
    isCourseNameMissing,
    isUnclassified,
  };
}

// 기존 인터페이스 호환을 위한 단순 래퍼
export function generateMessageContent(
  row: Record<string, any> | undefined,
  settings: ConverterSettings,
  defaultContent: string,
  forceOriginalExam: boolean = false,
  overrideCourseName?: string
): string {
  return generateMessageContentDetail(row, settings, defaultContent, forceOriginalExam, overrideCourseName).content;
}

/**
 * Processes the list of matched records and filters them based on settings.
 */
export function convertAndFilterRecords(
  phoneBook: { idOrName: string; phone: string }[],
  messageList: MessageRecord[],
  settings: ConverterSettings
): ConvertedRecord[] {
  const convertedList: ConvertedRecord[] = [];

  // Create lookup dictionary for phone book (ID/Name -> Phone)
  const phoneLookup = new Map<string, string>();
  phoneBook.forEach((row) => {
    const key = String(row.idOrName).trim().toLowerCase();
    if (key && row.phone) {
      phoneLookup.set(key, String(row.phone).trim());
    }
  });

  // Keep track of counts for deduplication if enabled
  const seenPhoneNumbers = new Set<string>();
  const temporaryRecords: ConvertedRecord[] = [];

  messageList.forEach((msgRow, index) => {
    const idKey = String(msgRow.idOrName).trim().toLowerCase();
    const originalPhone = phoneLookup.get(idKey) || '';
    
    // 1. Determine if this is an excluded '오답유사'/'오답유사학습' record first
    const learningType = getValueByKeywords(msgRow.rawRow, ['학습유형', '유형', '구분', 'type']);
    const isOdaubYusa = settings.excludeOdaubYusa && (learningType === '오답유사' || learningType === '오답유사학습');

    // 2. Generate customized message content based on learning history templates if available
    const genDetail = generateMessageContentDetail(
      msgRow.rawRow,
      settings,
      msgRow.content,
      isOdaubYusa,
      msgRow.overrideCourseName
    );

    let content = genDetail.content;

    // Apply excludeKeywords filter: remove those keywords from content, NOT excluding the message itself
    const removedKeywords: string[] = [];
    if (settings.excludeKeywords.length > 0) {
      settings.excludeKeywords.forEach((keyword) => {
        const trimmed = keyword.trim();
        if (trimmed) {
          const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(escaped, 'gi');
          if (regex.test(content)) {
            content = content.replace(regex, '');
            removedKeywords.push(trimmed);
          }
        }
      });
    }

    const phoneEval = cleanAndFormatPhoneNumber(originalPhone);
    const bytes = getByteLength(content);
    const messageType = bytes > 90 ? 'LMS' : 'SMS';

    // Base Record
    const record: ConvertedRecord = {
      index,
      idOrName: msgRow.idOrName,
      originalPhone,
      correctedPhone: phoneEval.isValid ? phoneEval.formatted : originalPhone,
      originalContent: msgRow.content,
      correctedContent: content,
      bytes,
      messageType,
      status: 'success',
      courseName: genDetail.courseName,
      evalType: genDetail.evalType,
      isCourseNameMissing: genDetail.isCourseNameMissing,
      isUnclassified: genDetail.isUnclassified,
      rawRow: msgRow.rawRow,
    };

    // 4. Validation & Classification check
    if (isOdaubYusa) {
      record.status = 'filtered_odaub_yusa';
      record.statusReason = "학습유형이 '오답유사' 또는 '오답유사학습'이므로 발송에서 제외되었습니다.";
    } else if (!originalPhone) {
      record.status = 'invalid';
      record.statusReason = `전화번호부에서 '${msgRow.idOrName}'에 매칭되는 번호를 찾을 수 없습니다.`;
    } else if (!phoneEval.isValid) {
      record.status = 'invalid';
      record.statusReason = phoneEval.reason;
    } else if (!content.trim()) {
      record.status = 'invalid';
      record.statusReason = '메시지 내용이 비어있습니다.';
    } else if (genDetail.isUnclassified) {
      // 스마트 자동 분류 예외건
      record.status = 'unclassified';
      record.statusReason = '스마트 자동 분류 조건(자습테스트/주간평가/진단평가)에 부합하지 않는 예외 건입니다. 문자 내용이나 처리 여부를 확인해주세요.';
    } else {
      if (record.status === 'success' && phoneEval.isCorrected) {
        record.status = 'corrected';
        record.statusReason = phoneEval.reason;
      }
      
      // 제외 키워드가 제거된 경우 상태를 corrected로 표시하고 정보 제공
      if (removedKeywords.length > 0) {
        if (record.status === 'success') {
          record.status = 'corrected';
          record.statusReason = `제외 문자열(${removedKeywords.join(', ')}) 제거`;
        } else if (record.status === 'corrected') {
          record.statusReason = `${record.statusReason} & 제외 문자열 제거`;
        }
      }
    }

    temporaryRecords.push(record);
  });

  // 7. Deduplication filter by phone number (Only among active sendable candidates - Always keep the highest score)
  if (settings.deduplicate) {
    // 폰번호별로 가장 높은 점수와 그 인덱스를 찾음
    const highestScorePerPhone = new Map<string, { maxScore: number; recordIdx: number }>();
    
    temporaryRecords.forEach((record, idx) => {
      if (record.status === 'success' || record.status === 'corrected') {
        const phone = record.correctedPhone;
        const msgRow = messageList[idx];
        const scoreStr = getValueByKeywords(msgRow.rawRow, ['점수', '득점', '성적', 'score']);
        const score = parseScore(scoreStr);
        
        const existing = highestScorePerPhone.get(phone);
        if (!existing || score > existing.maxScore) {
          highestScorePerPhone.set(phone, { maxScore: score, recordIdx: idx });
        }
      }
    });

    // 가장 높은 점수가 아닌 레코드들은 중복 처리
    temporaryRecords.forEach((record, idx) => {
      if (record.status === 'success' || record.status === 'corrected') {
        const phone = record.correctedPhone;
        const best = highestScorePerPhone.get(phone);
        if (best && best.recordIdx !== idx) {
          const currentScore = parseScore(getValueByKeywords(messageList[idx].rawRow, ['점수', '득점', '성적', 'score']));
          record.status = 'filtered_duplicate';
          record.statusReason = `동일 수신처(${phone})의 더 높은 점수 메시지가 존재하여 제외되었습니다. (현재: ${currentScore}점 / 최고: ${best.maxScore}점)`;
        }
      }
    });
  }

  return temporaryRecords;
}

/**
 * Calculates Dashboard Stats from processed records
 */
export function calculateStats(records: ConvertedRecord[]): DashboardStats {
  const stats: DashboardStats = {
    totalProcessed: records.length,
    successCount: 0,
    correctedCount: 0,
    duplicateCount: 0,
    keywordFilteredCount: 0,
    invalidCount: 0,
    smsCount: 0,
    lmsCount: 0,
    totalBytes: 0,
  };

  records.forEach((r) => {
    switch (r.status) {
      case 'success':
        stats.successCount++;
        break;
      case 'corrected':
        stats.correctedCount++;
        break;
      case 'filtered_duplicate':
        stats.duplicateCount++;
        break;
      case 'filtered_keyword':
      case 'filtered_odaub_yusa':
        stats.keywordFilteredCount++;
        break;
      case 'invalid':
      case 'unclassified':
        stats.invalidCount++;
        break;
    }

    // Only count SMS/LMS and bytes for valid sendable items (success and corrected)
    if (r.status === 'success' || r.status === 'corrected') {
      stats.totalBytes += r.bytes;
      if (r.messageType === 'SMS') {
        stats.smsCount++;
      } else {
        stats.lmsCount++;
      }
    }
  });

  return stats;
}
