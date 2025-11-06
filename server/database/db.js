const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data');

// Ensure database directory exists
if (!fs.existsSync(DB_PATH)) {
    fs.mkdirSync(DB_PATH, { recursive: true });
}

const db = {
    // Read data from file
    read(collection) {
        try {
            const filePath = path.join(DB_PATH, `${collection}.json`);
            if (!fs.existsSync(filePath)) {
                return [];
            }
            const data = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error(`Error reading ${collection}:`, error);
            return [];
        }
    },

    // Write data to file
    write(collection, data) {
        try {
            const filePath = path.join(DB_PATH, `${collection}.json`);
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
            return true;
        } catch (error) {
            console.error(`Error writing ${collection}:`, error);
            return false;
        }
    },

    // Add item to collection
    add(collection, item) {
        const data = this.read(collection);
        data.push(item);
        return this.write(collection, data);
    },

    // Update item in collection
    update(collection, id, updates) {
        const data = this.read(collection);
        const index = data.findIndex(item => item.id === id);
        if (index !== -1) {
            data[index] = { ...data[index], ...updates };
            return this.write(collection, data);
        }
        return false;
    },

    // Delete item from collection
    delete(collection, id) {
        const data = this.read(collection);
        const filteredData = data.filter(item => item.id !== id);
        return this.write(collection, filteredData);
    }
};

module.exports = db;
