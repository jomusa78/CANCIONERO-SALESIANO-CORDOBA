import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Song, SearchMatchInfo } from '../types';
import { INITIAL_SONGS } from '../data/initialSongs';
import { extractPlainLyrics, evaluateSongSearch } from '../utils/chordUtils';

interface SongSearchResult {
  song: Song;
  searchInfo: SearchMatchInfo;
}

interface SongContextType {
  songs: Song[];
  filteredResults: SongSearchResult[];
  selectedSong: Song | null;
  setSelectedSong: (song: Song | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedTag: string;
  setSelectedTag: (tag: string) => void;
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
  sortBy: 'title' | 'artist' | 'recent';
  setSortBy: (sort: 'title' | 'artist' | 'recent') => void;
  allTags: string[];
  addSong: (songData: Omit<Song, 'id' | 'createdAt' | 'plainLyrics'>) => Song;
  updateSong: (id: string, songData: Partial<Omit<Song, 'id'>>) => void;
  deleteSong: (id: string) => void;
  toggleFavorite: (id: string) => void;
  resetDefaultSongs: () => void;
  editingSong: Song | null;
  setEditingSong: (song: Song | null) => void;
  isAdminPanelOpen: boolean;
  setIsAdminPanelOpen: (open: boolean) => void;
}

const SongContext = createContext<SongContextType | undefined>(undefined);

const STORAGE_KEY = 'cancionero_salesiano_songs_list';

export const SongProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [songs, setSongs] = useState<Song[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return INITIAL_SONGS;
  });

  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('Todos');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'title' | 'artist' | 'recent'>('title');

  // Save to localStorage on changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(songs));
  }, [songs]);

  // Keep selectedSong up-to-date if it was modified
  useEffect(() => {
    if (selectedSong) {
      const updated = songs.find(s => s.id === selectedSong.id);
      if (updated) setSelectedSong(updated);
    }
  }, [songs]);

  // Extract all distinct tags from song list
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    songs.forEach(song => {
      song.tags.forEach(t => tagSet.add(t));
    });
    return ['Todos', ...Array.from(tagSet).sort()];
  }, [songs]);

  // Filter and sort songs
  const filteredResults = useMemo<SongSearchResult[]>(() => {
    return songs
      .filter(song => {
        if (selectedTag !== 'Todos' && !song.tags.includes(selectedTag)) {
          return false;
        }
        return true;
      })
      .map(song => {
        const { matches, info } = evaluateSongSearch(
          song.title,
          song.artist,
          song.tags,
          song.plainLyrics,
          searchQuery
        );
        return {
          song,
          matches,
          searchInfo: info,
        };
      })
      .filter(res => res.matches)
      .sort((a, b) => {
        if (sortBy === 'title') {
          return a.song.title.localeCompare(b.song.title);
        }
        if (sortBy === 'artist') {
          return a.song.artist.localeCompare(b.song.artist);
        }
        if (sortBy === 'recent') {
          return new Date(b.song.createdAt).getTime() - new Date(a.song.createdAt).getTime();
        }
        return 0;
      })
      .map(res => ({
        song: res.song,
        searchInfo: res.searchInfo,
      }));
  }, [songs, selectedTag, searchQuery, sortBy]);

  const addSong = (songData: Omit<Song, 'id' | 'createdAt' | 'plainLyrics'>) => {
    const newSong: Song = {
      ...songData,
      id: `song-${Date.now()}`,
      createdAt: new Date().toISOString(),
      plainLyrics: extractPlainLyrics(songData.content),
    };
    setSongs(prev => [newSong, ...prev]);
    return newSong;
  };

  const updateSong = (id: string, songData: Partial<Omit<Song, 'id'>>) => {
    setSongs(prev =>
      prev.map(s => {
        if (s.id === id) {
          const updatedContent = songData.content !== undefined ? songData.content : s.content;
          return {
            ...s,
            ...songData,
            plainLyrics: extractPlainLyrics(updatedContent),
          };
        }
        return s;
      })
    );
  };

  const deleteSong = (id: string) => {
    setSongs(prev => prev.filter(s => s.id !== id));
    if (selectedSong?.id === id) {
      setSelectedSong(null);
    }
  };

  const toggleFavorite = (id: string) => {
    setSongs(prev =>
      prev.map(s => (s.id === id ? { ...s, isFavorite: !s.isFavorite } : s))
    );
  };

  const resetDefaultSongs = () => {
    setSongs(INITIAL_SONGS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SONGS));
  };

  return (
    <SongContext.Provider
      value={{
        songs,
        filteredResults,
        selectedSong,
        setSelectedSong,
        searchQuery,
        setSearchQuery,
        selectedTag,
        setSelectedTag,
        viewMode,
        setViewMode,
        sortBy,
        setSortBy,
        allTags,
        addSong,
        updateSong,
        deleteSong,
        toggleFavorite,
        resetDefaultSongs,
        editingSong,
        setEditingSong,
        isAdminPanelOpen,
        setIsAdminPanelOpen,
      }}
    >
      {children}
    </SongContext.Provider>
  );
};

export const useSongs = () => {
  const context = useContext(SongContext);
  if (!context) {
    throw new Error('useSongs must be used within a SongProvider');
  }
  return context;
};
