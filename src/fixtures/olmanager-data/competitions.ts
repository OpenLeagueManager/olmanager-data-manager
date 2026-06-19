export type CompetitionFixture = {
  id: string;
  name: string;
  country: string;
};

export const competitions = [
  {
    id: "competition-premier-league",
    name: "Premier League",
    country: "England",
  },
  {
    id: "competition-la-liga",
    name: "La Liga",
    country: "Spain",
  },
] as const satisfies readonly CompetitionFixture[];

export type CompetitionId = (typeof competitions)[number]["id"];
