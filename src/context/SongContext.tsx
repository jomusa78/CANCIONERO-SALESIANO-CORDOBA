import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import { Song, SearchMatchInfo } from '../types';
import { INITIAL_SONGS } from '../data/initialSongs';
import { extractPlainLyrics, evaluateSongSearch } from '../utils/chordUtils';
import {
  db,
  collection,
  doc,
  getDoc,
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

  // Helper: Convert local server PDF or external URL into full base64 Data URL so all computers can view it
  const resolvePdfDataUrl = async (pdfUrl?: string): Promise<string | undefined> => {
    if (!pdfUrl) return undefined;
    if (pdfUrl.startsWith('data:')) return pdfUrl;
    try {
      const res = await fetch(pdfUrl);
      if (res.ok) {
        const blob = await res.blob();
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = () => resolve(pdfUrl);
          reader.readAsDataURL(blob);
        });
      }
    } catch (err) {
      console.warn('[SongContext] Could not resolve pdfUrl to data URL:', err);
    }
    return pdfUrl;
  };

  // Helper: Sanitize object so no undefined values are sent to Firestore (prevents Firestore crash)
  const cleanSongForFirestore = (song: Song, resolvedPdfUrl?: string): Record<string, any> => {
    const finalPdfUrl = resolvedPdfUrl !== undefined ? resolvedPdfUrl : song.pdfUrl;
    const result: Record<string, any> = {
      id: song.id,
      title: song.title || '',
      artist: song.artist || '',
      tags: Array.isArray(song.tags) && song.tags.length > 0 ? song.tags : ['General'],
      createdAt: song.createdAt || new Date().toISOString(),
      updatedAt: song.updatedAt || new Date().toISOString(),
      isPublic: true,
    };

    if (song.content) result.content = song.content;
    if (song.plainLyrics) result.plainLyrics = song.plainLyrics;
    if (song.originalKey) result.originalKey = song.originalKey;
    if (song.bpm) result.bpm = Number(song.bpm);
    if (song.timeSignature) result.timeSignature = song.timeSignature;
    if (song.isFavorite !== undefined) result.isFavorite = Boolean(song.isFavorite);
    if (finalPdfUrl) result.pdfUrl = finalPdfUrl;
    if (song.pdfFileName) result.pdfFileName = song.pdfFileName;
    if (song.pdfFileSize) result.pdfFileSize = Number(song.pdfFileSize);

    return result;
  };

  // Helper: Save song and its PDF to Firebase Cloud Firestore for multi-computer availability
  const saveSongToFirestore = async (song: Song): Promise<boolean> => {
    try {
      const resolvedPdf = await resolvePdfDataUrl(song.pdfUrl);
      const data = cleanSongForFirestore(song, resolvedPdf);

      // Handle PDF scores: if base64 length > 900,000, split across subcollection chunks
      if (resolvedPdf && resolvedPdf.length > 900000) {
        const chunkSize = 400000;
        const totalChunks = Math.ceil(resolvedPdf.length / chunkSize);
        data.pdfUrl = `firestore-chunks:${totalChunks}`;
        for (let i = 0; i < totalChunks; i++) {
          const chunkStr = resolvedPdf.substring(i * chunkSize, (i + 1) * chunkSize);
          await setDoc(doc(db, 'songs', song.id, 'pdfChunks', String(i)), {
            index: i,
            chunk: chunkStr,
          });
        }
      }

      const docRef = doc(db, 'songs', song.id);
      await setDoc(docRef, data, { merge: true });
      console.log(`[Firestore DB] ¡Canción sincronizada con éxito en Firebase Cloud! (ID: ${song.id}, Título: ${song.title})`);
      return true;
    } catch (err: any) {
      console.error('[Firestore DB] Error al guardar en Firebase Firestore:', err?.message || err);
      return false;
    }
  };

  // Helper: Retrieve chunked PDF scores from Firestore
  const fetchChunksPdf = async (songId: string, count: number): Promise<string> => {
    try {
      const chunks: string[] = [];
      for (let i = 0; i < count; i++) {
        const snap = await getDoc(doc(db, 'songs', songId, 'pdfChunks', String(i)));
        if (snap.exists()) {
          chunks.push((snap.data() as any).chunk || '');
        }
      }
      return chunks.join('');
    } catch (e) {
      console.warn('[Firestore] Error leyendo trozos de partitura PDF:', e);
      return '';
    }
  };

  // 2. Real-time sync with Firebase Cloud Firestore (live across all computers & devices)
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'songs'),
      async snapshot => {
        if (snapshot.empty) {
          return;
        }

        const cloudSongs: Song[] = [];
        for (const docSnap of snapshot.docs) {
          const raw = docSnap.data() as Partial<Song>;
          let pdfUrl = raw.pdfUrl;
          if (pdfUrl && pdfUrl.startsWith('firestore-chunks:')) {
            const count = parseInt(pdfUrl.split(':')[1], 10) || 1;
            pdfUrl = await fetchChunksPdf(docSnap.id, count);
          }

          const cleanedSong: Song = {
            id: docSnap.id,
            title: raw.title || 'Nº ?',
            artist: raw.artist || 'Canción Salesiana',
            originalKey: raw.originalKey,
            bpm: raw.bpm,
            timeSignature: raw.timeSignature,
            tags: Array.isArray(raw.tags) && raw.tags.length > 0 ? raw.tags : ['General'],
            content: raw.content || '',
            plainLyrics: raw.plainLyrics || extractPlainLyrics(raw.content || ''),
            createdAt: raw.createdAt || new Date().toISOString(),
            updatedAt: raw.updatedAt,
            isFavorite: Boolean(raw.isFavorite),
            pdfUrl: pdfUrl,
            pdfFileName: raw.pdfFileName,
            pdfFileSize: raw.pdfFileSize,
          };
          cloudSongs.push(cleanedSong);
        }

        if (cloudSongs.length > 0) {
          console.log(`[Firestore] Sincronización en tiempo real: ${cloudSongs.length} canciones cargadas desde Firebase Cloud.`);
          setSongs(cloudSongs);
          setIsCloudSynced(true);
          setSyncSource('cloud');
        }
      },
      error => {
        console.warn('[Firestore] Notificación de escucha Firestore:', error.message);
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

  // Persist single song addition to Firebase Cloud (primary) and Server API (fallback)
  const persistAddSong = async (song: Song) => {
    // 1. Cloud Firestore persistence (immediately live for all computers)
    await saveSongToFirestore(song);

    // 2. Server persistence: execute INSERT / push creating a new record
    try {
      const res = await fetch('/api/songs/insert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...song, action: 'insert', isInsert: true }),
      });
      if (res.ok) {
        const data = await res.json().catch(() => null);
        console.log('[Server DB] Inserción (INSERT/push) completada en servidor local:', song.id);
        if (data?.song?.pdfUrl && data.song.pdfUrl !== song.pdfUrl) {
          setSongs(prev => prev.map(s => (s.id === song.id ? { ...s, pdfUrl: data.song.pdfUrl } : s)));
        }
      } else {
        // Fallback to /api/songs
        await fetch('/api/songs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...song, action: 'insert', isInsert: true }),
        });
      }
    } catch (err) {
      console.warn('[Server] Aviso al persistir en servidor local:', err);
    }
  };

  // Persist single song update to Firebase Cloud (primary) and Server API (fallback)
  // MODO MODIFICAR: strictly UPDATE without duplication across all computers
  const persistUpdateSong = async (id: string, updatedSong: Song) => {
    const songToPersist = {
      ...updatedSong,
      id,
      updatedAt: new Date().toISOString(),
    };

    // 1. Cloud Firestore persistence (strictly updates existing song document, live for all computers)
    await saveSongToFirestore(songToPersist);

    // 2. Server persistence via PUT /api/songs/:id
    try {
      const payload = {
        ...songToPersist,
        action: 'update',
        isUpdate: true,
      };

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
      console.warn('[Server] Aviso al actualizar en servidor:', err);
    }
  };

  // Persist song deletion to Firebase Cloud and Server API
  const persistDeleteSong = async (id: string) => {
    // 1. Cloud Firestore persistence
    try {
      const docRef = doc(db, 'songs', id);
      await deleteDoc(docRef);
      console.log('[Firestore DB] Canción eliminada de Firebase Cloud:', id);
    } catch (err) {
      console.warn('[Firestore DB] Error al eliminar de Firebase Cloud:', err);
    }

    // 2. Server persistence
    try {
      await fetch(`/api/songs/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      console.log('[Server DB] Canción eliminada del servidor:', id);
    } catch (err) {
      console.warn('[Server DB] Error al eliminar del servidor:', err);
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
