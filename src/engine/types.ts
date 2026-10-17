/* The shape of a book the engine can render. Today it is a plain object (see src/demo/book.ts);
   later it comes from the database, assembled from what each friend submitted. */

export type Media = {
  type: 'photo' | 'video';
  src: string;   // full size: up to 1600px photo, or an H.264 mp4
  thumb: string; // ~600px photo, or the video's poster frame
  w: number;     // thumbnail width/height, used for layout before images load
  h: number;
};

/** One friend's contribution: what they wrote and sent. */
export type Contribution = {
  name: string;
  note: string;
  media: Media[];
};

/**
 * How a friend's page looks. `style` picks a page design from the engine's library; every other field is
 * optional and style-specific (titles, stamps, checkpoints…). Unknown styles fall back to "auto".
 */
export type PageConfig = {
  name: string;
  style:
    | 'postcard' | 'years' | 'clothesline' | 'camcorder' | 'tickets' | 'sunshine' | 'blocks' | 'stories'
    | 'birthdays' | 'arc' | 'puzzle' | 'flight' | 'pasta' | 'paths' | 'run' | 'dump' | 'auto';
  quote?: string; // the line their star shows on the "your people" page
  [option: string]: unknown;
};

export type BookConfig = {
  name: string;      // the recipient, e.g. "Alex"
  nickname: string;  // what friends call them, e.g. "Lex"
  age: number;
  birthday: string;  // shown as written, e.g. "March 3"
  sign?: string;     // star sign line on the bookplate
  from: string;      // the organizer, who writes the closing letter
  friends: PageConfig[];
  letter: string[];  // the organizer's closing letter, one paragraph per entry
  starNotes: string[];
  music?: string;    // optional audio file; otherwise a generated tune plays
};

export type Book = {
  config: BookConfig;
  contributions: Contribution[];
};
