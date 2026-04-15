const fs = require('fs');
const path = require('path');

const directoryPath = 'd:\\Project\\UsafiLink\\frontend\\src';

function replaceInFile(filePath) {
    if (!filePath.endsWith('.jsx') && !filePath.endsWith('.js') && !filePath.endsWith('.css')) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Perform replacements
    let newContent = content
        .replace(/bg-blue-/g, 'bg-emerald-')
        .replace(/text-blue-/g, 'text-emerald-')
        .replace(/border-blue-/g, 'border-emerald-')
        .replace(/shadow-blue-/g, 'shadow-emerald-')
        .replace(/ring-blue-/g, 'ring-emerald-')
        .replace(/from-blue-/g, 'from-emerald-')
        .replace(/via-blue-/g, 'via-emerald-')
        .replace(/to-blue-/g, 'to-emerald-')
        .replace(/hover:bg-blue-/g, 'hover:bg-emerald-')
        .replace(/hover:text-blue-/g, 'hover:text-emerald-')
        .replace(/hover:border-blue-/g, 'hover:border-emerald-')
        .replace(/focus:ring-blue-/g, 'focus:ring-emerald-')
        .replace(/focus:border-blue-/g, 'focus:border-emerald-')
        .replace(/text-indigo-/g, 'text-teal-')
        .replace(/bg-indigo-/g, 'bg-teal-')
        .replace(/from-indigo-/g, 'from-teal-')
        .replace(/to-indigo-/g, 'to-teal-');

    if (content !== newContent) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log('Updated:', filePath);
    }
}

function traverseDirectory(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            traverseDirectory(fullPath);
        } else {
            replaceInFile(fullPath);
        }
    }
}

traverseDirectory(directoryPath);
console.log('Done replacing colors globally.');
