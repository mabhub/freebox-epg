/**
 * Program-shape helpers shared by EPG components.
 * @module utils/programs
 */

/**
 * Format a season/episode pair as `s2e3`, falling back gracefully when
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
  return `s${program.season_number}e${episode}`;
};

export default formatSeasonEpisode;
