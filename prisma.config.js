require('dotenv').config();

module.exports = {
  schema: {
    folder: "prisma/schema"
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
};