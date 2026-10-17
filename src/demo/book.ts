/* The demo book: a fictional birthday for "Alex" from fourteen fictional friends, one for each page style.
   Media are generated illustrations (scripts/make-demo-media.mjs), not real photos. */
import type { Book, Contribution, PageConfig } from '@/engine/types';
import media from './media.json';

type Key = keyof typeof media;
const m = (k: Key) => media[k] as Contribution['media'];

const notes: Record<string, [Key, string]> = {
  Leah: ['leah', `Greetings from the city we keep promising to move to. I bought you a tile from the market and then remembered you'd make me carry it through three airports, so it's on the shelf here waiting for you.\n\nHappy 25th, Alex. Come visit before I forget how to speak English.`],
  Theo: ['theo', `Six years. That's how long you've been the first person I text about anything — good news, bad news, a weird dog. You survived uni with me, my cooking, and that flat with the mystery smell. I couldn't have done any of it without you. Here's to the next six.`],
  Priya: ['priya', `Every birthday since our first year, we've done something ridiculous, and I have the photos to prove it. Pancakes at 2am, the rooftop, the concert where you lost your voice in the first song. Thank you for always being my person. Happy birthday, Alex — this year's ridiculous thing is on me.`],
  Sam: ['sam', `Found this from the road trip. You insisted the car was making "a noise" for four hours and it was your phone. I still think about that every time we drive anywhere. Thanks for being the best co-pilot and the worst DJ.`],
  Ines: ['ines', `Stranger in the same lecture, then the same conference, then lab neighbours, and somehow now one of my favourite people. Watching you grow into who you are has been the best part of these years. Love you lots — let's celebrate properly soon!`],
  Noor: ['noor', `You came into my life at the most random moment and somehow made everything warmer. Every time we hang out, time just disappears. I hope this year is as kind to you as you are to everyone around you.`],
  Ravi: ['ravi', `Happy birthday! It took us a while to become friends, but we got there. We finally have some foundations built. Also: I'm never trusting your movie recommendations again. Have a great day!`],
  Kai: ['kai', ``],
  Zoe: ['zoe', `Happy 25th! Four years ago you were the person who left every party at ten. Now look at you. Can't wait to see what's next.`],
  Eli: ['eli', `I've watched you work so hard these past few years and it's amazing to see it all coming together. You're one of the kindest people I know and it shows in everything you do. You're not done yet — not even close. Here's to many more!`],
  Mira: ['mira', `Hi Alex! Happy birthday!! Come home soon. I miss you. I love you ❤️`],
  Ben: ['ben', `Happy birthday Alex!! 🎂 Never stop being the person who orders three bowls of ramen and finishes all of them 🍜😭 Love you, have the best day ever ✨`],
  June: ['june', `I didn't realise until you said it that we spent years orbiting each other — same orientation, same seminars, same parties — without ever really talking. And then, finally, we did. Turns out some of the best people in your life were there the whole time. Happy birthday ❤️`],
  Omar: ['omar', `Dear Runner, Coworker, Lunch Thief & Neighbour,\n\nYou're one of the kindest people I know. Thanks for the Saturday runs, the stolen fries and the commute company. Never change, and never let anyone slow you down.\n\nHappy birthday!\nOmar`],
};

const friends: PageConfig[] = [
  { name: 'Leah', style: 'postcard', place: 'Lisbon', petName: 'sunshine', quote: 'Come visit before I forget how to speak English.' },
  { name: 'Theo', style: 'years', years: 6, receipt: [['years', '6'], ['days', '2,191'], ['bad dinners', 'many'], ['good ones', 'more'], ['still here', '✓']], quote: 'You’ve been the first person I text about anything.' },
  { name: 'Priya', style: 'clothesline', title: 'every birthday since first year', quote: 'Thank you for always being my person.' },
  { name: 'Sam', style: 'camcorder', label: 'road trip', quote: 'The best co-pilot and the worst DJ.' },
  { name: 'Ines', style: 'tickets', steps: ['same lecture', 'same conference', 'lab neighbours', 'favourite people'], sticker: '🥂🥂', quote: 'Watching you grow has been the best part.' },
  { name: 'Noor', style: 'sunshine', banner: 'time disappears with you', develop: ['there you are ✦', 'warm, always ✦'], quote: 'You made everything warmer.' },
  { name: 'Ravi', style: 'blocks', stamp: 'movie taste: NOT TRUSTED', since: '2 yrs ago', caption: 'foundations: built ✓', quote: 'We finally have some foundations built.' },
  { name: 'Kai', style: 'stories', title: 'Kai let the photos do the talking 📸' },
  { name: 'Zoe', style: 'arc', years: 4, title: 'the character arc', arc: [['2022', '🧃'], ['2023', '🍹'], ['2024', '💃'], ['2025', '🎤'], ['2026', '🪩']], stamp: 'MAIN CHARACTER ✓', tab: [['10pm exits', 'retired'], ['dance floor', 'claimed'], ['karaoke', 'legendary'], ['TOTAL', 'no regrets']], quote: 'Can’t wait to see what’s next.' },
  { name: 'Eli', style: 'puzzle', title: 'it’s all coming together', kicker: 'LOADING: YEARS OF HARD WORK', quote: 'You’re not done yet — not even close.' },
  { name: 'Mira', style: 'flight', from: ['ANY', 'wherever you are'], to: ['LIS', 'Lisbon'], airline: 'COME HOME AIRWAYS', title: 'window seat home', quote: 'Come home soon. I miss you.' },
  { name: 'Ben', style: 'pasta', title: 'Ramen Bar Ben', dish: '🍜', lines: ['one for the birthday legend', 'seconds, obviously', 'the usual: 3 bowls 😭', 'chef is impressed', 'okay legend 👑'], bill: [['ramen ×3', 'as usual'], ['smiles', 'always'], ['birthday', 'the best'], ['TOTAL', 'on the house ♡']], quote: 'Never stop finishing all three bowls.' },
  { name: 'June', style: 'paths', title: 'in each other’s orbit', main: 1, stops: ['orientation week', 'same seminars', 'same parties', 'finally.'], quote: 'Some of the best people were there the whole time.' },
  { name: 'Omar', style: 'run', title: 'run club of two', stops: [['Runner', 0], ['Coworker', 1], ['Lunch thief', 2], ['Neighbour', 3]], quote: 'Never let anyone slow you down.' },
];

const contributions: Contribution[] = Object.entries(notes).map(([name, [key, note]]) => ({ name, note, media: m(key) }));

export const demoBook: Book = {
  config: {
    name: 'Alex',
    nickname: 'Alex',
    age: 25,
    birthday: 'March 3',
    sign: 'Pisces ♓',
    from: 'Jordan',
    friends,
    letter: [
      'Twenty-five looks good on you.',
      'Everyone in this book had something different to say, but it all came back to the same thing: you make people feel seen, and you make ordinary days fun.',
      'Happy birthday, Alex. Thank you for being exactly you.',
    ],
    starNotes: [
      'you light up every room you walk into', 'your laugh is the best sound', 'the world is softer with you in it',
      'you make everyone feel at home', 'so, so proud of you', 'you deserve every good thing coming your way',
      'never stop being exactly you', 'lucky us, we get to know you',
    ],
  },
  contributions,
};
