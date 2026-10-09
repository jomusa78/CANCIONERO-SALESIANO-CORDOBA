import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import { Song, SearchMatchInfo } from '../types';
import { INITIAL_SONGS } from '../data/initialSongs';
import { extractPlainLyrics, evaluateSongSearch } from '../utils/chordUtils';
import {
  db,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  handleFirestoreError,
  OperationType,
} from '../lib/firebase';

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
  isCloudSynced: boolean;
  syncSource: 'cloud' | 'server' | 'local';
}

const SongContext = createContext<SongContextType | undefined>(undefined);

const STORAGE_KEY = 'cancionero_salesiano_songs_list_v3';

export const SongProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Local storage cache for zero-flicker startup
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
  const [isCloudSynced, setIsCloudSynced] = useState(false);
  const [syncSource, setSyncSource] = useState<'cloud' | 'server' | 'local'>('local');

  const hasSeededCloudRef = useRef(false);

  // Sync to localStorage as local instant cache
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(songs));
    } catch (err) {
      console.warn('[LocalStorage] Storage quota notice:', err);
    }
  }, [songs]);

  // Keep selectedSong in sync when current song list updates
  useEffect(() => {
    if (selectedSong) {
      const updated = songs.find(s => s.id === selectedSong.id);
      if (updated) setSelectedSong(updated);
    }
  }, [songs]);

  // 1. Initial sync with web server API (/api/songs) for immediate multi-device state
  useEffect(() => {
    let isMounted = true;
    fetch('/api/songs')
      .then(res => res.json())
      .then(data => {
        if (!isMounted) return;
        if (data?.success && Array.isArray(data.songs) && data.songs.length > 0) {
          console.log(`[SongContext] Loaded ${data.songs.length} songs from server persistent database.`);
          setSongs(data.songs);
          setSyncSource('server');
        }
      })
      .catch(err => {
        console.warn('[SongContext] Could not fetch songs from server API:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Real-time sync with Firebase Cloud Firestore (live across all devices)
  useEffect(() => {
    const songsColRef = collection(db, 'songs');

    const unsubscribe = onSnapshot(
      songsColRef,
      async snapshot => {
        if (snapshot.empty) {
          // If Firestore is completely empty on first launch, seed with INITIAL_SONGS
          if (!hasSeededCloudRef.current) {
            hasSeededCloudRef.current = true;
            console.log('[Firestore] Empty cloud catalog detected. Seeding initial songs to Firestore...');
            try {
              for (const song of INITIAL_SONGS) {
                const songDocRef = doc(db, 'songs', song.id);
                await setDoc(songDocRef, { ...song, isPublic: true });
              }
              console.log('[Firestore] Successfully seeded initial songs to cloud!');
            } catch (seedErr) {
              console.warn('[Firestore] Notice during cloud seeding (requires admin auth):', seedErr);
            }
          }
          return;
        }

        const cloudSongs: Song[] = [];
        snapshot.forEach(docSnap => {
          const raw = docSnap.data() as Partial<Song>;
          const cleanedSong: Song = {
            id: docSnap.id,
            title: raw.title || 'Nº ?',
            artist: raw.artist || 'Canción Salesiana',
            originalKey: raw.originalKey,
            bpm: raw.bpm,
            timeSignature: raw.timeSignature,
            tags: Array.isArray(raw.tags) ? raw.tags : ['General'],
            content: raw.content || '',
            plainLyrics: raw.plainLyrics || extractPlainLyrics(raw.content || ''),
            createdAt: raw.createdAt || new Date().toISOString(),
            isFavorite: Boolean(raw.isFavorite),
            pdfUrl: raw.pdfUrl,
            pdfFileName: raw.pdfFileName,
            pdfFileSize: raw.pdfFileSize,
          };
          cloudSongs.push(cleanedSong);
        });

        if (cloudSongs.length > 0) {
          console.log(`[Firestore] Real-time sync received: ${cloudSongs.length} songs from Firestore cloud.`);
          setSongs(cloudSongs);
          setIsCloudSynced(true);
          setSyncSource('cloud');

          // Keep server backup in sync as well
          fetch('/api/songs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cloudSongs),
          }).catch(() => null);
        }
      },
      error => {
        console.warn('[Firestore] Notice during real-time sync listener:', error.message);
      }
    );

    return () => unsubscribe();
  }, []);

  // Compute all unique tags from currently loaded songs
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
          return a.song.title.localeCompare(b.song.title, undefined, { numeric: true, sensitivity: 'base' });
        }
        if (sortBy === 'artist') {
          return a.song.artist.localeCompare(b.song.artist, undefined, { numeric: true, sensitivity: 'base' });
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

  // Persist single song addition to Server API and Firestore Cloud
  const persistAddSong = async (song: Song) => {
    // 1. Server persistence
    try {
      await fetch('/api/songs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(song),
      });
      console.log('[Server] Song saved to server database:', song.id);
    } catch (err) {
      console.warn('[Server] Could not persist song to server:', err);
    }

    // 2. Cloud Firestore persistence
    try {
      const docRef = doc(db, 'songs', song.id);
      await setDoc(docRef, { ...song, isPublic: true });
      console.log('[Firestore] Song saved to cloud Firestore:', song.id);
    } catch (err) {
      console.warn('[Firestore] Notice saving song to cloud:', err);
    }
  };

  // Persist single song update to Server API and Firestore Cloud
  const persistUpdateSong = async (id: string, updatedSong: Song) => {
    // 1. Server persistence
    try {
      await fetch('/api/songs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSong),
      });
      console.log('[Server] Song updated on server database:', id);
    } catch (err) {
      console.warn('[Server] Could not update song on server:', err);
    }

    // 2. Cloud Firestore persistence
    try {
      const docRef = doc(db, 'songs', id);
      await setDoc(docRef, { ...updatedSong, isPublic: true }, { merge: true });
      console.log('[Firestore] Song updated in cloud Firestore:', id);
    } catch (err) {
      console.warn('[Firestore] Notice updating song in cloud:', err);
    }
  };

  // Persist song deletion to Server API and Firestore Cloud
  const persistDeleteSong = async (id: string) => {
    // 1. Server persistence
    try {
      await fetch(`/api/songs/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      console.log('[Server] Song deleted from server database:', id);
    } catch (err) {
      console.warn('[Server] Could not delete song from server:', err);
    }

    // 2. Cloud Firestore persistence
    try {
      const docRef = doc(db, 'songs', id);
      await deleteDoc(docRef);
      console.log('[Firestore] Song deleted from cloud Firestore:', id);
    } catch (err) {
      console.warn('[Firestore] Notice deleting song from cloud:', err);
    }
  };

  const addSong = (songData: Omit<Song, 'id' | 'createdAt' | 'plainLyrics'>) => {
    const newSong: Song = {
      ...songData,
      id: `song-${Date.now()}`,
      createdAt: new Date().toISOString(),
      plainLyrics: extractPlainLyrics(songData.content),
    };
    setSongs(prev => [newSong, ...prev]);
    persistAddSong(newSong);
    return newSong;
  };

  const updateSong = (id: string, songData: Partial<Omit<Song, 'id'>>) => {
    let updatedSongObj: Song | null = null;
    setSongs(prev =>
      prev.map(s => {
        if (s.id === id) {
          const updatedContent = songData.content !== undefined ? songData.content : s.content;
          updatedSongObj = {
            ...s,
            ...songData,
            plainLyrics: extractPlainLyrics(updatedContent),
          };
          return updatedSongObj;
        }
        return s;
      })
    );

    if (updatedSongObj) {
      persistUpdateSong(id, updatedSongObj);
    }
  };

  const deleteSong = (id: string) => {
    setSongs(prev => prev.filter(s => s.id !== id));
    if (selectedSong?.id === id) {
      setSelectedSong(null);
    }
    persistDeleteSong(id);
  };

  const toggleFavorite = (id: string) => {
    setSongs(prev =>
      prev.map(s => {
        if (s.id === id) {
          const updated = { ...s, isFavorite: !s.isFavorite };
          persistUpdateSong(id, updated);
          return updated;
        }
        return s;
      })
    );
  };

  const resetDefaultSongs = () => {
    setSongs(INITIAL_SONGS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SONGS));
    // Also reset server
    fetch('/api/songs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(INITIAL_SONGS),
    }).catch(() => null);
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
        isCloudSynced,
        syncSource,
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
