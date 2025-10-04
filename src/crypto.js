import CryptoJS from "crypto-js";
const KEY = process.env.ENCRYPTION_KEY || "change_me_32_chars_min";
export const encrypt = (s) => CryptoJS.AES.encrypt(s, KEY).toString();
export const decrypt = (s) => CryptoJS.AES.decrypt(s, KEY).toString(CryptoJS.enc.Utf8);
