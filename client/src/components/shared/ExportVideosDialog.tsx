import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  CircularProgress,
  Alert,
  Box,
  TextField,
  FormControlLabel,
  Checkbox,
} from '../ui';
import { Copy, Download, Check } from 'lucide-react';
import { VideoData } from '../../types/VideoData';

interface ExportVideosDialogProps {
  open: boolean;
  onClose: () => void;
  token: string | null;
  videoIds?: number[];
  filters?: Record<string, any>;
}

type ExportFormat = 'txt' | 'json' | 'jsonl';

const ExportVideosDialog: React.FC<ExportVideosDialogProps> = ({
  open,
  onClose,
  token,
  videoIds = [],
  filters = {},
}) => {
  const [format, setFormat] = useState<ExportFormat>('txt');
  const [groupByChannel, setGroupByChannel] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open && token) {
      fetchVideos();
    } else {
      setVideos([]);
      setError(null);
    }
  }, [open, token, videoIds, filters]);

  const fetchVideos = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (videoIds.length > 0) {
        params.append('videoIds', videoIds.join(','));
      } else {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, value);
        });
      }

      const response = await axios.get<VideoData[]>('/api/videos/export', {
        params,
        headers: { 'x-access-token': token || '' },
      });
      setVideos(response.data);
    } catch (err) {
      console.error('Failed to fetch videos for export:', err);
      setError('Failed to load videos for export.');
    } finally {
      setLoading(false);
    }
  };

  const formattedContent = useMemo(() => {
    if (videos.length === 0) return '';

    const sortedVideos = [...videos].sort((a, b) => {
      const dateA = a.timeCreated ? new Date(a.timeCreated).getTime() : 0;
      const dateB = b.timeCreated ? new Date(b.timeCreated).getTime() : 0;
      return dateB - dateA;
    });

    if (format === 'json') {
      if (groupByChannel) {
        const grouped: Record<string, VideoData[]> = {};
        sortedVideos.forEach((v) => {
          const channel = v.youTubeChannelName || 'Unknown Channel';
          if (!grouped[channel]) grouped[channel] = [];
          grouped[channel].push(v);
        });
        return JSON.stringify(grouped, null, 2);
      }
      return JSON.stringify(sortedVideos, null, 2);
    }

    if (format === 'jsonl') {
      return sortedVideos.map((v) => JSON.stringify(v)).join('\n');
    }

    // TXT format
    if (groupByChannel) {
      const grouped: Record<string, VideoData[]> = {};
      sortedVideos.forEach((v) => {
        const channel = v.youTubeChannelName || 'Unknown Channel';
        if (!grouped[channel]) grouped[channel] = [];
        grouped[channel].push(v);
      });

      return Object.entries(grouped)
        .map(([channel, channelVideos]) => {
          const videoLines = channelVideos
            .map((v) => `https://www.youtube.com/watch?v=${v.youtubeId}`)
            .join('\n');
          return `### ${channel}\n${videoLines}`;
        })
        .join('\n\n');
    }

    return sortedVideos.map((v) => `https://www.youtube.com/watch?v=${v.youtubeId}`).join('\n');
  }, [videos, format, groupByChannel]);

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([formattedContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `youtarr_export_${new Date().toISOString().split('T')[0]}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Export Videos</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Format</InputLabel>
              <Select
                value={format}
                label="Format"
                onChange={(e) => setFormat(e.target.value as ExportFormat)}
              >
                <MenuItem value="txt">TXT (URLs)</MenuItem>
                <MenuItem value="json">JSON</MenuItem>
                <MenuItem value="jsonl">JSONL</MenuItem>
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Checkbox
                  checked={groupByChannel}
                  onChange={(e) => setGroupByChannel(e.target.checked)}
                />
              }
              label="Group by channel"
            />

            <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
              {videos.length} video{videos.length !== 1 ? 's' : ''} to export
            </Typography>
          </Box>

          <TextField
            multiline
            rows={15}
            fullWidth
            value={formattedContent}
            variant="outlined"
            InputProps={{
              readOnly: true,
              style: {
                fontFamily: 'monospace',
                fontSize: '0.8rem',
                backgroundColor: 'var(--muted)',
              },
            }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Close
        </Button>
        <Button
          onClick={handleCopy}
          disabled={loading || videos.length === 0}
          startIcon={copied ? <Check size={18} /> : <Copy size={18} />}
          variant="outlined"
        >
          {copied ? 'Copied' : 'Copy'}
        </Button>
        <Button
          onClick={handleDownload}
          disabled={loading || videos.length === 0}
          startIcon={<Download size={18} />}
          variant="contained"
          color="primary"
        >
          Download
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExportVideosDialog;
