import formatSeasonEpisode from './programs';

describe('formatSeasonEpisode', () => {
  it('returns null when the program has no season number', () => {
    expect(formatSeasonEpisode({})).toBeNull();
    expect(formatSeasonEpisode({ episode_number: 4 })).toBeNull();
    expect(formatSeasonEpisode(null)).toBeNull();
  });

  it('renders season + episode when both are present', () => {
    expect(formatSeasonEpisode({ season_number: 2, episode_number: 5 })).toBe('s2e5');
  });

  it('falls back to ? when the episode number is missing', () => {
    expect(formatSeasonEpisode({ season_number: 3 })).toBe('s3e?');
  });
});
