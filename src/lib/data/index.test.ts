import { describe, expect, it } from "vitest";
import { getCompetition, listCompetitions, toRoman } from "./competitions";
import { getPlayer, getRoster, listPlayers } from "./players";
import { getStaff, listStaffs } from "./staffs";
import { getTeam } from "./teams";

describe("data accessors", () => {
  it("lists 43 competitions", () => {
    expect(listCompetitions()).toHaveLength(43);
  });

  it("round-trips a competition", () => {
    const first = listCompetitions()[0];
    expect(getCompetition(first.id)?.id).toBe(first.id);
  });

  it("converts tiers to roman numerals", () => {
    expect(toRoman(1)).toBe("I");
    expect(toRoman(2)).toBe("II");
    expect(toRoman(3)).toBe("III");
    expect(toRoman(4)).toBe("IV+");
  });

  it("round-trips a player", () => {
    const first = listPlayers()[0];
    expect(getPlayer(first.id)?.id).toBe(first.id);
  });

  it("returns a roster tied to a team", () => {
    const team = getTeam("lec-g2-esports")!;
    const roster = getRoster(team.id);
    expect(roster.players.some((player) => player.team_id === team.id)).toBe(true);
  });

  it("round-trips a staff member", () => {
    const first = listStaffs()[0];
    expect(getStaff(first.id)?.id).toBe(first.id);
  });
});
