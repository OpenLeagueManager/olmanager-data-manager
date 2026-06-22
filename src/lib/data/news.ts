import { getEmbeddedNewsCatalog } from "@/data/olmanager/embedded";

export function listEditorialTemplates() {
  return getEmbeddedNewsCatalog().editorials;
}

export function listSeasonPreviews() {
  return getEmbeddedNewsCatalog().seasonPreviews;
}

export function getEditorialTemplate(id: string) {
  return listEditorialTemplates().find((template) => template.id === id);
}

export function getSeasonPreview(id: string) {
  return listSeasonPreviews().find((template) => template.id === id);
}
