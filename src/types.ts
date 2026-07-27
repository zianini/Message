export interface PhoneBookRecord {
  idOrName: string;
  phoneNumber: string;
  rawRow: Record<string, any>;
}

export interface MessageRecord {
  idOrName: string;
  content: string;
  rawRow?: Record<string, any>;
  overrideCourseName?: string;
}

export interface ConvertedRecord {
  index: number;
  idOrName: string;
  originalPhone: string;
  correctedPhone: string;
  originalContent: string;
  correctedContent: string;
  bytes: number;
  messageType: 'SMS' | 'LMS';
  status: 'success' | 'corrected' | 'unclassified' | 'filtered_duplicate' | 'filtered_keyword' | 'filtered_odaub_yusa' | 'invalid';
  statusReason?: string;
  courseName?: string;
  evalType?: string;
  isCourseNameMissing?: boolean;
  isUnclassified?: boolean;
  rawRow?: Record<string, any>;
}

export interface ConverterSettings {
  deduplicate: boolean;
  deduplicateStrategy: 'keep_highest_score' | 'keep_first' | 'keep_last';
  excludeKeywords: string[];
  phoneBookIdCol: string;
  phoneBookPhoneCol: string;
  messageIdCol: string;
  messageContentCol: string;
  addHeader: boolean;
  headerPhoneName: string;
  headerContentName: string;
  // Matholic specialized settings
  templateMode: 'auto' | 'type1' | 'type2';
  template1: string;
  template2: string;
  excludeOdaubYusa: boolean;
  excludeDates: boolean;
}

export interface DashboardStats {
  totalProcessed: number;
  successCount: number;
  correctedCount: number;
  duplicateCount: number;
  keywordFilteredCount: number;
  invalidCount: number;
  smsCount: number;
  lmsCount: number;
  totalBytes: number;
}
