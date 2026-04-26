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

import { useState, useCallback, useMemo, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Drawer,
  Box,
  Typography,
  TextField,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Checkbox,
  Button,
  Chip,
  Divider,
  InputAdornment,
  styled,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';

import { toggleChannel, setHiddenChannels } from '@/store/channelsSlice';
import getLogoUrl from '@/utils/images';

const DRAWER_WIDTH = 320;
const ITEM_HEIGHT = 40;
const OVERSCAN = 8;

const VirtualItem = styled(ListItemButton)({
  position: 'absolute',
  left: 0,
  right: 0,
  height: ITEM_HEIGHT,
});

const ChannelLogo = styled('img')({
  width: 28,
  height: 24,
  objectFit: 'contain',
  marginRight: 8,
});

const VirtualList = styled('div')({
  position: 'relative',
});

const CompactListItemIcon = styled(ListItemIcon)({
  minWidth: 36,
});

const ChannelFilter = ({ open, onClose, channels }) => {
  const dispatch = useDispatch();
  const hiddenChannels = useSelector((state) => state.channels.hiddenChannels);
  const [search, setSearch] = useState('');
  const [scrollTop, setScrollTop] = useState(0);
  const listRef = useRef(null);

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

  const listHeight = listRef.current?.clientHeight ?? 400;
  const totalHeight = filteredChannels.length * ITEM_HEIGHT;
  const { visibleItems, startIndex } = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - OVERSCAN);
    const end = Math.min(
      filteredChannels.length,
      Math.ceil((scrollTop + listHeight) / ITEM_HEIGHT) + OVERSCAN,
    );
    return { visibleItems: filteredChannels.slice(start, end), startIndex: start };
  }, [filteredChannels, scrollTop, listHeight]);

  const handleToggle = useCallback((uuid) => {
    dispatch(toggleChannel(uuid));
  }, [dispatch]);

  const handleShowAll = useCallback(() => {
    dispatch(setHiddenChannels([]));
  }, [dispatch]);

  const handleHideAll = useCallback(() => {
    dispatch(setHiddenChannels(channels.map((ch) => ch.uuid)));
  }, [dispatch, channels]);

  const handleShowTnt = useCallback(() => {
    dispatch(setHiddenChannels(
      channels.filter((ch) => !ch.pubService).map((ch) => ch.uuid),
    ));
  }, [dispatch, channels]);

  const handleSearchChange = useCallback((event) => {
    setSearch(event.target.value);
    setScrollTop(0);
    if (listRef.current) {
      listRef.current.scrollTop = 0;
    }
  }, []);

  const handleListScroll = useCallback((event) => {
    setScrollTop(event.target.scrollTop);
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

        <Box sx={{ display: 'flex', gap: 0.5, mb: 2, flexWrap: 'wrap' }}>
          <Chip label="TNT" size="small" variant="outlined" onClick={handleShowTnt} />
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

      <Box
        ref={listRef}
        onScroll={handleListScroll}
        sx={{ overflowY: 'auto', flexGrow: 1 }}
      >
        <VirtualList style={{ height: totalHeight }}>
          {visibleItems.map((channel, index) => {
            const isHidden = hiddenChannels.includes(channel.uuid);
            const itemIndex = startIndex + index;
            return (
              <VirtualItem
                key={channel.uuid}
                onClick={() => handleToggle(channel.uuid)}
                dense
                style={{ top: itemIndex * ITEM_HEIGHT }}
              >
                <CompactListItemIcon>
                  <Checkbox
                    edge="start"
                    checked={!isHidden}
                    tabIndex={-1}
                    disableRipple
                    size="small"
                  />
                </CompactListItemIcon>
                <ChannelLogo
                  src={getLogoUrl(channel.uuid)}
                  alt=""
                  loading="lazy"
                />
                <ListItemText
                  primary={`${channel.number} - ${channel.name}`}
                  slotProps={{ primary: { variant: 'body2', noWrap: true } }}
                />
              </VirtualItem>
            );
          })}
        </VirtualList>
      </Box>
    </Drawer>
  );
};

export default ChannelFilter;
