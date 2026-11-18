export interface WordItem {
  id: string;
  english: string;
  russian: string;
  emoji: string;
  exampleSentence: string;
}

export interface TopicData {
  id: string;
  title: string;
  themeColor: string;
  words: WordItem[];
}

export const lessons: TopicData[] = [
  {
    id: "animals",
    title: "Animals",
    themeColor: "#f5a94d",
    words: [
      { id: "cat", english: "Cat", russian: "Кошка", emoji: "🐱", exampleSentence: "The cat is sleeping." },
      { id: "dog", english: "Dog", russian: "Собака", emoji: "🐶", exampleSentence: "The dog loves to play." },
      { id: "rabbit", english: "Rabbit", russian: "Кролик", emoji: "🐰", exampleSentence: "The rabbit can hop." },
      { id: "lion", english: "Lion", russian: "Лев", emoji: "🦁", exampleSentence: "The lion has a big mane." },
      { id: "elephant", english: "Elephant", russian: "Слон", emoji: "🐘", exampleSentence: "The elephant has a long trunk." },
    ],
  },
  {
    id: "food",
    title: "Food",
    themeColor: "#f27f79",
    words: [
      { id: "apple", english: "Apple", russian: "Яблоко", emoji: "🍎", exampleSentence: "The apple is red." },
      { id: "banana", english: "Banana", russian: "Банан", emoji: "🍌", exampleSentence: "The banana is yellow." },
      { id: "bread", english: "Bread", russian: "Хлеб", emoji: "🍞", exampleSentence: "I like warm bread." },
      { id: "cheese", english: "Cheese", russian: "Сыр", emoji: "🧀", exampleSentence: "The mouse likes cheese." },
      { id: "carrot", english: "Carrot", russian: "Морковь", emoji: "🥕", exampleSentence: "The rabbit eats a carrot." },
    ],
  },
  {
    id: "space",
    title: "Space",
    themeColor: "#8c78e9",
    words: [
      { id: "star", english: "Star", russian: "Звезда", emoji: "⭐", exampleSentence: "The star shines at night." },
      { id: "moon", english: "Moon", russian: "Луна", emoji: "🌙", exampleSentence: "The moon is bright tonight." },
      { id: "sun", english: "Sun", russian: "Солнце", emoji: "☀️", exampleSentence: "The sun is warm." },
      { id: "planet", english: "Planet", russian: "Планета", emoji: "🪐", exampleSentence: "Earth is a planet." },
      { id: "rocket", english: "Rocket", russian: "Ракета", emoji: "🚀", exampleSentence: "The rocket flies into space." },
    ],
  },
  {
    id: "colors",
    title: "Colors",
    themeColor: "#62c69a",
    words: [
      { id: "red", english: "Red", russian: "Красный", emoji: "🔴", exampleSentence: "The apple is red." },
      { id: "blue", english: "Blue", russian: "Синий", emoji: "🔵", exampleSentence: "The sky is blue." },
      { id: "green", english: "Green", russian: "Зелёный", emoji: "🟢", exampleSentence: "The grass is green." },
      { id: "yellow", english: "Yellow", russian: "Жёлтый", emoji: "🟡", exampleSentence: "The sun is yellow." },
      { id: "purple", english: "Purple", russian: "Фиолетовый", emoji: "🟣", exampleSentence: "The flower is purple." },
    ],
  },
];
