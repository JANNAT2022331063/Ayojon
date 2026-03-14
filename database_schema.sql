-- Complete Database Schema for Ayojon Event Management System

-- Create database
CREATE DATABASE IF NOT EXISTS ayojon_db;
USE ayojon_db;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT,
    password VARCHAR(255) NOT NULL,
    profile_pic LONGTEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admins table
CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    password VARCHAR(255) NOT NULL,
    secret_entry_code VARCHAR(255),
    profile_pic LONGTEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Organizers table (with multiple payment methods)
CREATE TABLE IF NOT EXISTS organizers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    password VARCHAR(255) NOT NULL,
    org_name VARCHAR(255),
    org_type VARCHAR(100),
    org_email VARCHAR(255),
    official_address TEXT,
    website VARCHAR(255),
    social_link VARCHAR(255),
    alt_contact VARCHAR(20),
    license_number VARCHAR(100),
    tax_number VARCHAR(100),
    preferred_categories TEXT,
    org_logo LONGTEXT,
    profile_pic LONGTEXT,
    
    -- Multiple payment method support
    bkash_number VARCHAR(20),
    nagad_number VARCHAR(20),
    upay_number VARCHAR(20),
    rocket_number VARCHAR(20),
    
    -- Legacy fields (for backward compatibility)
    payment_method VARCHAR(50),
    payment_number VARCHAR(20),
    
    is_approved TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    organizer_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(255) NOT NULL,
    event_date DATE NOT NULL,
    start_time TIME NOT NULL,
    reg_deadline DATE NOT NULL,
    ticket_price DECIMAL(10,2) NOT NULL,
    service_charge DECIMAL(10,2) DEFAULT 0,
    total_seats INT NOT NULL,
    remaining_seats INT NOT NULL,
    payment_methods VARCHAR(255),
    contact_number VARCHAR(20),
    social_link VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organizer_id) REFERENCES organizers(id) ON DELETE CASCADE
);

-- Bookings table (updated with transaction details)
CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    event_id INT NOT NULL,
    quantity INT NOT NULL,
    total_cost DECIMAL(10,2) NOT NULL,
    payment_gateway VARCHAR(50) NOT NULL,
    
    -- NEW: Transaction verification fields
    transaction_id VARCHAR(100) NOT NULL,
    payment_phone VARCHAR(20) NOT NULL,
    payment_status VARCHAR(20) DEFAULT 'pending',
    
    booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- Add indexes for better performance
CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_event ON bookings(event_id);
CREATE INDEX idx_organizers_approved ON organizers(is_approved);
