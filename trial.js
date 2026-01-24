import fetch from "node-fetch";

export async function fetchGoogleTrends(region = "US") {
  const url = `https://gtrends.app/api/dailytrends?geo=${region}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch trends");
  const data = await res.json();

  return data.default?.trendingSearchesDays || data.trendingSearchesDays || [];
}
fetchGoogleTrends("US").then(console.log).catch(console.error);
