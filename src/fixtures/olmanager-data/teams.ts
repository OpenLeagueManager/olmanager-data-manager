export type TeamFixture = {
  id: string;
  name: string;
  competitionId: string;
};

export const teams = [
  {
    id: "team-arsenal",
    name: "Arsenal",
    competitionId: "competition-premier-league",
  },
  {
    id: "team-brighton",
    name: "Brighton & Hove Albion",
    competitionId: "competition-premier-league",
  },
  {
    id: "team-real-madrid",
    name: "Real Madrid",
    competitionId: "competition-la-liga",
  },
] as const satisfies readonly TeamFixture[];

export type TeamId = (typeof teams)[number]["id"];
