// Every spoken word in the Green. Ora is always it; home is a choice.
export const HOME_NAME = 'ATLAS';
export function hasFished(storage) {
  try { const d=JSON.parse(storage?.getItem('atlas.fish.v1')); const counts=d?.counts ?? d?.tally; return !!counts && Object.values(counts).some(v=>typeof v==='number'?v>0:v?.count>0); } catch { return false; }
}
export const GREENFOLK = [
  {id:'builder',name:'NEL — BUILDER',folk:8,at:[-4.8,-49],lines:c=>c.stage===3 ? ['There it is, Atlas. A house made by your own hands, with room for all the days ahead.','Ora seems to like the window. It has good taste.'] : c.ready ? [ ['Six good stones. Let us give your home somewhere to stand.','Eight lengths of timber. Come, we will raise the frame together.','Ten bundles of reeds. The roof will keep the rain singing outside.'][c.stage] ] : [
    ['Welcome to your land, Atlas. I am Nel. Shall we raise a little house together?','Six pale stones will make the foundation. Look along the pond bank and the edges of the fields.'],
    ['A firm foundation. Now eight fallen branches for the frame; the trees have left us plenty.','Look beneath the trees along the lane. No living branch needs cutting.'],
    ['It already feels like a home. Ten bundles of reeds will make a fine roof.','The reed beds around the pond have plenty to spare.']
  ][c.stage]},
  {id:'fisher',name:'SENN',folk:3,lines:c=>c.fished?['A catch of your own. The pond has made your acquaintance.',c.stage===3?'Supper on your own porch tonight, perhaps.':'The koi come close at dusk. I always stay a little longer.']:['The pond keeps its own hours. The koi begin to stir at dusk.','I come here for the quiet as much as the fish.']},
  {id:'farmer',name:'ERRA',folk:0,lines:c=>[c.stage===0?'Those pale stones at the field edges? Take what you need. My rake finds more every morning.':c.stage===1?'A foundation already. A little care each day adds up.':c.stage===2?'A frame! Leave a window facing the morning.':'Your garden will be happy with you so close by.','I go into Telor for bread on market days. Then straight back to my beans.']},
  {id:'keeper',name:'VESS',folk:5,lines:c=>[c.stage===3?'A flower box for your window. I saved the brightest seedlings.':'The glasshouse holds a little summer, even when the evening cools.','Ora can come inside. It is gentler with the leaves than most visitors.']},
  {id:'child',name:'PIP',folk:4,lines:c=>[c.stage===3?'The doves have seen your roof. They think you built it for them.':'I am following the doves. They keep changing their minds.',c.fished?'Was your fish bigger than my hand? Both hands?':'If I stand very still, they forget I am here.']},
  {id:'neighbour',name:'ILLA',folk:6,lines:c=>[c.stage===3?'Welcome, neighbour. I will leave some bread on your porch.':c.stage===2?'Your roof will smell lovely after the first rain.':'A house takes a few hands. A home takes coming back.','There is always room at my table while you build.']},
];

// Gift reactions: loved, liked, and a kind thank-you.
const GIFT_LINES = {
  "builder": [
    "Good grain. A loaf shared on a new porch is part of building a home.",
    "These will make a fine supper after the work.",
    "Thank you, Atlas. Thoughtful hands make good neighbours."
  ],
  "fisher": [
    "A Moon Koi. All those quiet evenings, gathered into one silver moment.",
    "A catch to share. The pond has been generous to us.",
    "Thank you. I shall take it home before dusk."
  ],
  "farmer": [
    "Look at those leaves. You have been paying attention to your soil.",
    "Good wheat. We shall have bread enough to share.",
    "Thank you, neighbour. Nothing given with care is wasted."
  ],
  "keeper": [
    "Such bright petals. I have just the place for them in the glasshouse.",
    "Tender greens. You have a gentle hand with growing things.",
    "Thank you, Atlas. How kind of you to think of me."
  ],
  "child": [
    "It is little enough for my hands! Look how it shines.",
    "I shall put these where the doves can see them.",
    "You brought me something! Thank you."
  ],
  "neighbour": [
    "These smell of sunshine. Come for supper; I shall put them in the pot.",
    "Grain for tomorrow’s bread. I shall save you the first slice.",
    "Thank you, neighbour. You must stay a little while."
  ]
};
export const greenGiftReaction = (id,taste) => [GIFT_LINES[id][taste==='love'?0:taste==='like'?1:2]];
