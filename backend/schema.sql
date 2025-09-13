-- Grocify Database Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Items table
CREATE TABLE IF NOT EXISTS items (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    quantity VARCHAR(100),
    type VARCHAR(100),
    purchase_date DATE,
    shelf_life INTEGER, -- in days
    expiry_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Archived items table (for items that have been used/consumed)
CREATE TABLE IF NOT EXISTS archived_items (
    id SERIAL PRIMARY KEY,
    original_id INTEGER,
    user_id INTEGER,
    name VARCHAR(255) NOT NULL,
    quantity VARCHAR(100),
    type VARCHAR(100),
    purchase_date DATE,
    shelf_life INTEGER,
    expiry_date DATE,
    archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_items_updated_at 
    BEFORE UPDATE ON items 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Function to archive items when deleted
CREATE OR REPLACE FUNCTION archive_deleted_item()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO archived_items (
        original_id, user_id, name, quantity, type, 
        purchase_date, shelf_life, expiry_date
    ) VALUES (
        OLD.id, OLD.user_id, OLD.name, OLD.quantity, OLD.type,
        OLD.purchase_date, OLD.shelf_life, OLD.expiry_date
    );
    RETURN OLD;
END;
$$ language 'plpgsql';

-- Trigger to archive items before deletion
CREATE TRIGGER archive_item_on_delete
    BEFORE DELETE ON items
    FOR EACH ROW
    EXECUTE FUNCTION archive_deleted_item();

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_items_user_id ON items(user_id);
CREATE INDEX IF NOT EXISTS idx_items_expiry_date ON items(expiry_date);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
