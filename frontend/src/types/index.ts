// ─── Shared domain types ─────────────────────────────────────────────────────

export interface Violation {
  id: number;
  code: string;
  name: string;
  description: string;
  severity: 'minor' | 'moderate' | 'major' | 'criminal';
  fine_min: number | null;
  fine_max: number | null;
  fine_base: number | null;
  currency: string;
  license_points: number | null;
  suspension_days: number | null;
  legal_section: string | null;
  act_name: string | null;
  is_cognizable: boolean;
  is_bailable: boolean;
  appeal_window_days: number | null;
  appeal_authority: string | null;
  name_translations: Record<string, string> | null;
  description_translations: Record<string, string> | null;
}

export interface ViolationCategory {
  id: number;
  name: string;
  description: string;
  icon: string | null;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface FineEstimate {
  violation_code: string;
  violation_name: string;
  estimated_fine_min: number;
  estimated_fine_max: number;
  most_likely_fine: number;
  currency: string;
  license_points: number | null;
  legal_section: string | null;
  notes: string;
}

export interface CitationExtraction {
  violation_type: string | null;
  violation_code: string | null;
  fine_amount: number | null;
  currency: string | null;
  violation_date: string | null;
  location: string | null;
  vehicle_number: string | null;
  officer_id: string | null;
  court_date: string | null;
  appeal_deadline: string | null;
  legal_section: string | null;
  notes: string | null;
  error?: string;
}

export interface EnforcementZone {
  id: number;
  name: string;
  zone_type: string;
  latitude: number;
  longitude: number;
  radius_meters: number | null;
}

export interface Lawyer {
  id: number;
  name: string;
  specializations: string[];
  languages: string[];
  country_code: string;
  state_code: string | null;
  contact_email: string | null;
  contact_phone: string | null;
}

export interface UserProfile {
  id: number;
  email: string;
  full_name: string;
  country_code: string | null;
  state_code: string | null;
  license_number: string | null;
}

export interface RiskScore {
  score: number;           // 0–100
  category: 'low' | 'medium' | 'high' | 'critical';
  factors: string[];
}

export interface Country {
  code: string;
  name: string;
}

export interface State {
  code: string;
  name: string;
  country_code: string;
}

// ─── Blockchain ───────────────────────────────────────────────────────────────

export interface BlockchainRecord {
  record_id:      string;
  driver_did:     string;
  violation_code: string;
  country_code:   string;
  data_hash:      string;
  is_paid:        boolean;
  is_appealed:    boolean;
  created_at:     string;
  updated_at?:    string;
}

// ─── Gamification ─────────────────────────────────────────────────────────────

export interface Badge {
  key:         string;
  name:        string;
  icon:        string;
  tier:        'bronze' | 'silver' | 'gold' | 'platinum';
  points:      number;
  description: string;
  criteria?:   Record<string, number>;
  earned_at?:  string;
}

export interface LeaderboardEntry {
  rank:             number;
  user_id:          number;
  display_name:     string;
  score:            number;
  badge_count:      number;
  violations_count: number;
  region_key:       string;
  period:           string;
}

export interface InsuranceDeal {
  name:          string;
  discount_pct:  number;
  description:   string;
  affiliate_url: string | null;
  country_codes: string[];
  eligible:      boolean;
}

// ─── Computer Vision ──────────────────────────────────────────────────────────

export interface DetectedSign {
  sign_key:          string;
  label:             string;
  type:              string;
  confidence:        number;
  legal_implication: string;
}

export interface SignAnalysisResult {
  detected:  boolean;
  signs:     DetectedSign[];
  model:     string;
  mock:      boolean;
}

export interface SpeedLimitResult {
  detected:          boolean;
  speed_limit:       number | null;
  unit:              string;
  confidence:        number;
  legal_implication: string;
  mock?:             boolean;
}

export interface VehicleIssue {
  issue:      string;
  severity:   string;
  violation?: string;
  note?:      string;
}

export interface VehicleAnalysisResult {
  issues_found:  boolean;
  issue_count:   number;
  issues:        VehicleIssue[];
  image_quality: string;
  mock?:         boolean;
}
