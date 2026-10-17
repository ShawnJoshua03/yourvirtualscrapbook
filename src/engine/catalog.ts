/* The page styles an organizer can choose for a friend, with what each needs to look its best. */
import type { PageConfig } from './types';

export type StyleInfo = { style: PageConfig['style']; label: string; about: string; best: string };

export const STYLES: StyleInfo[] = [
  { style: 'auto', label: 'Automatic', about: 'Picks a simple layout from what they sent.', best: 'anything' },
  { style: 'postcard', label: 'Postcard', about: 'A postcard from where they are, note on the back.', best: '1 photo, someone far away' },
  { style: 'years', label: 'The years', about: 'Polaroids, a friendship receipt and a ring of years.', best: '4 photos, long friendships' },
  { style: 'clothesline', label: 'Fairy lights', about: 'Photos pegged on strings of lights you drag.', best: '6+ photos' },
  { style: 'camcorder', label: 'Home video', about: 'A camcorder frame playing their clip.', best: '1 video' },
  { style: 'tickets', label: 'Ticket stubs', about: 'A photo-booth strip and a ticket for each step.', best: '4 photos, a story in steps' },
  { style: 'sunshine', label: 'Sunshine', about: 'Instant photos that develop when tapped.', best: '2 photos, warm notes' },
  { style: 'blocks', label: 'Toy blocks', about: 'Blocks spelling their name you can knock over.', best: '3 photos, playful notes' },
  { style: 'stories', label: 'Stories', about: 'Tap-through stories and a wall to drag around.', best: 'lots of photos, little note' },
  { style: 'birthdays', label: 'Photo pile', about: 'A messy pile to shuffle through.', best: 'videos or many photos' },
  { style: 'arc', label: 'Character arc', about: 'A slider through the years; the photo grows up.', best: '1 photo, "look how you changed"' },
  { style: 'puzzle', label: 'Jigsaw', about: 'One photo as a puzzle that comes together.', best: '2–6 photos, "it all came together"' },
  { style: 'flight', label: 'Flight home', about: 'Videos behind window shades and a boarding pass.', best: 'videos, someone far away' },
  { style: 'pasta', label: 'Restaurant', about: 'Order plates; the note is on the guest check.', best: '1 photo, a food joke' },
  { style: 'paths', label: 'Two paths', about: 'Two lines that nearly meet, then do.', best: '1–4 photos, "we took a while"' },
  { style: 'run', label: 'Run club', about: 'A route with a checkpoint for each title.', best: '3–4 photos, nicknames for them' },
  { style: 'dump', label: 'Camera roll', about: 'A pile plus a contact sheet of everything.', best: 'many photos, no note' },
];

export const STYLE_IDS = new Set(STYLES.map(s => s.style));
