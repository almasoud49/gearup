import "dotenv/config";

export default {
  schema: {
    folder: "prisma/schema"
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
};