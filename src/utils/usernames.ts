const adjectives = [
  "Sunny","Cozy","Sweet","Tiny","Fluffy","Snug","Happy","Bouncy","Gentle","Cheery",
  "Merry","Bright","Shiny","Sparkly","Dreamy","Peachy","Rosy","Warm","Calm","Soft",
  "Cuddly","Jolly","Dainty","Lovely","Fancy","Playful","Zippy","Perky","Breezy","Chirpy",
  "Wiggly","Sleepy","Smiley","Twinkly","Puffy","Fuzzy","Silky","Velvety","Nifty","Neat",
  "Spry","Snappy","Chummy","Giggly","Bubbly","Lively","Golden","Honey","Berry","Minty",
  "Toasty","Glowy","Mellow","Dapper","Charming","Cute","Adorable","Precious","Pinky","Lilac",
  "Coral","Sandy","Snowy","Icy","Starry","Moonlit","Petal","Blossomy","Dewy","Feathery",
  "Cloudy","Poppy","Clover","Maple","Toffee","Sugar","Jazzy","Dizzy","Whimsy","Wavy",
  "Pudding","Button","Kooky","Sprinkles","Nimble","Swoony","Twirly","Velvet","Crispy","Noodly",
  "Jumpy","Tidy","Snazzy","Lucky","Chipper","Airy","Silvery","GlowyFresh","CozyBold","SweetNova"
];

const animals = [
  "Bunny", "Rabbit", "Kitten", "Puppy", "Otter", "Panda", "Koala", "Hamster", "Gerbil", "Ferret", "Hedgehog", "Squirrel",
  "Chipmunk", "Mouse", "Fawn", "Lamb", "Duckling", "Chickadee", "Bluebird", "Robin", "Finch", "Canary", "Wren", "Lark",
  "Dove", "Penguin", "Seal", "Fox", "Bear", "Cub", "Sloth", "Lemur", "Alpaca", "Llama", "Pony", "Calf",
  "Piglet", "Goat", "Deer", "Marmot", "Beaver", "Badger", "Raccoon", "Skunk", "Mole", "Meerkat", "Weasel", "Mink",
  "Pika", "Mouselet", "FuzzyBat", "Cottontail", "Snowshoe", "Dormouse", "Jerboa", "Shrew", "Vole", "Marten", "Binturong", "Possum",
  "Quokka", "Wallaby", "Wombat", "Kangaroo", "SugarGlider", "RedPanda", "ArcticFox", "SilverFox", "PolarBear", "Reindeer", "Moose", "Yak",
  "Sheep", "Ewe", "Duck", "Goose", "Swan", "Peep", "Chick", "Parakeet", "Budgie", "Lovebird", "Cockatiel", "Parrotlet",
  "Puffin", "Owlet", "Owl", "Hummingbird", "Sparrow", "Goldfinch", "Starling", "Bunnyfox", "Civet", "Tamarin", "Macaque", "Gibbon",
  "Pomeranian", "Corgi", "Samoyed", "Maltipoo"
];


export function generateUsername() {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const animal = animals[Math.floor(Math.random() * animals.length)];
  const number = Math.floor(Math.random() * 1000);
  return `${adjective}${animal}${number}`;
}