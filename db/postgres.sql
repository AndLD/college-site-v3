CREATE TABLE articles  (
    id VARCHAR(30) PRIMARY KEY,
    metadata JSON NOT NULL
);

CREATE TABLE news  (
    id VARCHAR(30) PRIMARY KEY,
    metadata JSON NOT NULL
);

CREATE TABLE users  (
    id VARCHAR(30) PRIMARY KEY,
    metadata JSON NOT NULL
);

CREATE TABLE actions  (
    id VARCHAR(30) PRIMARY KEY,
    metadata JSON NOT NULL
);

CREATE TABLE menu  (
    id VARCHAR(30) PRIMARY KEY,
    metadata JSON NOT NULL
);