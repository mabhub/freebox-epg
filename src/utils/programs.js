/**
 * Program-shape helpers shared by EPG components.
 * @module utils/programs
 */

/**
 * Format a season/episode pair as `S2E3`, falling back gracefully when
 * the episode number is missing. Returns null when the program has no
 * season metadata at all, so callers can skip rendering entirely.
 * @param {{ season_number?: number, episode_number?: number }} program - EPG program
 * @returns {string|null} Formatted suffix, or null when there is no season
 */
const formatSeasonEpisode = (program) => {
  if (!program?.season_number) {
    return null;
  }
  const episode = program.episode_number ?? '?';
  return `S${program.season_number}E${episode}`;
};

export default formatSeasonEpisode;

/** Longest stretch (seconds) allowed between two episodes, e.g. a weather slot. */
const MAX_EPISODE_GAP = 5 * 60;

/**
 * List the episodes that follow a program back to back on its channel: same
 * title, each one starting at most 5 minutes after the previous one ends.
 * Season/episode numbers are ignored (TF1 airs them out of order). Short
 * interludes in between are skipped and end up inside the recorded span.
 * @param {Array<{ id: string, title: string, date: number, duration: number }>|undefined} programs - Channel programs, sorted by date
 * @param {{ title: string, date: number, duration: number }|null} program - First episode
 * @returns {Array<Object>} Following episodes, in airing order
 */
export const findFollowingEpisodes = (programs, program) => {
  if (!programs || !program) {
    return [];
  }
  const episodes = [];
  let end = program.date + program.duration;
  for (const candidate of programs) {
    if (candidate.date - end > MAX_EPISODE_GAP) {
      break;
    }
    if (candidate.date >= end && candidate.title === program.title) {
      episodes.push(candidate);
      end = candidate.date + candidate.duration;
    }
  }
  return episodes;
};

/**
 * Build the subtitle of a multi-episode recording the way the Freebox
 * player names its own: `<first subtitle> (+N épisodes)`, always plural.
 * @param {string} subTitle - Subtitle of the first episode (may be empty)
 * @param {number} extraCount - Number of episodes after the first
 * @returns {string} Recording subtitle
 */
export const formatEpisodesSubname = (subTitle, extraCount) =>
  [subTitle, `(+${extraCount} épisodes)`].filter(Boolean).join(' ');

/**
 * Stretch a program over the episodes that follow it, so a single recording
 * covers them all: same start, end of the last episode, Freebox-style
 * subtitle.
 * @param {{ date: number, duration: number, sub_title?: string }} program - First episode
 * @param {Array<{ date: number, duration: number }>} episodes - Following episodes, in airing order
 * @returns {Object} Program spanning every episode (the program itself when there are none)
 */
export const extendProgramOverEpisodes = (program, episodes) => {
  const last = episodes.at(-1);
  if (!last) {
    return program;
  }
  return {
    ...program,
    duration: last.date + last.duration - program.date,
    sub_title: formatEpisodesSubname(program.sub_title ?? '', episodes.length),
  };
};
