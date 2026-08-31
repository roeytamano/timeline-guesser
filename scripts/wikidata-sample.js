const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const DEFAULT_CATEGORY = 'history';
const DEFAULT_LIMIT = 250;
const PAGE_SIZE = 100;

function parseArgs() {
  const args = {
    category: process.env.DEFAULT_IMPORT_CATEGORY || DEFAULT_CATEGORY,
    limit: Number(process.env.DEFAULT_IMPORT_LIMIT || DEFAULT_LIMIT),
    dryRun: false,
  };

  for (let i = 0; i < process.argv.length; i += 1) {
    const value = process.argv[i];

    if (value === '--category') {
      args.category = process.argv[i + 1];
      i += 1;
    } else if (value === '--limit') {
      args.limit = Number(process.argv[i + 1]);
      i += 1;
    } else if (value === '--dry-run') {
      args.dryRun = true;
    } else if (value === '--help' || value === '-h') {
      console.log(`Usage: node scripts/wikidata-sample.js [--category history] [--limit 250] [--dry-run]`);
      process.exit(0);
    }
  }

  return args;
}

function sanitizeText(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 255);
}

function normalizeYear(rawDate) {
  if (!rawDate) return null;

  const timestamp = new Date(rawDate);
  if (Number.isNaN(timestamp.getTime())) {
    const isoMatch = rawDate.match(/(\d{4})/);
    if (!isoMatch) return null;
    return Number(isoMatch[1]);
  }

  return timestamp.getUTCFullYear();
}

function buildQuery(limit) {
  return `
    SELECT ?item ?label ?image ?date WHERE {
      ?item wdt:P18 ?image ;
            p:P571/psv:P571 [ wikibase:timeValue ?date ] .

      SERVICE wikibase:label { bd:serviceParam wikibase:language "en" . }
    }
    ORDER BY ?date
    LIMIT ${Math.max(10, Math.min(limit || DEFAULT_LIMIT, 5000))}
  `;
}

async function fetchWikidataRows({ limit, category }) {
  const attempts = [limit, Math.min(limit, 50), Math.min(limit, 20), 10];
  const uniqueAttempts = [...new Set(attempts.filter(Boolean))];

  let lastError;

  for (const attemptLimit of uniqueAttempts) {
    const query = buildQuery(attemptLimit);
    const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}&format=json`;

    try {
      const response = await fetch(url, {
        headers: {
          Accept: 'application/sparql-results+json',
          'User-Agent': 'TimelineGuesser/0.1 (+https://github.com/roeytamano/timeline-guesser)',
        },
      });

      if (!response.ok) {
        if (response.status === 504 && attemptLimit !== uniqueAttempts[uniqueAttempts.length - 1]) {
          continue;
        }
        throw new Error(`Wikidata request failed with status ${response.status}`);
      }

      const payload = await response.json();

      return payload.results.bindings
        .map((row) => {
          const label = sanitizeText(row.label?.value);
          const imageUrl = row.image?.value || null;
          const exactYear = normalizeYear(row.date?.value);

          if (!label || !Number.isInteger(exactYear)) {
            return null;
          }

          const cleanCategory = sanitizeText(category) || DEFAULT_CATEGORY;

          return {
            title: label,
            description: `Imported from Wikidata in the ${cleanCategory} category.`,
            image_url: imageUrl,
            exact_year: exactYear,
            category: cleanCategory,
          };
        })
        .filter(Boolean)
        .filter((item, index, allItems) => allItems.findIndex((candidate) => candidate.title === item.title) === index)
        .slice(0, limit);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('Wikidata lookup failed.');
}

async function ensureSchema(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS questions (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL,
      image_url TEXT,
      exact_year INTEGER NOT NULL,
      category TEXT NOT NULL DEFAULT 'history'
    );
  `);
}

async function bulkInsertQuestions(pool, rows) {
  if (!rows.length) {
    console.log('No rows to import.');
    return 0;
  }

  for (let i = 0; i < rows.length; i += PAGE_SIZE) {
    const batch = rows.slice(i, i + PAGE_SIZE);
    const valuesSql = batch
      .map((_, index) => `($${index * 5 + 1}, $${index * 5 + 2}, $${index * 5 + 3}, $${index * 5 + 4}, $${index * 5 + 5})`)
      .join(', ');

    const flatValues = batch.flatMap((row) => [
      row.title,
      row.description,
      row.image_url,
      row.exact_year,
      row.category,
    ]);

    const sql = `
      INSERT INTO questions (title, description, image_url, exact_year, category)
      VALUES ${valuesSql}
      ON CONFLICT (title) DO UPDATE SET
        description = EXCLUDED.description,
        image_url = EXCLUDED.image_url,
        exact_year = EXCLUDED.exact_year,
        category = EXCLUDED.category
    `;

    await pool.query(sql, flatValues);
  }

  return rows.length;
}

async function main() {
  const args = parseArgs();
  const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:1234@localhost:5432/timeline_guesser';

  console.log(`Connecting to PostgreSQL at ${databaseUrl.replace(/:[^@]+@/, ':***@')}`);
  console.log(`Import category: ${args.category} | limit: ${args.limit} | dryRun: ${args.dryRun}`);

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: false,
  });

  try {
    const rows = await fetchWikidataRows({ limit: args.limit, category: args.category });

    console.log(`Fetched ${rows.length} usable Wikidata items.`);

    if (args.dryRun) {
      console.log(JSON.stringify(rows.slice(0, 5), null, 2));
      return;
    }

    await ensureSchema(pool);
    const inserted = await bulkInsertQuestions(pool, rows);
    console.log(`Inserted or updated ${inserted} question rows.`);
  } catch (error) {
    console.error('Wikidata import failed:', error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
