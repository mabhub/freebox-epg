/**
 * Order in which the idle prefetch asks for `by_channel` buckets: first the
 * channels on screen over the whole grid, nearest to the viewport first,
 * then tonight for the first channels of the list.
 * @module utils/prefetchPlan
 */

import { get2HourBuckets } from '@/utils/time';

const BUCKET_SECONDS = 7200;

/**
 * Time distance between a bucket and a range, 0 when they overlap.
 * @param {number} ts - Bucket start, Unix seconds
 * @param {{ startTs: number, endTs: number }} range - Time range
 * @returns {number} Distance in seconds
 */
const distanceToRange = (ts, { startTs, endTs }) => Math.max(0, startTs - (ts + BUCKET_SECONDS), ts - endTs);

/**
 * Buckets overlapping a range, aligned on 2 hours.
 * @param {{ startTs: number, endTs: number }} range - Time range, end excluded
 * @returns {Array<number>} Bucket starts
 */
const bucketsOf = ({ startTs, endTs }) => (endTs > startTs ? get2HourBuckets(startTs, endTs - 1) : []);

/**
 * Build the ordered list of channel/bucket pairs to prefetch.
 * @param {Object} params - Plan inputs
 * @param {Array<string>} params.onScreenUuids - UUIDs of the channels on screen
 * @param {Array<string>} params.firstUuids - UUIDs of the first channels of the list
 * @param {{ startTs: number, endTs: number }} params.gridRange - Time span of the grid
 * @param {{ startTs: number, endTs: number }} params.viewportRange - Time span on screen
 * @param {{ startTs: number, endTs: number }} params.eveningRange - Evening to cover for the first channels
 * @param {(uuid: string, ts: number) => boolean} params.isKnown - True for a pair already cached or loading
 * @returns {Array<{ uuid: string, ts: number }>} Pairs to fetch, most useful first
 */
const buildPrefetchPlan = ({ onScreenUuids, firstUuids, gridRange, viewportRange, eveningRange, isKnown }) => {
  const onScreenBuckets = bucketsOf(gridRange)
    .map((ts, index) => ({ ts, index, distance: distanceToRange(ts, viewportRange) }))
    .toSorted((a, b) => a.distance - b.distance || a.index - b.index)
    .map(({ ts }) => ts);
  const eveningBuckets = bucketsOf(eveningRange);

  const candidates = [
    ...onScreenBuckets.flatMap((ts) => onScreenUuids.map((uuid) => ({ uuid, ts }))),
    ...firstUuids.flatMap((uuid) => eveningBuckets.map((ts) => ({ uuid, ts }))),
  ];

  const seen = new Set();
  return candidates.filter(({ uuid, ts }) => {
    const key = `${uuid}|${ts}`;
    if (seen.has(key) || isKnown(uuid, ts)) return false;
    seen.add(key);
    return true;
  });
};

export default buildPrefetchPlan;
