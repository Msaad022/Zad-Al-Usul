import { defineDb, defineTable, column, NOW } from "astro:db";

const Questions = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    type_que: column.text(),
    question: column.text(),
    answer: column.text(),
    audio_url: column.text(),
    secure_url: column.text(),
    words: column.json(),
    description: column.text(),
    published: column.date({ default: NOW }),
  },
});

export default defineDb({
  tables: {
    Questions,
  },
});
