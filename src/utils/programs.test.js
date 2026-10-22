import formatSeasonEpisode, {
  extendProgramOverEpisodes,
  findFollowingEpisodes,
  formatEpisodesSubname,
  groupConsecutiveEpisodes,
  recordableGroupProgram,
} from './programs';

describe('formatSeasonEpisode', () => {
  it('returns null when the program has no season number', () => {
    expect(formatSeasonEpisode({})).toBeNull();
    expect(formatSeasonEpisode({ episode_number: 4 })).toBeNull();
    expect(formatSeasonEpisode(null)).toBeNull();
  });

  it('renders season + episode when both are present', () => {
    expect(formatSeasonEpisode({ season_number: 2, episode_number: 5 })).toBe('S2E5');
  });

  it('falls back to ? when the episode number is missing', () => {
    expect(formatSeasonEpisode({ season_number: 3 })).toBe('S3E?');
  });
});

const at = (minutes) => 1_700_000_000 + minutes * 60;
const show = (id, title, startMin, durationMin) => ({
  id,
  title,
  date: at(startMin),
  duration: durationMin * 60,
});

describe('findFollowingEpisodes', () => {
  it('returns the back-to-back programs that share the title', () => {
    const programs = [show('a', 'Tracker', 0, 50), show('b', 'Tracker', 50, 50), show('c', 'Tracker', 100, 45)];
    expect(findFollowingEpisodes(programs, programs[0]).map((p) => p.id)).toStrictEqual(['b', 'c']);
  });

  it('stops at the first program with another title once the gap exceeds 5 minutes', () => {
    const programs = [show('a', 'Tracker', 0, 50), show('b', 'Tracker', 50, 50), show('n', 'Le JT', 100, 30)];
    expect(findFollowingEpisodes(programs, programs[0]).map((p) => p.id)).toStrictEqual(['b']);
  });

  it('steps over a short interlude of at most 5 minutes', () => {
    const programs = [show('a', 'Tracker', 0, 50), show('m', 'Météo', 50, 5), show('b', 'Tracker', 55, 50)];
    expect(findFollowingEpisodes(programs, programs[0]).map((p) => p.id)).toStrictEqual(['b']);
  });

  it('does not step over an interlude longer than 5 minutes', () => {
    const programs = [show('a', 'Tracker', 0, 50), show('j', 'Journal', 50, 6), show('b', 'Tracker', 56, 50)];
    expect(findFollowingEpisodes(programs, programs[0])).toStrictEqual([]);
  });

  it('ignores programs that start before the selected one ends', () => {
    const programs = [show('z', 'Tracker', -50, 50), show('a', 'Tracker', 0, 50), show('b', 'Tracker', 50, 50)];
    expect(findFollowingEpisodes(programs, programs[1]).map((p) => p.id)).toStrictEqual(['b']);
  });

  it('works from the program detail, which is not the list entry itself', () => {
    const programs = [show('a', 'Tracker', 0, 50), show('b', 'Tracker', 50, 50)];
    expect(findFollowingEpisodes(programs, { ...programs[0], sub_title: 'Pilote' }).map((p) => p.id)).toStrictEqual([
      'b',
    ]);
  });

  it('returns an empty list without programs or a program', () => {
    expect(findFollowingEpisodes(undefined, show('a', 'Tracker', 0, 50))).toStrictEqual([]);
    expect(findFollowingEpisodes([show('a', 'Tracker', 0, 50)], null)).toStrictEqual([]);
  });
});

describe('formatEpisodesSubname', () => {
  it('appends the extra episode count the way the Freebox player does', () => {
    expect(formatEpisodesSubname('Sans foi ni loi', 2)).toBe('Sans foi ni loi (+2 épisodes)');
  });

  it('keeps the Freebox plural for a single extra episode', () => {
    expect(formatEpisodesSubname("L'affaire du collier", 1)).toBe("L'affaire du collier (+1 épisodes)");
  });

  it('leaves only the count when the first episode has no subtitle', () => {
    expect(formatEpisodesSubname('', 1)).toBe('(+1 épisodes)');
  });
});

describe('extendProgramOverEpisodes', () => {
  const first = { id: 'a', title: 'Tracker', sub_title: 'Sans foi ni loi', date: 1000, duration: 3000 };
  const episodes = [
    { id: 'b', title: 'Tracker', date: 4300, duration: 3000 },
    { id: 'c', title: 'Tracker', date: 7300, duration: 2700 },
  ];

  it('stretches the program to the end of the last episode', () => {
    const extended = extendProgramOverEpisodes(first, episodes);
    expect(extended.date).toBe(1000);
    expect(extended.date + extended.duration).toBe(10000);
  });

  it('names the subtitle after the extra episodes', () => {
    expect(extendProgramOverEpisodes(first, episodes).sub_title).toBe('Sans foi ni loi (+2 épisodes)');
  });

  it('returns the program untouched without extra episodes', () => {
    expect(extendProgramOverEpisodes(first, [])).toBe(first);
  });
});

describe('groupConsecutiveEpisodes', () => {
  it('groups back-to-back episodes of the same title', () => {
    const programs = [show('a', 'Phinéas', 0, 10), show('b', 'Phinéas', 10, 10), show('c', 'Green', 20, 10)];
    const [group, ...rest] = groupConsecutiveEpisodes(programs);
    expect(rest).toStrictEqual([]);
    expect(group).toMatchObject({ id: 'a', title: 'Phinéas', date: at(0), end: at(20) });
    expect(group.episodes.map((p) => p.id)).toStrictEqual(['a', 'b']);
  });

  it('keeps a short interlude inside the group as a member, not an episode', () => {
    const programs = [show('a', 'Phinéas', 0, 10), show('m', 'Météo', 10, 3), show('b', 'Phinéas', 13, 10)];
    const [group] = groupConsecutiveEpisodes(programs);
    expect(group.episodes.map((p) => p.id)).toStrictEqual(['a', 'b']);
    expect(group.programs.map((p) => p.id)).toStrictEqual(['a', 'm', 'b']);
  });

  it('does not group the same show aired apart', () => {
    expect(groupConsecutiveEpisodes([show('a', 'JT', 0, 30), show('b', 'JT', 36, 30)])).toStrictEqual([]);
  });

  it('returns no group for an isolated episode or no programs', () => {
    expect(groupConsecutiveEpisodes([show('a', 'Phinéas', 0, 10), show('c', 'Green', 10, 10)])).toStrictEqual([]);
    expect(groupConsecutiveEpisodes()).toStrictEqual([]);
  });

  it('finds several groups on one channel', () => {
    const programs = [
      show('a', 'Phinéas', 0, 10),
      show('b', 'Phinéas', 10, 10),
      show('c', 'Green', 20, 10),
      show('d', 'Green', 30, 10),
      show('e', 'Green', 40, 10),
    ];
    expect(groupConsecutiveEpisodes(programs).map((g) => g.episodes.length)).toStrictEqual([2, 3]);
  });
});

describe('recordableGroupProgram', () => {
  const group = groupConsecutiveEpisodes([
    { ...show('a', 'Phinéas', 0, 10), sub_title: 'La belle' },
    { ...show('b', 'Phinéas', 10, 10), sub_title: 'La terrifiante' },
    { ...show('c', 'Phinéas', 20, 10), sub_title: 'Médiévalhowen' },
  ])[0];

  it('spans the whole group before it starts', () => {
    expect(recordableGroupProgram(group, at(-5))).toMatchObject({
      date: at(0),
      duration: 30 * 60,
      sub_title: 'La belle (+2 épisodes)',
    });
  });

  it('starts from the episode on air once the group has begun', () => {
    expect(recordableGroupProgram(group, at(12))).toMatchObject({
      id: 'b',
      date: at(10),
      duration: 20 * 60,
      sub_title: 'La terrifiante (+1 épisodes)',
    });
  });

  it('returns null once every episode is over', () => {
    expect(recordableGroupProgram(group, at(30))).toBeNull();
  });
});
