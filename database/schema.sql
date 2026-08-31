CREATE TABLE IF NOT EXISTS questions (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  image_url TEXT,
  exact_year INTEGER NOT NULL,
  category TEXT NOT NULL DEFAULT 'history'
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  elo_rating INTEGER NOT NULL DEFAULT 1000,
  games_played INTEGER NOT NULL DEFAULT 0,
  wins INTEGER NOT NULL DEFAULT 0
);

INSERT INTO questions (title, description, image_url, exact_year, category)
VALUES
  (
    'The printing press',
    'A machine that revolutionized the spread of knowledge during the Renaissance era.',
    'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1200&q=80',
    1450,
    'inventions'
  ),
  (
    'The Moon landing',
    'Humanity reached the Moon for the first time in a historic Apollo mission.',
    'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1200&q=80',
    1969,
    'history'
  ),
  (
    'The first iPhone',
    'Apple introduced the iconic smartphone that redefined mobile computing.',
    'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=1200&q=80',
    2007,
    'pop-culture'
  ),
  (
    'The first World Cup',
    'The first official international tournament for national football teams began in Uruguay.',
    'https://images.unsplash.com/photo-1543351611-58f69d7c1781?auto=format&fit=crop&w=1200&q=80',
    1930,
    'sports'
  )
ON CONFLICT (title) DO NOTHING;
