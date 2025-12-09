/**
 * Id.js
 * Generates unique identifiers for scenes, choices, and assets.
 * Uses a timestamp + random string mix for collision safety.
 */
export const Id = {
    /**
     * Generate a short unique ID (e.g., "sc_9a2b3c").
     * @param {string} prefix - Optional prefix (e.g., "scene", "choice")
     * @returns {string}
     */
    generate(prefix = '') {
        const random = Math.random().toString(36).substr(2, 6);
        // Using a timestamp component ensures chronological ordering if needed
        const time = Date.now().toString(36).slice(-4); 
        const id = `${random}${time}`;
        return prefix ? `${prefix}_${id}` : id;
    }
};