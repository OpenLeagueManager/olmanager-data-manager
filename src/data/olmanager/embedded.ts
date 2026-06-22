import embeddedMessageSenders from "@/data/embedded/messages/senders.json";
import embeddedNewsTemplatesJson from "@/data/embedded/news/templates.json";
import manifest from "@/data/embedded/lec/manifest.json";
import playersFile from "@/data/embedded/lec/players.json";
import staffFile from "@/data/embedded/lec/staff.json";
import teamsFile from "@/data/embedded/lec/teams.json";
import embeddedSocialAccounts from "@/data/embedded/social/accounts.json";
import embeddedSocialTemplatesFile from "@/data/embedded/social/templates.json";
import type {
  CompetitionData,
  MatchTextData,
  MessageCatalog,
  MessageSender,
  NewsTemplate,
  Player,
  SocialAccountData,
  SocialCatalog,
  SocialTemplateData,
  Staff,
  Team,
} from "./types";

export const embeddedLecCompetition: CompetitionData = {
  manifest,
  teams: teamsFile.teams as Team[],
  players: playersFile.players as Player[],
  staff: staffFile.staff as Staff[],
};

export const embeddedSocialCatalog: SocialCatalog = {
  accounts: embeddedSocialAccounts as SocialAccountData[],
  templates: embeddedSocialTemplatesFile.templates as SocialTemplateData[],
  matchTexts: [] as MatchTextData[],
};

export const embeddedNewsTemplates: NewsTemplate[] = embeddedNewsTemplatesJson as NewsTemplate[];

export const embeddedMessageCatalog: MessageCatalog = {
  senders: embeddedMessageSenders as MessageSender[],
};

export function getEmbeddedCompetition(): CompetitionData {
  return embeddedLecCompetition;
}

export function getEmbeddedPlayer(id: string): Player | undefined {
  return embeddedLecCompetition.players.find((player) => player.id === id);
}

export function getEmbeddedTeam(id: string): Team | undefined {
  return embeddedLecCompetition.teams.find((team) => team.id === id);
}

export function getEmbeddedStaff(id: string): Staff | undefined {
  return embeddedLecCompetition.staff.find((staff) => staff.id === id);
}

export function getEmbeddedSocialCatalog(): SocialCatalog {
  return embeddedSocialCatalog;
}

export function getEmbeddedNewsTemplate(id: string): NewsTemplate | undefined {
  return embeddedNewsTemplates.find((template) => template.id === id);
}

export function getEmbeddedMessageCatalog(): MessageCatalog {
  return embeddedMessageCatalog;
}
