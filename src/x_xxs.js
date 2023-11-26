function makeSafe(text) {
    let newString = text.replace(/</g, "&lt;");
    return newString.replace(/>/g, "&gt;");
}