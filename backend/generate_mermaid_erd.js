const fs = require('fs');

const content = fs.readFileSync('erd_full.dbml', 'utf-8');
const lines = content.split('\n');

let mermaid = 'erDiagram\n';
let currentTable = null;
let relationships = [];

for (const line of lines) {
  const tableMatch = line.match(/^Table\s+(\w+)\s+\{/);
  if (tableMatch) {
    currentTable = tableMatch[1];
    mermaid += `    ${currentTable} {\n`;
    continue;
  }
  
  if (line.trim() === '}') {
    mermaid += `    }\n`;
    currentTable = null;
    continue;
  }
  
  if (currentTable) {
    let propMatch = line.match(/^\s*(\w+)\s+(.*)$/);
    if (propMatch) {
      let name = propMatch[1];
      let type = propMatch[2].replace(/\[.*\]/g, '').trim().replace(/[^a-zA-Z0-9_]/g, '_');
      if (type.length === 0) type = 'string';
      mermaid += `        ${type} ${name}\n`;
    }
  }
  
  const refMatch = line.match(/^Ref:\s*(\w+)\.(\w+)\s*>\s*(\w+)\.(\w+)/);
  if (refMatch) {
    let t1 = refMatch[1];
    let f1 = refMatch[2];
    let t2 = refMatch[3];
    let f2 = refMatch[4];
    
    // Convert DBML relations to proper Mermaid ERD syntax
    // |o--o{ Zero or one to zero or many
    // ||--o{ Exactly one to zero or many
    // }|..|{ Many to many (approximate)
    // For simplicity, we use exactly one to zero or many (||--o{) for standard FKs
    relationships.push(`    ${t2} ||--o{ ${t1} : "has ${t1}"`);
  }
}

mermaid += '\n' + relationships.join('\n') + '\n';
fs.writeFileSync('erd_mermaid_fixed.txt', mermaid);
