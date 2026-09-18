export type UserRole = 'usuario' | 'administrador';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarBg?: string;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  originalKey: string;
  bpm?: number;
  timeSignature?: string;
  tags: string[];
  content: string; // ChordPro format: [G]Letra con [D]acordes
  plainLyrics: string;
  createdAt: string;
  isFavorite?: boolean;
}

export interface ChordSegment {
  chord?: string;
  text: string;
}

export interface SongLine {
  isSectionHeader: boolean;
  headerName?: string;
  segments: ChordSegment[];
}

export interface SearchMatchInfo {
  matchedInTitle: boolean;
  matchedInArtist: boolean;
  matchedInTags: boolean;
  matchedInLyrics: boolean;
  snippet?: string;
}
