export const DATASET_REFERENCE_DATE = "2026-10-07T12:00:00.000Z"
export const SAMPLE_LAST_DATE = DATASET_REFERENCE_DATE.slice(0, 10)
export const SAMPLE_WEEK_START = new Date(
  Date.parse(DATASET_REFERENCE_DATE) - 6 * 86_400_000,
)
  .toISOString()
  .slice(0, 10)
