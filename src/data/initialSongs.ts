import { Song } from '../types';
import { extractPlainLyrics } from '../utils/chordUtils';

const RAW_SONGS = [
  {
    id: 'song-salesianos-1',
    title: 'Padre, Maestro y Amigo',
    artist: 'Canción a San Juan Bosco',
    originalKey: 'D',
    bpm: 86,
    timeSignature: '4/4',
    tags: ['Salesiano', 'Don Bosco', 'Juvenil'],
    createdAt: '2026-01-01T10:00:00Z',
    content: `[Intro]
[D] [A] [Bm] [G] [A]

[Verso 1]
Un co[D]razón tan grande como el [A]mar,
unos [Bm]ojos que saben com[F#m]prender,
unas [G]manos abiertas para [D]dar,
y una [Em]vida entregada por a[A]mor.

[Verso 2]
Cami[D]naste buscando la ilu[A]sión,
en los [Bm]patios sembraste la a[F#m]mistad,
aprendi[G]mos contigo una can[D]ción,
la ale[Em]gría de Dios en liber[A]tad.

[Coro]
[D]Padre, ma[A]estro y a[Bm]migo,
[G]luz en el ca[Em]mino de juven[A]tud.
[D]Don Bosco, que[A]remos se[Bm]guir tu voz,
[G]ser signos de a[A]mor con Jesús y con [D]Dios.

[Verso 3]
Con Ma[D]ría Auxiliadora al ca[A]minar,
un so[Bm]ñador que supo com[F#m]partir,
hoy tus [G]jóvenes vuelven a can[D]tar,
la espe[Em]ranza de un nuevo porve[A]nir.

[Coro]
[D]Padre, ma[A]estro y a[Bm]migo,
[G]luz en el ca[Em]mino de juven[A]tud.
[D]Don Bosco, que[A]remos se[Bm]guir tu voz,
[G]ser signos de a[A]mor con Jesús y con [D]Dios.`,
  },
  {
    id: 'song-salesianos-2',
    title: 'Salve Don Bosco Santo',
    artist: 'Himno Tradicional Salesiano',
    originalKey: 'C',
    bpm: 100,
    timeSignature: '4/4',
    tags: ['Salesiano', 'Himno', 'Don Bosco'],
    createdAt: '2026-01-02T10:00:00Z',
    content: `[Intro]
[C] [G] [Am] [F] [G]

[Coro]
[C]Salve Don [G]Bosco [Am]santo,
[F]joven de corazón, [G]padre y pastor.
[C]Oye nues[G]tro alaban[Am]za,
[F]que brota del al[G]ma con gran a[C]mor.

[Verso 1]
Por tus [C]hijos que en el mundo can[G]tan,
la ale[Am]gría, el trabajo y la o[Em]ración,
una es[F]cuela, un patio y una i[C]glesia,
donde [Dm]todos sentimos calor de ho[G]gar.

[Coro]
[C]Salve Don [G]Bosco [Am]santo,
[F]joven de corazón, [G]padre y pastor.
[C]Oye nues[G]tro alaban[Am]za,
[F]que brota del al[G]ma con gran a[C]mor.`,
  },
  {
    id: 'song-1',
    title: 'Cuán Grande Es Él',
    artist: 'Himno Tradicional',
    originalKey: 'G',
    bpm: 72,
    timeSignature: '4/4',
    tags: ['Alabanza', 'Himno', 'Adoración'],
    createdAt: '2026-01-10T10:00:00Z',
    content: `[Intro]
[G] [C] [G] [D] [G]

[Verso 1]
Se[G]ñor, mi Dios, al con[C]templar los cielos,
el [G]firmanento y las es[D]trellas mil;
al [G]oír tu voz en los po[C]tentes truenos
y [G]ver brillar el [D]sol en su cen[G]it.

[Coro]
Mi corazón entona la can[C]ción,
¡Cuán grande es [G]Él! ¡Cuán grande es [D]Él!
Mi [G]corazón entona la can[C]ción,
¡Cuán grande es [G]Él! ¡Cuán [D]grande es [G]Él!

[Verso 2]
Al re[G]correr los montes y los [C]valles
y [G]ver las bellas flores al pa[D]sar;
al es[G]cuchar el canto de las [C]aves
y el [G]murmullo del [D]claro ma[G]nantial.

[Coro]
Mi corazón entona la can[C]ción,
¡Cuán grande es [G]Él! ¡Cuán grande es [D]Él!
Mi [G]corazón entona la can[C]ción,
¡Cuán grande es [G]Él! ¡Cuán [D]grande es [G]Él!`,
  },
  {
    id: 'song-2',
    title: 'De Ellos Aprendí',
    artist: 'David Rees',
    originalKey: 'C',
    bpm: 110,
    timeSignature: '4/4',
    tags: ['Pop', 'Acústico', 'Inspiración'],
    createdAt: '2026-01-12T11:30:00Z',
    content: `[Intro]
[C] [G] [Am] [F]

[Verso 1]
[C]Escribe cien veces "no debo [G]pasar el tiempo mirando las musas",
[Am]afuera está lloviendo y no tengo [F]paraguas ni excusas.
[C]Hoy voy a ser el rey león que [G]rugirá en la sabana,
[Am]yo sé que hay un amigo en mí [F]que nunca me falla.

[Pre-Coro]
[Am]Hakuna matata, vive y [G]sé feliz,
[F]ningún problema te debe [G]hacer sufrir.
[Am]Sigue nadando, sigue na[G]dando,
[F]que hasta el infinito y más allá [G]llegarás.

[Coro]
Y a[C]prendí que hay personas por las [G]que vale la pena derretirse,
que la [Am]belleza está en el interior y [F]nunca hay que rendirse.
Que un [C]héroe verdadero no se [G]mide por la fuerza de sus brazos,
sino [Am]por la fuerza de su gran co[F]razón.`,
  },
  {
    id: 'song-3',
    title: 'La Flaca',
    artist: 'Jarabe de Palo',
    originalKey: 'Am',
    bpm: 116,
    timeSignature: '4/4',
    tags: ['Rock', 'Pop Latino', 'Clásico'],
    createdAt: '2026-01-14T09:15:00Z',
    content: `[Intro]
[Am] [G] [F] [E7]

[Verso 1]
En la [Am]tarde de aquel día calor [G]de la Habana vieja,
con un [F]trago en la mano y una flor en la ore[E7]ja.
Caminaba [Am]despacito con un aire de [G]diosa,
aquella tremenda [F]mulata tan sabrosa y tan her[E7]mosa.

[Coro]
Por un [Am]beso de la Flaca daría lo [G]que fuera,
por un [F]beso de ella, aunque sólo [E7]uno fuera.
Por un [Am]beso de la Flaca daría lo [G]que fuera,
por un [F]beso de ella, aunque sólo [E7]uno fuera.

[Verso 2]
Cien [Am]libras de piel y hueso, cuarenta [G]kilos de salsa,
y en la [F]cara dos soles que sin palabras me [E7]hablan.
Que sin palabras me [Am]dicen todo lo que calla la [G]boca,
y una sonrisa que [F]a cualquiera vuelve [E7]loco.

[Coro]
Por un [Am]beso de la Flaca daría lo [G]que fuera,
por un [F]beso de ella, aunque sólo [E7]uno fuera.`,
  },
  {
    id: 'song-4',
    title: 'Tu Fidelidad',
    artist: 'Marcos Witt',
    originalKey: 'D',
    bpm: 68,
    timeSignature: '4/4',
    tags: ['Alabanza', 'Balada', 'Espiritual'],
    createdAt: '2026-01-15T14:20:00Z',
    content: `[Intro]
[D] [G] [A] [D]

[Coro]
Tu fideli[D]dad es [Em]grande,
tu fideli[A]dad incompa[D]rable es.
Nadie como [Bm]tú, bendito [Em]Dios,
grande [A]es tu fideli[D]dad.

[Verso]
Cada ma[D]ñana se renuevan tus mise[Em]ricordias,
inagota[A]ble es tu gracia y tu a[D]mor.
En los mo[Bm]mentos de mayor os[Em]curidad,
siempre bri[A]lla tu dulce ver[D]dad.

[Coro]
Tu fideli[D]dad es [Em]grande,
tu fideli[A]dad incompa[D]rable es.
Nadie como [Bm]tú, bendito [Em]Dios,
grande [A]es tu fideli[D]dad.`,
  },
  {
    id: 'song-5',
    title: 'Color Esperanza',
    artist: 'Diego Torres',
    originalKey: 'G',
    bpm: 96,
    timeSignature: '4/4',
    tags: ['Pop', 'Latino', 'Inspiración'],
    createdAt: '2026-01-16T16:00:00Z',
    content: `[Intro]
[G] [D] [Em] [C]

[Verso 1]
Sé que [G]hay en tus ojos con sólo mi[D]rar,
que estás can[Em]sado de andar y de an[C]dar,
y cami[G]nar girando siempre en un lu[D]gar.
Sé que las [G]ventanas se pueden a[D]brir,
cambiar el [Em]aire depende de [C]ti,
te ayuda[G]rá, vale la pena una vez [D]más.

[Coro]
Saber que se [C]puede, que[D]rer que se [G]pueda,
quitarse los [C]miedos, sa[D]carlos a[Em]fuera.
Pintarse la [C]cara co[D]lor espe[G]ranza,
tentar al fu[C]turo con [D]el cora[G]zón.

[Verso 2]
Es mejor per[G]derse que nunca emba[D]rcar,
mejor ten[Em]tar a las cosas bri[C]llar,
aunque te [G]duela y te cueste so[D]ñar.
Sentirás que el [G]alma vuela por can[D]tar una vez más.

[Coro]
Saber que se [C]puede, que[D]rer que se [G]pueda,
quitarse los [C]miedos, sa[D]carlos a[Em]fuera.
Pintarse la [C]cara co[D]lor espe[G]ranza,
tentar al fu[C]turo con [D]el cora[G]zón.`,
  },
  {
    id: 'song-6',
    title: 'Rayando El Sol',
    artist: 'Maná',
    originalKey: 'G',
    bpm: 85,
    timeSignature: '4/4',
    tags: ['Rock', 'Balada', 'En Español'],
    createdAt: '2026-01-18T12:00:00Z',
    content: `[Intro]
[G] [C] [D] [G]

[Verso 1]
Ra[G]yando el sol, [C]rayando por ti,
esta [D]pena me duele, me quema sin [G]ti.
Es más fácil lle[G]gar al sol que a tu cora[C]zón,
me muero por [D]ti, viviendo sin [G]ti.

[Coro]
Ra[G]yando el sol, [C]desesperación,
es más [D]fácil llegar al sol que a tu cora[G]zón.
Me muero por [G]ti, [C]rayando el sol,
oh, [D]no me desampares en el rincón del a[G]mor.

[Verso 2]
Apenas [G]sale el sol y ya me pongo a [C]pensar,
si algún [D]día de estos tú me vas a es[G]cuchar.
Buscando una [G]razón para no desmayar [C]hoy,
esperando la [D]luz que ilumine mi [G]voz.`,
  },
  {
    id: 'song-7',
    title: 'Hallelujah',
    artist: 'Leonard Cohen (Español)',
    originalKey: 'C',
    bpm: 58,
    timeSignature: '6/8',
    tags: ['Balada', 'Clásico', 'Acústico'],
    createdAt: '2026-01-20T18:00:00Z',
    content: `[Intro]
[C] [Am] [C] [Am]

[Verso 1]
Un [C]rey secreto en sole[Am]dad,
tocó un a[C]corde para dar la [Am]paz,
mas [F]no te importa la mú[G]sica, ¿ver[C]dad? [G]
Y [C]va de cuarta a [F]quinta [G]bien,
sube el me[Am]nor, el ma[F]yor después,
el [G]rey perplejo com[E7]puso el Ale[Am]luya.

[Coro]
Ale[F]luya, Ale[Am]luya,
Ale[F]luya, Ale[C]lu[G]ya... [C]

[Verso 2]
Tu [C]fe era fuerte, pero [Am]la perdiste,
la [C]viste hermosa bañándo[Am]se allí,
su [F]luz y el viento de la [G]noche te ven[C]ció. [G]
Te [C]ató a la silla [F]del de[G]seo,
rompió tu [Am]trono y cortó [F]tu pelo,
y [G]de tus labios sa[E7]có este Ale[Am]luya.

[Coro]
Ale[F]luya, Ale[Am]luya,
Ale[F]luya, Ale[C]lu[G]ya... [C]`,
  },
];

export const INITIAL_SONGS: Song[] = RAW_SONGS.map(song => ({
  ...song,
  plainLyrics: extractPlainLyrics(song.content),
}));
