import { ChordSegment, SongLine, SearchMatchInfo } from '../types';

const SHARP_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_MAP: Record<string, string> = {
  'Db': 'C#',
  'Eb': 'D#',
  'Gb': 'F#',
  'Ab': 'G#',
  'Bb': 'A#',
  'Cb': 'B',
  'Fb': 'E',
};

// Transpose a single root note
export function transposeNote(note: string, semitones: number): string {
  const normalized = FLAT_MAP[note] || note;
  const index = SHARP_NOTES.indexOf(normalized);
  if (index === -1) return note;

  let newIndex = (index + semitones) % 12;
  if (newIndex < 0) newIndex += 12;
  return SHARP_NOTES[newIndex];
}

// Transpose a chord (handles slash chords e.g. G/B, D/F# and suffixes like m7, maj7, sus4)
export function transposeChord(chord: string, semitones: number): string {
  if (!chord || semitones === 0) return chord;

  // Handle slash chords like D/F#
  if (chord.includes('/')) {
    const parts = chord.split('/');
    return `${transposeChord(parts[0], semitones)}/${transposeChord(parts[1], semitones)}`;
  }

  // Regex to extract root note (A-G with optional # or b) and the remainder (m, 7, maj7, etc.)
  const match = chord.match(/^([A-G][#b]?)(.*)$/);
  if (!match) return chord;

  const root = match[1];
  const suffix = match[2];
  const transposedRoot = transposeNote(root, semitones);

  return `${transposedRoot}${suffix}`;
}

// Transpose all chords inside ChordPro format: [G]Letra [Em]con acordes
export function transposeContent(content: string, semitones: number): string {
  if (semitones === 0) return content;
  return content.replace(/\[([^\]]+)\]/g, (match, chordInside) => {
    // Check if it's a section tag like [Coro] or [Verso 1]
    if (isSectionHeaderTag(chordInside)) {
      return match;
    }
    return `[${transposeChord(chordInside, semitones)}]`;
  });
}

export function isSectionHeaderTag(tag: string): boolean {
  const lower = tag.toLowerCase().trim();
  return (
    lower.startsWith('verso') ||
    lower.startsWith('verse') ||
    lower.startsWith('coro') ||
    lower.startsWith('chorus') ||
    lower.startsWith('puente') ||
    lower.startsWith('bridge') ||
    lower.startsWith('intro') ||
    lower.startsWith('outro') ||
    lower.startsWith('final') ||
    lower.startsWith('estribillo') ||
    lower.startsWith('pre-coro') ||
    lower.startsWith('solo') ||
    lower.startsWith('interludio')
  );
}

// Extracts clean plain text without any chords for searching & copying
export function extractPlainLyrics(content: string): string {
  return content
    .split('\n')
    .map(line => {
      // If line is just a section tag, keep it as text or empty
      if (/^\s*\[(verso|verse|coro|chorus|puente|bridge|intro|outro|final|estribillo|pre-coro|solo|interludio)[^\]]*\]\s*$/i.test(line)) {
        return '';
      }
      return line.replace(/\[[^\]]+\]/g, '');
    })
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Parses ChordPro content into structured lines with chord segments
export function parseSongContent(content: string, semitones = 0): SongLine[] {
  const lines = content.split('\n');
  const parsedLines: SongLine[] = [];

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();

    // Check if line is a section header like [Coro] or [Verso 1]
    const headerMatch = trimmed.match(/^\[(verso|verse|coro|chorus|puente|bridge|intro|outro|final|estribillo|pre-coro|solo|interludio)[^\]]*\]$/i);
    if (headerMatch) {
      const headerName = trimmed.slice(1, -1);
      parsedLines.push({
        isSectionHeader: true,
        headerName,
        segments: [],
      });
      continue;
    }

    // Line with chords and syllables
    const segments: ChordSegment[] = [];
    // Regex splits by bracketed chords: e.g. [G]something
    const regex = /\[([^\]]+)\]([^\[]*)/g;
    let match: RegExpExecArray | null;
    let lastIndex = 0;

    // Check if line starts with text before the first chord
    const firstBracket = rawLine.indexOf('[');
    if (firstBracket > 0) {
      segments.push({
        chord: undefined,
        text: rawLine.substring(0, firstBracket),
      });
    } else if (firstBracket === -1) {
      // Line has no chords at all
      segments.push({
        chord: undefined,
        text: rawLine,
      });
      parsedLines.push({
        isSectionHeader: false,
        segments,
      });
      continue;
    }

    while ((match = regex.exec(rawLine)) !== null) {
      const rawChord = match[1];
      const textAfter = match[2];
      const transposedChord = isSectionHeaderTag(rawChord)
        ? rawChord
        : transposeChord(rawChord, semitones);

      segments.push({
        chord: transposedChord,
        text: textAfter,
      });
      lastIndex = regex.lastIndex;
    }

    // Trailing text if any
    if (lastIndex < rawLine.length && firstBracket !== -1) {
      const remaining = rawLine.substring(lastIndex);
      if (remaining) {
        segments.push({ chord: undefined, text: remaining });
      }
    }

    parsedLines.push({
      isSectionHeader: false,
      segments: segments.length > 0 ? segments : [{ chord: undefined, text: rawLine }],
    });
  }

  return parsedLines;
}

// Normalizes strings by removing accents/diacritics for flexible search
export function normalizeText(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

// Smart search and snippet extraction
export function evaluateSongSearch(
  title: string,
  artist: string,
  tags: string[],
  plainLyrics: string,
  query: string
): { matches: boolean; info: SearchMatchInfo } {
  if (!query || !query.trim()) {
    return {
      matches: true,
      info: {
        matchedInTitle: false,
        matchedInArtist: false,
        matchedInTags: false,
        matchedInLyrics: false,
      },
    };
  }

  const normQuery = normalizeText(query);
  const normTitle = normalizeText(title);
  const normArtist = normalizeText(artist);
  const normTags = tags.map(t => normalizeText(t));
  const normLyrics = normalizeText(plainLyrics);

  const matchedInTitle = normTitle.includes(normQuery);
  const matchedInArtist = normArtist.includes(normQuery);
  const matchedInTags = normTags.some(t => t.includes(normQuery));
  const matchedInLyrics = normLyrics.includes(normQuery);

  let snippet: string | undefined;

  // If matched in lyrics, locate the matching line and create an informative snippet!
  if (matchedInLyrics) {
    const rawLines = plainLyrics.split('\n');
    for (let i = 0; i < rawLines.length; i++) {
      const lineNorm = normalizeText(rawLines[i]);
      if (lineNorm.includes(normQuery)) {
        const prev = i > 0 && rawLines[i - 1].trim() ? rawLines[i - 1].trim() + ' / ' : '';
        const next = i < rawLines.length - 1 && rawLines[i + 1].trim() ? ' / ' + rawLines[i + 1].trim() : '';
        snippet = `${prev}${rawLines[i].trim()}${next}`;
        break;
      }
    }
  }

  const matches = matchedInTitle || matchedInArtist || matchedInTags || matchedInLyrics;

  return {
    matches,
    info: {
      matchedInTitle,
      matchedInArtist,
      matchedInTags,
      matchedInLyrics,
      snippet,
    },
  };
}
