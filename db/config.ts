import { defineDb, defineTable, column } from "astro:db";

// https://astro.build/db/config

const Question = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    type_que: column.text(),
    question: column.text(),
    answer: column.text(),
    audio_url: column.text(),
    secure_url: column.text(),
    words: column.json(),
  },
});

const MainEntity = defineTable({
  columns: {
    id: column.number({ primaryKey: true, autoIncrement: true }),
    question_id: column.text({ references: () => Question.columns.id }),
    comment: column.text(),
    acceptedAnswer: column.text(),
  },
});

const Description = defineTable({
  columns: {
    id: column.number({ primaryKey: true, autoIncrement: true }),
    mainEntity_id: column.number({ references: () => MainEntity.columns.id }),
    type: column.text({ enum: ["desQuestion", "desAnswer"] }),
    alternateName: column.text(),
  },
});

const ListItem = defineTable({
  columns: {
    id: column.number({ primaryKey: true, autoIncrement: true }),
    description_id: column.number({ references: () => Description.columns.id }),
    item: column.text(),
  },
});

export default defineDb({
  tables: {
    Question,
    MainEntity,
    Description,
    ListItem,
  },
});
