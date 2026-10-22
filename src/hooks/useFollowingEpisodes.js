/**
 * Episodes that follow a program back to back on its channel, for the
 * "record the next episodes too" menu. The grid only caches the buckets
 * around its viewport, so the hook loads the buckets after the program
 * itself, through the same queries as the grid.
 * @module hooks/useFollowingEpisodes
 */

import { useQueries } from '@tanstack/react-query';

import { mergeByChannelEntries } from '@/api/transformers';
import { findFollowingEpisodes } from '@/utils/programs';
import { get2HourBuckets } from '@/utils/time';
import { byChannelQuery } from './useEpgViewport';

/** How far past the program the following episodes are looked for. */
const LOOKAHEAD_SECONDS = 6 * 3600;

const NOTHING = { episodes: [], isLoading: false };

/**
 * @param {string} channelUuid - Channel of the program
 * @param {{ title: string, date: number, duration: number }|null} program - First episode; null fetches nothing
 * @returns {{ episodes: Array<Object>, isLoading: boolean }} Following episodes in airing order, and whether a
 *   bucket still awaits its first answer (retries after a failure do not count, they can last half a minute)
 */
const useFollowingEpisodes = (channelUuid, program) => {
  const end = program ? program.date + program.duration : 0;
  const buckets = program && channelUuid ? get2HourBuckets(end, end + LOOKAHEAD_SECONDS) : [];

  return useQueries({
    queries: buckets.map((ts) => byChannelQuery(channelUuid, ts)),
    combine: (results) => {
      if (results.length === 0) {
        return NOTHING;
      }
      const entries = results.filter((r) => r.data).map((r) => ({ uuid: channelUuid, programs: r.data }));
      return {
        episodes: findFollowingEpisodes(mergeByChannelEntries(entries).get(channelUuid), program),
        isLoading: results.some((r) => r.isPending && r.failureCount === 0),
      };
    },
  });
};

export default useFollowingEpisodes;
