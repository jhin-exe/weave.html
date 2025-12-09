/**
 * Parser.js
 * Handles text formatting (Markdown-lite) and variable interpolation.
 * Pure logic, no DOM dependencies.
 */
export const Parser = {
    /**
     * Parses raw text into HTML.
     * @param {string} text - The raw text from the scene.
     * @returns {string} HTML string.
     */
    parse(text) {
        if (!text) return '';

        return text
            // Bold (**text**)
            .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
            // Italic (*text*)
            .replace(/\*(.*?)\*/g, '<i>$1</i>')
            // Underline (__text__)
            .replace(/__(.*?)__/g, '<u>$1</u>')
            // Blockquotes (> text)
            .replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>')
            // Horizontal Rule (---)
            .replace(/---/g, '<hr>')
            // Line breaks
            .replace(/\n/g, '<br>');
    },

    /**
     * Injects variable values into text.
     * Replaces ${varName} with the actual value from state.
     * @param {string} text - Text containing variables.
     * @param {Object} variables - The current state variables.
     * @returns {string} Interpolated text.
     */
    interpolate(text, variables) {
        if (!text) return '';
        
        return text.replace(/\$\{(.*?)\}/g, (match, varName) => {
            return variables.hasOwnProperty(varName) ? variables[varName] : match;
        });
    }
};