import { getEmbeddedSocialCatalog } from "@/data/olmanager/embedded";

export function listSocialAccounts() {
  return getEmbeddedSocialCatalog().accounts;
}

export function listSocialTemplates() {
  return getEmbeddedSocialCatalog().templates;
}

export function getSocialAccount(id: string) {
  return listSocialAccounts().find((account) => account.id === id);
}

export function getSocialTemplate(id: string) {
  return listSocialTemplates().find((template) => template.id === id);
}
