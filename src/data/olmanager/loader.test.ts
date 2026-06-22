// @vitest-environment node

import { describe, expect, it } from "vitest";
import {
  assertEmbeddedInSyncWithData,
  assertEmbeddedMatches,
  EmbeddedDataDriftError,
} from "@/data/embedded-check";
import { embeddedLecCompetition } from "@/data/olmanager/embedded";
import type { CompetitionData } from "@/data/olmanager/types";
import { loadCompetition, loadCompetitions, loadMessageCatalog, loadNewsTemplates, loadSocialCatalog } from "./loader";

describe("canonical data loaders", () => {
  it("loads LEC as typed competition data", async () => {
    const lec = await loadCompetition("lec");

    expect(lec.manifest.id).toBe("lec");
    expect(lec.teams.length).toBeGreaterThan(0);
    expect(lec.players.length).toBeGreaterThan(0);
    expect(lec.teams.some((team) => team.id === "lec-g2-esports")).toBe(true);
    expect(lec.players.some((player) => player.id === "lec-player-98767975968177297")).toBe(true);
  });

  it("lists active non-legacy competitions", async () => {
    const competitions = await loadCompetitions();
    const lec = competitions.find((competition) => competition.id === "lec");
    expect(lec).toBeDefined();
    expect(lec?.active).toBe(true);
  });

  it("returns competitions in deterministic order", async () => {
    const competitions = await loadCompetitions();
    const ids = competitions.map((competition) => competition.id);
    expect(ids).toEqual([...ids].sort((a, b) => a.localeCompare(b)));
  });
});

describe("embedded data sync guard", () => {
  it("passes when the embedded LEC subset is present in data/", async () => {
    await expect(assertEmbeddedInSyncWithData()).resolves.toBeUndefined();
  });

  it("throws when an embedded team name drifts from data/", () => {
    const loaded = structuredClone(embeddedLecCompetition) as CompetitionData;
    loaded.teams[0].name = "Drifted Name";

    expect(() => assertEmbeddedMatches(loaded, embeddedLecCompetition)).toThrow(
      EmbeddedDataDriftError,
    );
  });

  it("throws when an embedded player attribute drifts from data/", () => {
    const loaded = structuredClone(embeddedLecCompetition) as CompetitionData;
    loaded.players[0].attributes.mechanics = 1;

    expect(() => assertEmbeddedMatches(loaded, embeddedLecCompetition)).toThrow(
      EmbeddedDataDriftError,
    );
  });

  it("throws when an embedded staff wage drifts from data/", () => {
    const loaded = structuredClone(embeddedLecCompetition) as CompetitionData;
    loaded.staff[0].wage = 0;

    expect(() => assertEmbeddedMatches(loaded, embeddedLecCompetition)).toThrow(
      EmbeddedDataDriftError,
    );
  });
});

describe("content catalog loaders", () => {
  it("loads the social catalog with deterministic order", async () => {
    const catalog = await loadSocialCatalog();

    expect(catalog.accounts.length).toBeGreaterThan(0);
    expect(catalog.templates.length).toBeGreaterThan(0);
    expect(catalog.accounts.map((account) => account.id)).toEqual(
      [...catalog.accounts.map((account) => account.id)].sort((a, b) => a.localeCompare(b)),
    );
    expect(catalog.templates.map((template) => template.id)).toEqual(
      [...catalog.templates.map((template) => template.id)].sort((a, b) => a.localeCompare(b)),
    );
  });

  it("loads news templates from data/news recursively", async () => {
    const templates = await loadNewsTemplates();

    expect(templates.some((template) => template.id === "title_race")).toBe(true);
    expect(templates.some((template) => template.id === "season_preview")).toBe(true);
    expect(templates.map((template) => template.id)).toEqual(
      [...templates.map((template) => template.id)].sort((a, b) => a.localeCompare(b)),
    );
  });

  it("loads the message sender catalog", async () => {
    const catalog = await loadMessageCatalog();

    expect(catalog.senders.some((sender) => sender.id === "al_lio")).toBe(true);
    expect(catalog.senders.map((sender) => sender.id)).toEqual(
      [...catalog.senders.map((sender) => sender.id)].sort((a, b) => a.localeCompare(b)),
    );
  });
});
