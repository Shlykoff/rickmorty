"use strict";
import fs from "fs";
import pg from "pg";
import format from "pg-format";
import dotenv from "dotenv";
dotenv.config();

const NUMBER_OF_CHARACTERS = Number(process.env.NUMBER_OF_CHARACTERS);
const TABLE_NAME = process.env.TABLE_NAME;
const DATABASE_URL = process.env.DATABASE_URL;
const API_URL = process.env.API_URL;
const PATH_TO_SSL_CERTIFICATE = process.env.PATH_TO_SSL_CERTIFICATE;

const { Client } = pg;
const config = {
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: true,
    ca: fs.readFileSync(PATH_TO_SSL_CERTIFICATE),
  },
};
const client = new Client(config);
await client.connect();

const getCharacters = async () => {
  const ids = [...Array(NUMBER_OF_CHARACTERS).keys()].map((i) => i + 1);
  try {
    const res = await fetch(API_URL + ids);
    return res.json();
  } catch (err) {
    console.error("ERROR: ", err);
  }
};

const createTable = async () => {
  try {
    const createQuery = `
    CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
      id SMALLSERIAL NOT NULL,
      name text NOT NULL,
      data jsonb NOT NULL,
      PRIMARY KEY (id)
    )
  `;
    await client.query(createQuery);
  } catch (err) {
    console.error("ERROR: ", err);
  }
};

const insertRecords = async () => {
  try {
    const record = [];
    const characters = await getCharacters();
    characters.map((character) => {
      record.push([character.name, character]);
    });
    const text = format(
      `INSERT INTO ${TABLE_NAME}(name, data) VALUES %L RETURNING id`,
      record
    );
    const insertQuery = {
      text,
      values: [],
    };
    const res = await client.query(insertQuery);
    console.info("INSERTING ", res.rows.length, " ROWS");
    await client.end();
  } catch (err) {
    console.error(err);
  }
};

createTable();
insertRecords();
