export type Section = 'about' | 'projects' | 'experience' | 'education' | 'skills' | 'research' | 'notebook' | 'books' | 'music' | 'travel' | 'artwork' | 'posters' | 'guestbook' | 'balcony';
export const sections: { id: Section; title: string; object: string; description: string }[] = [
  {id:'about',title:'A little about me',object:'My world',description:'Kerala roots. Melbourne days. A few things in between.'},
  {id:'projects',title:'Things I’ve built',object:'The laptop',description:'From an idea in a notebook to a working product.'},
  {id:'experience',title:'My journey so far',object:'The experience frame',description:'People, projects and places that shaped my work.'},
  {id:'education',title:'Always learning',object:'The education frame',description:'Electronics, communication and now data science.'},
  {id:'skills',title:'My technical toolbox',object:'The desk',description:'The tools I use to turn questions into working systems.'},
  {id:'research',title:'A little deeper',object:'The research frame',description:'Co-authored research, published in IEEE Xplore.'},
  {id:'notebook',title:'Notes to myself',object:'The notebook',description:'How I think. What I’ve learnt. What I’m still figuring out.'},
  {id:'books',title:'On my bookshelf',object:'The bookshelf',description:'A few spaces for the books that stay with me.'},
  {id:'music',title:'On the turntable',object:'The record player',description:'The soundtrack is still taking shape.'},
  {id:'travel',title:'A world of memories',object:'The globe',description:'Places and stories, added only when I’ve confirmed them.'},
  {id:'artwork',title:'Work in progress',object:'The easel',description:'A space for photographs, sketches and experiments.'},
  {id:'posters',title:'Little influences',object:'The poster wall',description:'Still choosing what goes on this wall.'},
  {id:'guestbook',title:'Leave a little hello',object:'The corkboard',description:'A small note in my world. Here for seven days.'},
  {id:'balcony',title:'A little piece of home',object:'The balcony',description:'Kerala, on a peaceful monsoon day.'},
];
export const navigation: Section[] = ['about','projects','experience','education','skills','research','books','guestbook'];
export const notebookPages = [
 ['Leakage is the silent killer.','Every feature in my World Cup model only uses information available before kick-off. A model that peeks at the future looks brilliant in testing and fails in reality.'],
 ['A probability is a promise.','I calibrated the predictor because “60% chance” should mean it happens about 60% of the time.'],
 ['Know when not to answer.','My chatbot uses a confidence threshold. A clear “I’m not sure” beats a confident wrong answer.'],
 ['Old matches matter less.','A 1990 friendly shouldn’t count as much as a 2022 World Cup game.'],
 ['Check the hardware before the code.','My IoT monitor’s bug was an I2C logic-level mismatch, not software.'],
 ['The model is the easy part.','Most of the work was data cleaning, features, deployment and keeping it updating.'],
 ...Array.from({length:4},()=>['Still figuring this one out.','A blank page for the next idea.']),
];
export const placeholderSlots = (count:number) => Array.from({length:count},()=>({status:'placeholder' as const,title:'',author:'',image:null}));