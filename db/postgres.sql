CREATE TABLE articles  (
    id VARCHAR(20) PRIMARY KEY,
    metadata JSONB NOT NULL
);

CREATE TABLE news  (
    id VARCHAR(20) PRIMARY KEY,
    metadata JSONB NOT NULL
);

CREATE TABLE users  (
    id VARCHAR(20) PRIMARY KEY,
    metadata JSONB NOT NULL
);

CREATE TABLE actions  (
    id VARCHAR(20) PRIMARY KEY,
    metadata JSONB NOT NULL
);

CREATE TABLE menu  (
    id VARCHAR(20) PRIMARY KEY,
    metadata JSONB NOT NULL
);