import { getEmbeddedMessageCatalog } from "@/data/olmanager/embedded";

export function listSenders() {
  return getEmbeddedMessageCatalog().senders;
}

export function listTriggers() {
  return getEmbeddedMessageCatalog().triggers;
}

export function listTriggerCategories() {
  return [...new Set(listTriggers().map((trigger) => trigger.category))].sort();
}

export function getSender(id: string) {
  return listSenders().find((sender) => sender.id === id);
}

export function getTrigger(id: string) {
  return listTriggers().find((trigger) => trigger.id === id);
}
