// Coloane SQL cu rezumatul recenziilor unui utilizator (media cu o zecimală și numărul lor).
// `userIdColumn` și `prefix` sunt constante din cod, niciodată date de la utilizator.
export const ratingColumns = (userIdColumn: string, prefix: string) => `
  (SELECT ROUND(AVG(rv.rating)::numeric, 1) FROM reviews rv WHERE rv.reviewee_id = ${userIdColumn}) AS ${prefix}_rating_average,
  (SELECT COUNT(*)::int FROM reviews rv WHERE rv.reviewee_id = ${userIdColumn}) AS ${prefix}_rating_count
`;

export type RatingSummary = { average: number | null; count: number };

export const mapRating = (row: Record<string, unknown>, prefix: string): RatingSummary => {
  const average = row[`${prefix}_rating_average`];
  return {
    average: average === null || average === undefined ? null : Number(average),
    count: Number(row[`${prefix}_rating_count`] ?? 0),
  };
};
