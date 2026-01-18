// [Server] Database helper pentru gestionarea conturilor în fișiere JSON
// Folosește modulul nativ fs și path pentru operații pe fișiere
// Environment: Node.js (CommonJS - require/module.exports)

const fs = require('fs');
const path = require('path');

// Calea către folderul de date
const DATA_DIR = path.join(__dirname, 'data');
const ACCOUNTS_DIR = path.join(DATA_DIR, 'accounts');

/**
 * Inițializează folderul de date dacă nu există
 * Creează structura de directoare necesară
 */
function initializeDirectories() {
  console.log('[Server] [DB] Initializing data directories...');
  
  try {
    // Creează folderul data dacă nu există
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      console.log('[Server] [DB] Created data directory:', DATA_DIR);
    }
    
    // Creează folderul accounts dacă nu există
    if (!fs.existsSync(ACCOUNTS_DIR)) {
      fs.mkdirSync(ACCOUNTS_DIR, { recursive: true });
      console.log('[Server] [DB] Created accounts directory:', ACCOUNTS_DIR);
    }
    
    console.log('[Server] [DB] Data directories initialized successfully');
  } catch (error) {
    console.error('[Server] [DB] Error initializing directories:', error);
    throw error;
  }
}

/**
 * Salvează un cont în fișier JSON
 * @param {string} username - Numele de utilizator (folosit ca nume de fișier)
 * @param {object} data - Datele contului (password, email, etc.)
 * @returns {boolean} - true dacă salvarea a reușit, false altfel
 */
function saveAccount(username, data) {
  console.log('[Server] [DB] saveAccount called for username:', username);
  
  try {
    // Asigură-te că directoarele există
    initializeDirectories();
    
    // Validare username (pentru siguranță)
    if (!username || typeof username !== 'string') {
      console.log('[Server] [DB] Invalid username:', username);
      return false;
    }
    
    // Sanitizează username-ul pentru a evita path traversal
    const sanitizedUsername = username.replace(/[^a-zA-Z0-9_]/g, '_');
    if (sanitizedUsername !== username) {
      console.log('[Server] [DB] Username sanitized:', username, '->', sanitizedUsername);
    }
    
    // Calea către fișierul JSON
    const filePath = path.join(ACCOUNTS_DIR, `${sanitizedUsername}.json`);
    
    // Verifică dacă fișierul există deja
    if (fs.existsSync(filePath)) {
      console.log('[Server] [DB] Account file already exists:', filePath);
      return false; // Contul există deja
    }
    
    // Adaugă metadata
    const accountData = {
      username: sanitizedUsername,
      ...data,
      createdAt: new Date().toISOString(),
      lastLogin: null,
    };
    
    // Salvează fișierul JSON
    fs.writeFileSync(filePath, JSON.stringify(accountData, null, 2), 'utf8');
    console.log('[Server] [DB] Account saved successfully:', filePath);
    
    return true;
  } catch (error) {
    console.error('[Server] [DB] Error saving account:', error);
    return false;
  }
}

/**
 * Încarcă un cont din fișier JSON
 * @param {string} username - Numele de utilizator
 * @returns {object|null} - Datele contului sau null dacă nu există
 */
function loadAccount(username) {
  console.log('[Server] [DB] loadAccount called for username:', username);
  
  try {
    // Sanitizează username-ul
    const sanitizedUsername = username.replace(/[^a-zA-Z0-9_]/g, '_');
    
    // Calea către fișierul JSON
    const filePath = path.join(ACCOUNTS_DIR, `${sanitizedUsername}.json`);
    
    // Verifică dacă fișierul există
    if (!fs.existsSync(filePath)) {
      console.log('[Server] [DB] Account file not found:', filePath);
      return null;
    }
    
    // Citește și parsează fișierul JSON
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const accountData = JSON.parse(fileContent);
    
    console.log('[Server] [DB] Account loaded successfully:', sanitizedUsername);
    return accountData;
  } catch (error) {
    console.error('[Server] [DB] Error loading account:', error);
    return null;
  }
}

/**
 * Actualizează un cont existent
 * @param {string} username - Numele de utilizator
 * @param {object} updates - Câmpurile de actualizat
 * @returns {boolean} - true dacă actualizarea a reușit, false altfel
 */
function updateAccount(username, updates) {
  console.log('[Server] [DB] updateAccount called for username:', username);
  
  try {
    // Sanitizează username-ul
    const sanitizedUsername = username.replace(/[^a-zA-Z0-9_]/g, '_');
    
    // Calea către fișierul JSON
    const filePath = path.join(ACCOUNTS_DIR, `${sanitizedUsername}.json`);
    
    // Verifică dacă fișierul există
    if (!fs.existsSync(filePath)) {
      console.log('[Server] [DB] Account file not found for update:', filePath);
      return false;
    }
    
    // Încarcă datele existente
    const existingData = loadAccount(sanitizedUsername);
    if (!existingData) {
      return false;
    }
    
    // Actualizează datele
    const updatedData = {
      ...existingData,
      ...updates,
    };
    
    // Salvează fișierul actualizat
    fs.writeFileSync(filePath, JSON.stringify(updatedData, null, 2), 'utf8');
    console.log('[Server] [DB] Account updated successfully:', filePath);
    
    return true;
  } catch (error) {
    console.error('[Server] [DB] Error updating account:', error);
    return false;
  }
}

// Inițializează directoarele la încărcarea modulului
initializeDirectories();

// Exportă funcțiile
module.exports = {
  saveAccount,
  loadAccount,
  updateAccount,
  initializeDirectories,
};
