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
  query,
  where,
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

  // Sync to localStorage as local instant cache (safeguard against 5MB quota errors)
  useEffect(() => {
    try {
      // Avoid storing heavy base64 strings in localStorage to prevent QuotaExceededError
      const songsForStorage = songs.map(s => {
        if (s.pdfUrl && s.pdfUrl.startsWith('data:')) {
          return { ...s, pdfUrl: undefined };
        }
        return s;
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(songsForStorage));
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
    const songsQuery = query(collection(db, 'songs'), where('isPublic', '==', true));

    const unsubscribe = onSnapshot(
      songsQuery,
      async snapshot => {
        if (snapshot.empty) {
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
          setSongs(prev => {
            // Merge cloud songs with existing songs, never erase existing records
            const map = new Map<string, Song>();
            prev.forEach(s => map.set(s.id, s));
            cloudSongs.forEach(s => map.set(s.id, s));
            return Array.from(map.values());
          });
          setIsCloudSynced(true);
          setSyncSource('cloud');
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

  // Persist single song addition to Server API and Firestore Cloud (INSERT / push)
  const persistAddSong = async (song: Song) => {
    // 1. Server persistence: execute INSERT / push creating a new record
    try {
      const res = await fetch('/api/songs/insert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...song, action: 'insert', isInsert: true }),
      });
      if (res.ok) {
        const data = await res.json().catch(() => null);
        console.log('[Server DB] Inserción (INSERT/push) ejecutada en base de datos con ID automático:', song.id);
        if (data?.song?.pdfUrl && data.song.pdfUrl !== song.pdfUrl) {
          setSongs(prev => prev.map(s => (s.id === song.id ? { ...s, pdfUrl: data.song.pdfUrl } : s)));
        }
      } else {
        // Fallback to /api/songs with explicit insert action
        await fetch('/api/songs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...song, action: 'insert', isInsert: true }),
        });
      }
    } catch (err) {
      console.warn('[Server] Notice executing insert on server:', err);
    }

    // 2. Cloud Firestore persistence: execute INSERT with new automatic document ID
    try {
      const docRef = doc(db, 'songs', song.id);
      await setDoc(docRef, { ...song, isPublic: true });
      console.log('[Firestore DB] Inserción (INSERT) de nuevo registro completada en Firestore:', song.id);
    } catch (err) {
      console.warn('[Firestore] Notice inserting song to cloud:', err);
    }
  };

  // Persist single song update to Server API and Firestore Cloud
  // Persist single song update to Server API and Firestore Cloud (UPDATE only, NEVER duplicate)
  const persistUpdateSong = async (id: string, updatedSong: Song) => {
    const payload = {
      ...updatedSong,
      id,
      action: 'update',
      isUpdate: true,
    };

    // 1. Server persistence via PUT /api/songs/:id (with POST fallback)
    try {
      let res = await fetch(`/api/songs/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        res = await fetch('/api/songs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        const data = await res.json().catch(() => null);
        console.log('[Server DB] Canción modificada con éxito sin duplicar (ID:', id, ')');
        if (data?.song?.pdfUrl && data.song.pdfUrl !== updatedSong.pdfUrl) {
          setSongs(prev => prev.map(s => (s.id === id ? { ...s, pdfUrl: data.song.pdfUrl } : s)));
        }
      }
    } catch (err) {
      console.warn('[Server] Notice updating song on server:', err);
    }

    // 2. Cloud Firestore persistence (merge: true, modify only document with this ID)
    try {
      const docRef = doc(db, 'songs', id);
      await setDoc(docRef, { ...updatedSong, id, isPublic: true }, { merge: true });
      console.log('[Firestore DB] Canción modificada en Firestore cloud (ID:', id, ')');
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
    // Generate unique automatic ID using timestamp and UUID
    const timestamp = Date.now();
    const uuidPart = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).substring(2, 8);
    const autoId = `song-${timestamp}-${uuidPart}`;

    // Guarantee that PDF file name has unique identifier (UUID/timestamp) assigned
    let verifiedPdfFileName = songData.pdfFileName;
    if (verifiedPdfFileName && !verifiedPdfFileName.includes('_')) {
      const ext = verifiedPdfFileName.toLowerCase().endsWith('.pdf') ? '.pdf' : '';
      const base = verifiedPdfFileName.replace(/\.pdf$/i, '');
      verifiedPdfFileName = `${base}_${timestamp}_${uuidPart}${ext}`;
    }

    const newSong: Song = {
      ...songData,
      id: autoId,
      pdfFileName: verifiedPdfFileName,
      createdAt: new Date().toISOString(),
      plainLyrics: extractPlainLyrics(songData.content),
    };

    // Push new record into state (unshift to place newest song at top) and deduplicate
    setSongs(prev => {
      const seen = new Set<string>();
      return [newSong, ...prev].filter(s => {
        if (seen.has(s.id)) return false;
        seen.add(s.id);
        return true;
      });
    });

    // Execute database insertion (INSERT/push)
    persistAddSong(newSong);

    return newSong;
  };

  // MODO MODIFICAR: NO DUPLICAR CANCIÓN, solo modificar esa canción que ya tiene su ID único
  const updateSong = (id: string, songData: Partial<Omit<Song, 'id'>>) => {
    // Find existing song from state
    const existing = songs.find(s => s.id === id);
    const updatedContent = songData.content !== undefined ? songData.content : (existing ? existing.content : '');

    const updatedSongObj: Song = {
      ...(existing || ({} as Song)),
      ...songData,
      id, // NUNCA cambia: preserva estrictamente el ID único existente
      updatedAt: new Date().toISOString(),
      plainLyrics: extractPlainLyrics(updatedContent),
    };

    // 1. Modificar en estado local IN-PLACE (sin duplicar, deduplicando por ID)
    setSongs(prev => {
      const updatedList = prev.map(s => (s.id === id ? updatedSongObj : s));
      const seen = new Set<string>();
      return updatedList.filter(s => {
        if (seen.has(s.id)) return false;
        seen.add(s.id);
        return true;
      });
    });

    // 2. Si la canción seleccionada es la que se acaba de modificar, actualizarla inmediatamente
    setSelectedSong(prev => (prev?.id === id ? updatedSongObj : prev));

    // 3. Persistir actualización (UPDATE sin duplicar)
    persistUpdateSong(id, updatedSongObj);
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
