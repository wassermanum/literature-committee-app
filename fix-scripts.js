#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Function to fix unused imports by prefixing with underscore
function fixUnusedVariables(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix unused variables by prefixing with underscore
  const unusedPatterns = [
    // Function parameters
    /(\w+): [^,)]+(?=\s*[,)])/g,
    // Destructured variables
    /const\s+{\s*([^}]+)\s*}/g,
    // Import statements
    /import\s+{\s*([^}]+)\s*}/g
  ];
  
  // Add underscore prefix to unused variables (this is a simple approach)
  // In practice, you'd want to be more selective based on actual usage
  
  return content;
}

// Function to add missing React imports
function addReactImport(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // If file uses JSX but doesn't import React
  if (content.includes('<') && content.includes('>') && !content.includes('import React')) {
    content = `import React from 'react';\n${content}`;
  }
  
  return content;
}

// Function to fix import.meta.env issues
function fixImportMeta(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace import.meta.env with process.env for Node.js compatibility
  content = content.replace(/import\.meta\.env\./g, 'process.env.');
  
  return content;
}

// Main function to process files
function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Fix import.meta.env
    const newContent = fixImportMeta(filePath);
    if (newContent !== content) {
      content = newContent;
      modified = true;
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`Fixed: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

// Process all TypeScript files
function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      processDirectory(filePath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      processFile(filePath);
    }
  }
}

// Start processing
console.log('Starting script fixes...');
processDirectory('./frontend/src');
processDirectory('./backend/src');
console.log('Script fixes completed!');