/**
 * Channel filter drawer
 * Allows users to show/hide channels from the EPG grid
 *
 * @param {Object} props - Component props
 * @param {boolean} props.open - Whether the drawer is open
 * @param {Function} props.onClose - Callback to close the drawer
 * @param {Array} props.channels - Full channel list
 * @returns {React.ReactElement} Channel filter drawer
 */

import { useState, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Drawer,
  Box,
  Typography,
  TextField,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Checkbox,
  Button,
  Divider,
  InputAdornment,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';

import { toggleChannel, setHiddenChannels } from '@/store/channelsSlice';
import { getLogoUrl } from '@/utils/images';

const DRAWER_WIDTH = 320;

const ChannelFilter = ({ open, onClose, channels }) => {
  const dispatch = useDispatch();
  const hiddenChannels = useSelector((state) => state.channels.hiddenChannels);
  const [search, setSearch] = useState('');

  const filteredChannels = useMemo(() => {
    if (!search) {
      return channels;
    }
    const query = search.toLowerCase();
    return channels.filter((ch) =>
      ch.name.toLowerCase().includes(query)
      || ch.shortName?.toLowerCase().includes(query)
      || String(ch.number).includes(query),
    );
  }, [channels, search]);

  const handleToggle = useCallback((uuid) => {
    dispatch(toggleChannel(uuid));
  }, [dispatch]);

  const handleShowAll = useCallback(() => {
    dispatch(setHiddenChannels([]));
  }, [dispatch]);

  const handleHideAll = useCallback(() => {
    dispatch(setHiddenChannels(channels.map((ch) => ch.uuid)));
  }, [dispatch, channels]);

  const handleSearchChange = useCallback((event) => {
    setSearch(event.target.value);
  }, []);

  const visibleCount = channels.length - hiddenChannels.length;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: { sx: { width: DRAWER_WIDTH } },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Chaînes
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {visibleCount} / {channels.length} chaînes affichées
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Button size="small" variant="outlined" onClick={handleShowAll}>
            Tout afficher
          </Button>
          <Button size="small" variant="outlined" onClick={handleHideAll}>
            Tout masquer
          </Button>
        </Box>

        <TextField
          fullWidth
          size="small"
          placeholder="Rechercher..."
          value={search}
          onChange={handleSearchChange}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>

      <Divider />

      <List dense sx={{ overflowY: 'auto', flexGrow: 1 }}>
        {filteredChannels.map((channel) => {
          const isHidden = hiddenChannels.includes(channel.uuid);
          return (
            <ListItem key={channel.uuid} disablePadding>
              <ListItemButton onClick={() => handleToggle(channel.uuid)} dense>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <Checkbox
                    edge="start"
                    checked={!isHidden}
                    tabIndex={-1}
                    disableRipple
                    size="small"
                  />
                </ListItemIcon>
                <Box
                  component="img"
                  src={getLogoUrl(channel.uuid)}
                  alt=""
                  sx={{ width: 28, height: 24, objectFit: 'contain', mr: 1 }}
                />
                <ListItemText
                  primary={`${channel.number} - ${channel.name}`}
                  slotProps={{ primary: { variant: 'body2', noWrap: true } }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Drawer>
  );
};

export default ChannelFilter;
