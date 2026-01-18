// [Server] Sistem de autentificare - Gestionare login/register
// Primește request-uri de la client și gestionează autentificarea
// Environment: Node.js (CommonJS - require/module.exports)

const db = require('../../db');

// Verifică dacă bcryptjs este disponibil (opțional)
let bcrypt = null;
try {
  bcrypt = require('bcryptjs');
  console.log('[Server] [Auth] bcryptjs module loaded - passwords will be hashed');
} catch (error) {
  console.log('[Server] [Auth] bcryptjs not available - using plain text passwords (NOT RECOMMENDED FOR PRODUCTION)');
  console.log('[Server] [Auth] To enable password hashing, run: npm install bcryptjs');
}

/**
 * Event handler pentru server:auth:request
 * Primește request-uri de autentificare de la client
 * Gestionează atât login cât și register
 * 
 * Wiki: Events::add - ascultă event-uri de la client prin callRemote
 * În RAGE:MP, primul parametru este automat player-ul care a trimis event-ul
 */
mp.events.add('server:auth:request', (player, type, username, password, email) => {
  console.log('[Server] [Auth] Received auth request from:', player.name, { type, username, email: email ? 'provided' : 'none' });
  
  // Verificare validare de bază
  if (!username || typeof username !== 'string' || username.trim().length < 3) {
    console.log('[Server] [Auth] Invalid username:', username);
    sendAuthResponse(player, false, 'Username invalid (minim 3 caractere)');
    return;
  }
  
  if (!password || typeof password !== 'string' || password.length < 4) {
    console.log('[Server] [Auth] Invalid password length');
    sendAuthResponse(player, false, 'Parolă invalidă (minim 4 caractere)');
    return;
  }
  
  const sanitizedUsername = username.trim();
  
  if (type === 'register') {
    // LOGICĂ DE ÎNREGISTRARE
    console.log('[Server] [Auth] Processing registration for:', sanitizedUsername);
    
    // Validare email
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      console.log('[Server] [Auth] Invalid email for registration');
      sendAuthResponse(player, false, 'Email invalid');
      return;
    }
    
    // Verifică dacă contul există deja
    const existingAccount = db.loadAccount(sanitizedUsername);
    if (existingAccount) {
      console.log('[Server] [Auth] Account already exists:', sanitizedUsername);
      sendAuthResponse(player, false, 'Contul există deja');
      return;
    }
    
    // Hash parola dacă bcrypt este disponibil
    let passwordHash = password; // Default: text simplu
    if (bcrypt) {
      try {
        const salt = bcrypt.genSaltSync(10);
        passwordHash = bcrypt.hashSync(password, salt);
        console.log('[Server] [Auth] Password hashed successfully');
      } catch (error) {
        console.error('[Server] [Auth] Error hashing password:', error);
        sendAuthResponse(player, false, 'Eroare la procesarea parolei');
        return;
      }
    }
    
    // Salvează contul
    const accountData = {
      password: passwordHash,
      email: email.trim(),
      isHashed: !!bcrypt, // Flag pentru a ști dacă parola este hash-uită
    };
    
    const saved = db.saveAccount(sanitizedUsername, accountData);
    
    if (saved) {
      console.log('[Server] [Auth] Account registered successfully:', sanitizedUsername);
      
      // Salvează datele jucătorului (opțional - pentru sesiune)
      if (player) {
        player.data = player.data || {};
        player.data.username = sanitizedUsername;
        player.data.email = email.trim();
        player.data.isAuthenticated = true;
        console.log('[Server] [Auth] Player data saved:', sanitizedUsername);
      }
      
      // Trimite răspuns de succes
      sendAuthResponse(player, true, 'Cont creat cu succes');
      
      // Dezactivează freeze-ul jucătorului după înregistrare
      if (player) {
        try {
          // Wiki: Player::call - trimite event către client pentru a dezactiva freeze
          player.call('freeze', [false]);
          console.log('[Server] [Auth] Player unfrozen after registration');
        } catch (e) {
          console.log('[Server] [Auth] Error unfreezing player:', e.message);
        }
        
        // Spawnează jucătorul (opțional - poți adăuga logica de spawn aici)
        // Exemplu: spawn la o poziție default
        // player.spawn(new mp.Vector3(0, 0, 72)); // Ajustează coordonatele
        console.log('[Server] [Auth] Player registered and ready to play');
      }
    } else {
      console.log('[Server] [Auth] Failed to save account (may already exist)');
      sendAuthResponse(player, false, 'Eroare la crearea contului');
    }
    
  } else if (type === 'login') {
    // LOGICĂ DE LOGIN
    console.log('[Server] [Auth] Processing login for:', sanitizedUsername);
    
    // Încarcă contul
    const account = db.loadAccount(sanitizedUsername);
    
    if (!account) {
      console.log('[Server] [Auth] Account not found:', sanitizedUsername);
      sendAuthResponse(player, false, 'Cont inexistent');
      return;
    }
    
    // Verifică parola
    let passwordMatch = false;
    
    if (account.isHashed && bcrypt) {
      // Parola este hash-uită, folosește bcrypt.compare
      try {
        passwordMatch = bcrypt.compareSync(password, account.password);
        console.log('[Server] [Auth] Password comparison (hashed):', passwordMatch);
      } catch (error) {
        console.error('[Server] [Auth] Error comparing hashed password:', error);
        sendAuthResponse(player, false, 'Eroare la verificarea parolei');
        return;
      }
    } else {
      // Parola este text simplu, compară direct
      passwordMatch = (account.password === password);
      console.log('[Server] [Auth] Password comparison (plain text):', passwordMatch);
    }
    
    if (!passwordMatch) {
      console.log('[Server] [Auth] Invalid password for:', sanitizedUsername);
      sendAuthResponse(player, false, 'Parolă greșită');
      return;
    }
    
    // Autentificare reușită
    console.log('[Server] [Auth] Login successful for:', sanitizedUsername);
    
    // Salvează datele jucătorului
    if (player) {
      player.data = player.data || {};
      player.data.username = sanitizedUsername;
      player.data.email = account.email;
      player.data.isAuthenticated = true;
      console.log('[Server] [Auth] Player data saved:', sanitizedUsername);
    }
    
    // Actualizează lastLogin
    db.updateAccount(sanitizedUsername, {
      lastLogin: new Date().toISOString(),
    });
    
    // Trimite răspuns de succes
    sendAuthResponse(player, true, 'Autentificare reușită');
    
    // Dezactivează freeze-ul jucătorului după autentificare
    if (player) {
      try {
        // Wiki: Player::call - trimite event către client pentru a dezactiva freeze
        player.call('freeze', [false]);
        console.log('[Server] [Auth] Player unfrozen after authentication');
      } catch (e) {
        console.log('[Server] [Auth] Error unfreezing player:', e.message);
      }
      
      // Spawnează jucătorul (opțional - poți adăuga logica de spawn aici)
      // Exemplu: spawn la o poziție default
      // player.spawn(new mp.Vector3(0, 0, 72)); // Ajustează coordonatele
      console.log('[Server] [Auth] Player authenticated and ready to play');
    }
    
  } else {
    console.log('[Server] [Auth] Invalid auth type:', type);
    sendAuthResponse(player, false, 'Tip autentificare invalid');
  }
});

/**
 * Helper funcție pentru trimiterea răspunsului de autentificare către client
 * @param {PlayerMp} player - Jucătorul către care se trimite răspunsul
 * @param {boolean} success - true dacă autentificarea a reușit, false altfel
 * @param {string} message - Mesajul de răspuns
 */
function sendAuthResponse(player, success, message) {
  console.log('[Server] [Auth] Sending auth response:', { success, message });
  
  if (!player) {
    console.log('[Server] [Auth] No player provided, cannot send response');
    return;
  }
  
  // Wiki: Player::call - trimite event către client
  player.call('auth:response', [success, message]);
}

console.log('[Server] [Auth] Module loaded successfully');
