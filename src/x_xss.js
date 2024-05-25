function makeSafe(text) {
    let newString = text
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")

    return newString;
}