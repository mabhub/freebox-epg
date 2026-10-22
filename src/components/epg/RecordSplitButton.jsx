/**
 * "Enregistrer" button of the program modal. When episodes of the same show
 * follow back to back, a dropdown next to it offers to record them too, in
 * the same recording. Nothing shows until the episodes are known, so the
 * button does not change shape under the pointer.
 *
 * @param {Object} props - Component props
 * @param {string} props.channelUuid - Channel of the program
 * @param {Object} props.program - Program shown in the modal
 * @param {Function} props.onRecord - Called with the extra episodes to cover (empty for the program alone)
 * @returns {React.ReactElement|null} Button, or button group with its menu
 */

import { useRef, useState } from 'react';
import { Button, ButtonGroup, Menu, MenuItem } from '@mui/material';
import { ArrowDropDown as ArrowDropDownIcon, FiberManualRecord as RecordIcon } from '@mui/icons-material';

import useFollowingEpisodes from '@/hooks/useFollowingEpisodes';
import { formatTime } from '@/utils/time';

const episodeCountLabel = (count) => `+${count} ${count > 1 ? 'épisodes' : 'épisode'}`;

const RecordSplitButton = ({ channelUuid, program, onRecord }) => {
  const { episodes: followingEpisodes, isLoading } = useFollowingEpisodes(channelUuid, program);
  const anchorRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const mainButton = (
    <Button variant="contained" color="error" size="small" startIcon={<RecordIcon />} onClick={() => onRecord([])}>
      Enregistrer
    </Button>
  );
  if (isLoading) {
    return null;
  }
  if (followingEpisodes.length === 0) {
    return mainButton;
  }

  const handlePick = (count) => {
    setMenuOpen(false);
    onRecord(followingEpisodes.slice(0, count));
  };

  return (
    <>
      <ButtonGroup variant="contained" color="error" size="small" ref={anchorRef}>
        {mainButton}
        <Button
          aria-label="Enregistrer aussi les épisodes suivants"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(true)}
        >
          <ArrowDropDownIcon />
        </Button>
      </ButtonGroup>
      <Menu
        anchorEl={anchorRef.current}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        {followingEpisodes.map((episode, index) => (
          <MenuItem key={episode.id} onClick={() => handlePick(index + 1)}>
            {`${episodeCountLabel(index + 1)} · jusqu'à ${formatTime(episode.date + episode.duration)}`}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default RecordSplitButton;
