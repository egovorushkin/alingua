import type { Icon3DFile } from "@/components/ui/Icon3D";

export interface WordItem {
  id: string;
  english: string;
  russian: string;
  icon: Icon3DFile;
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
    title: "Животные",
    themeColor: "#f5a94d",
    words: [
      { id: "cat", english: "Cat", russian: "Кошка", icon: "cat.png", emoji: "🐱", exampleSentence: "The cat is sleeping." },
      { id: "dog", english: "Dog", russian: "Собака", icon: "dog.png", emoji: "🐶", exampleSentence: "The dog loves to play." },
      { id: "rabbit", english: "Rabbit", russian: "Кролик", icon: "rabbit.png", emoji: "🐰", exampleSentence: "The rabbit can hop." },
      { id: "lion", english: "Lion", russian: "Лев", icon: "lion.png", emoji: "🦁", exampleSentence: "The lion has a big mane." },
      { id: "elephant", english: "Elephant", russian: "Слон", icon: "elephant.png", emoji: "🐘", exampleSentence: "The elephant has a long trunk." },
    ],
  },
  {
    id: "food",
    title: "Еда",
    themeColor: "#f27f79",
    words: [
      { id: "apple", english: "Apple", russian: "Яблоко", icon: "apple.png", emoji: "🍎", exampleSentence: "The apple is red." },
      { id: "banana", english: "Banana", russian: "Банан", icon: "banana.png", emoji: "🍌", exampleSentence: "The banana is yellow." },
      { id: "bread", english: "Bread", russian: "Хлеб", icon: "bread.png", emoji: "🍞", exampleSentence: "I like warm bread." },
      { id: "cheese", english: "Cheese", russian: "Сыр", icon: "cheese.png", emoji: "🧀", exampleSentence: "The mouse likes cheese." },
      { id: "carrot", english: "Carrot", russian: "Морковь", icon: "carrot.png", emoji: "🥕", exampleSentence: "The rabbit eats a carrot." },
    ],
  },
  {
    id: "space",
    title: "Космос",
    themeColor: "#8c78e9",
    words: [
      { id: "star", english: "Star", russian: "Звезда", icon: "star.webp", emoji: "⭐", exampleSentence: "The star shines at night." },
      { id: "moon", english: "Moon", russian: "Луна", icon: "moon.png", emoji: "🌙", exampleSentence: "The moon is bright tonight." },
      { id: "sun", english: "Sun", russian: "Солнце", icon: "sun.png", emoji: "☀️", exampleSentence: "The sun is warm." },
      { id: "planet", english: "Planet", russian: "Планета", icon: "planet.png", emoji: "🪐", exampleSentence: "Earth is a planet." },
      { id: "rocket", english: "Rocket", russian: "Ракета", icon: "rocket.webp", emoji: "🚀", exampleSentence: "The rocket flies into space." },
    ],
  },
  {
    id: "colors",
    title: "Цвета",
    themeColor: "#62c69a",
    words: [
      { id: "red", english: "Red", russian: "Красный", icon: "red.png", emoji: "🔴", exampleSentence: "The apple is red." },
      { id: "blue", english: "Blue", russian: "Синий", icon: "blue.png", emoji: "🔵", exampleSentence: "The sky is blue." },
      { id: "green", english: "Green", russian: "Зелёный", icon: "green.png", emoji: "🟢", exampleSentence: "The grass is green." },
      { id: "yellow", english: "Yellow", russian: "Жёлтый", icon: "yellow.png", emoji: "🟡", exampleSentence: "The sun is yellow." },
      { id: "purple", english: "Purple", russian: "Фиолетовый", icon: "purple.png", emoji: "🟣", exampleSentence: "The flower is purple." },
    ],
  },
  {
    id: "nature",
    title: "Природа",
    themeColor: "#62c69a",
    words: [
      { id: "tree", english: "Tree", russian: "Дерево", icon: "tree.png", emoji: "🌳", exampleSentence: "A bird is in the tree." },
      { id: "flower", english: "Flower", russian: "Цветок", icon: "flower.png", emoji: "🌷", exampleSentence: "The flower is pink." },
      { id: "river", english: "River", russian: "Река", icon: "river.png", emoji: "🏞️", exampleSentence: "The river is long." },
      { id: "mountain", english: "Mountain", russian: "Гора", icon: "mountain.png", emoji: "⛰️", exampleSentence: "The mountain is high." },
      { id: "bird", english: "Bird", russian: "Птица", icon: "bird.png", emoji: "🐦", exampleSentence: "The bird can fly." },
    ],
  },
  {
    id: "transport",
    title: "Транспорт",
    themeColor: "#68aee0",
    words: [
      { id: "car", english: "Car", russian: "Машина", icon: "car.png", emoji: "🚗", exampleSentence: "The car is red." },
      { id: "bus", english: "Bus", russian: "Автобус", icon: "bus.png", emoji: "🚌", exampleSentence: "The bus is big." },
      { id: "train", english: "Train", russian: "Поезд", icon: "train.png", emoji: "🚆", exampleSentence: "The train is fast." },
      { id: "bicycle", english: "Bicycle", russian: "Велосипед", icon: "bicycle.png", emoji: "🚲", exampleSentence: "I ride my bicycle." },
      { id: "boat", english: "Boat", russian: "Лодка", icon: "boat.png", emoji: "⛵", exampleSentence: "The boat is on the water." },
    ],
  },
];
