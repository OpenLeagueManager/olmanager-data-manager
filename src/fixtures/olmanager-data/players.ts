export type PlayerFixture = {
  id: string;
  name: string;
  position: "GK" | "DF" | "MF" | "FW";
  teamId: string;
  competitionId: string;
  overall: number;
};

export const players = [
  {
    id: "player-saka",
    name: "Bukayo Saka",
    position: "FW",
    teamId: "team-arsenal",
    competitionId: "competition-premier-league",
    overall: 86,
  },
  {
    id: "player-mitoma",
    name: "Kaoru Mitoma",
    position: "FW",
    teamId: "team-brighton",
    competitionId: "competition-premier-league",
    overall: 82,
  },
  {
    id: "player-bellingham",
    name: "Jude Bellingham",
    position: "MF",
    teamId: "team-real-madrid",
    competitionId: "competition-la-liga",
    overall: 90,
  },
] as const satisfies readonly PlayerFixture[];

export type PlayerId = (typeof players)[number]["id"];
