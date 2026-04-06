/**
 * localStorage compatibility layer for admin app.
 * Mirrors the user app's transparent XOR encryption so both apps
 * can read/write the same londway_* keys without conflict.
 */

const _xK = '\x4c\x43\x2d\x56\x61\x75\x6c\x74\x2d\x4b\x65\x79\x2d\x32\x30\x32\x36\x2d\x53\x74\x65\x61\x6c\x74\x68';

function _xorEncode(data: string): string {
  let out = '';
  for (let i = 0; i < data.length; i++) {
    out += String.fromCharCode(data.charCodeAt(i) ^ _xK.charCodeAt(i % _xK.length));
  }
  return btoa(unescape(encodeURIComponent(out)));
}

function _xorDecode(encoded: string): string {
  try {
    const decoded = decodeURIComponent(escape(atob(encoded)));
    let out = '';
    for (let i = 0; i < decoded.length; i++) {
      out += String.fromCharCode(decoded.charCodeAt(i) ^ _xK.charCodeAt(i % _xK.length));
    }
    return out;
  } catch {
    return encoded;
  }
}

function _isPlainJSON(raw: string): boolean {
  if (!raw) return false;
  const c = raw[0];
  return c === '[' || c === '{' || c === '"' || c === 't' || c === 'f' || c === 'n' || (c >= '0' && c <= '9');
}

function _shouldObfuscate(key: string): boolean {
  return key.startsWith('londway_') || key.startsWith('__londway_');
}

let _patched = false;

export function patchLocalStorage() {
  if (typeof window === 'undefined' || _patched) return;
  _patched = true;

  const _origSetItem = Storage.prototype.setItem;
  const _origGetItem = Storage.prototype.getItem;

  Storage.prototype.setItem = function(key: string, value: string) {
    if (_shouldObfuscate(key) && _isPlainJSON(value)) {
      return _origSetItem.call(this, key, _xorEncode(value));
    }
    return _origSetItem.call(this, key, value);
  };

  Storage.prototype.getItem = function(key: string): string | null {
    const raw = _origGetItem.call(this, key);
    if (raw === null) return null;
    if (_shouldObfuscate(key) && !_isPlainJSON(raw)) {
      try {
        const decoded = _xorDecode(raw);
        JSON.parse(decoded);
        return decoded;
      } catch {
        return raw;
      }
    }
    return raw;
  };

  // Auto-upgrade existing plain-text londway_* keys
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && _shouldObfuscate(key)) {
        const raw = _origGetItem.call(localStorage, key);
        if (raw && _isPlainJSON(raw)) {
          _origSetItem.call(localStorage, key, _xorEncode(raw));
        }
      }
    }
  } catch {}
}
