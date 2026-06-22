// Domain types mirrored from OpenLeagueManager canonical data.
//
// Rust source of truth for competition/team/player/staff file shapes:
//   OLManager/src-tauri/crates/olm_core/src/generator/definitions.rs
// Runtime TS types and relationships:
//   OLManager/src/store/types.ts
// LoL OVR formula parity anchor:
//   OLManager/src/lib/players/lolPlayerStats.ts::calculateLolOvr

export type LoLRole = "Top" | "Jungle" | "Mid" | "Adc" | "Support";

export const LOL_ROLES: readonly LoLRole[] = ["Top", "Jungle", "Mid", "Adc", "Support"];

export type PlayerAttributes = {
  mechanics: number;
  laning: number;
  teamfighting: number;
  macro_play: number;
  consistency: number;
  shotcalling: number;
  champion_pool: number;
  discipline: number;
  mental_resilience: number;
};

export const PLAYER_ATTRIBUTE_KEYS: readonly (keyof PlayerAttributes)[] = [
  "mechanics",
  "laning",
  "teamfighting",
  "macro_play",
  "consistency",
  "shotcalling",
  "champion_pool",
  "discipline",
  "mental_resilience",
];

export type StaffAttributes = {
  coaching: number;
  physiotherapy: number;
  judging_ability: number;
  judging_potential: number;
};

export const STAFF_ATTRIBUTE_KEYS: readonly (keyof StaffAttributes)[] = [
  "coaching",
  "physiotherapy",
  "judging_ability",
  "judging_potential",
];

export type StaffRole =
  | "Assistant"
  | "Performance Coach"
  | "HeadCoach"
  | "Scout"
  | "Owner"
  | string;

export type NewPlayerInput = {
  full_name: string;
  match_name: string;
  position: LoLRole;
  team_id: string;
  nationality: string;
  wage: number;
  market_value: number;
  attributes: PlayerAttributes;
  date_of_birth: string;
  contract_end: string;
};

export type NewStaffInput = {
  first_name: string;
  last_name: string;
  role: StaffRole;
  team_id: string;
  nationality: string;
  wage: number;
  attributes: StaffAttributes;
  contract_end: string;
  date_of_birth: string;
};

export type Player = {
  id: string;
  full_name: string;
  match_name: string;
  position: LoLRole;
  team_id: string;
  nationality: string;
  wage: number;
  market_value: number;
  attributes: PlayerAttributes;
  date_of_birth: string;
  contract_end: string;
  transfer_listed: boolean;
  loan_listed: boolean;
};

export type Staff = {
  id: string;
  first_name: string;
  last_name: string;
  nickname: string | null;
  role: StaffRole;
  team_id: string;
  nationality: string;
  wage: number | null;
  attributes: StaffAttributes | null;
  contract_end: string;
  date_of_birth: string;
};

export type TeamColors = {
  primary: string;
  secondary: string;
};

export type Facilities = {
  medical: number;
  scouting: number;
  training: number;
  main_hub_level: number;
  scrims_room_level: number;
  scouting_lab_level: number;
  analysis_room_level: number;
  bootcamp_area_level: number;
  content_studio_level: number;
  recovery_suite_level: number;
};

export type LolTactics = {
  fight_plan: string;
  strong_side: string;
  jungle_style: string;
  draft_strategy: string;
  support_roaming: string;
};

export type Team = {
  id: string;
  name: string;
  short_name: string;
  country: string;
  city: string;
  finance: number;
  manager_id: string | null;
  reputation: number;
  wage_budget: number;
  transfer_budget: number;
  season_income: number;
  season_expenses: number;
  colors: TeamColors;
  facilities: Facilities;
  lol_tactics: LolTactics;
  training_focus: string;
  training_intensity: string;
  training_schedule: string;
  active: boolean;
  logo_url: string;
  team_kind: string;
  parent_team_id: string | null;
  academy_team_id: string | null;
};

export type CompetitionManifest = {
  id: string;
  name: string;
  full_name: string;
  region: string;
  country: string;
  tier: number;
  logo: string;
  active: boolean;
  legacy?: boolean;
  teams_file: string;
  players_file: string;
  staff_file: string | null;
  schedule: unknown;
};

export type CompetitionData = {
  manifest: CompetitionManifest;
  teams: Team[];
  players: Player[];
  staff: Staff[];
};

export type SocialAuthorType =
  | "Team"
  | "Player"
  | "Fan"
  | "Analyst"
  | "Journalist"
  | "MemeAccount"
  | "Manager";

export type SocialAccountData = {
  id: string;
  language: string;
  display_name: string;
  handle: string;
  author_type: SocialAuthorType;
  profile_image_url: string | null;
  favorite_team_ids: string[];
  active: boolean;
};

export type SocialTemplateData = {
  id: string;
  language: string;
  slot: string;
  author_id: string | null;
  conditions_json: string | null;
  variants: string[];
  tags: string[];
  weight: number;
  active: boolean;
};

export type MatchTextData = {
  key: string;
  texts: Record<string, string[]>;
};

export type SocialCatalog = {
  accounts: SocialAccountData[];
  templates: SocialTemplateData[];
  matchTexts: MatchTextData[];
};

export type NewsArticle = {
  id: string;
  headline: string;
  body: string;
  source: string;
  date: string;
  category: string;
  team_ids: string[];
  player_ids: string[];
  match_score: unknown;
  read: boolean;
};

export type MessageSender = {
  id: string;
  name: string;
  role: string;
  icon: string;
};

export type MessageCatalog = {
  senders: MessageSender[];
};
