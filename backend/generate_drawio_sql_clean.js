const fs = require('fs');

const content = fs.readFileSync('erd_full.dbml', 'utf-8');
const lines = content.split('\n');

let sql = '';
let currentTable = null;
let relationships = [];
let tables = {};

for (const line of lines) {
  const tableMatch = line.match(/^Table\s+(\w+)\s+\{/);
  if (tableMatch) {
    currentTable = tableMatch[1];
    tables[currentTable] = [];
    continue;
  }
  
  if (line.trim() === '}') {
    currentTable = null;
    continue;
  }
  
  if (currentTable) {
    let propMatch = line.match(/^\s*(\w+)\s+(.*)$/);
    if (propMatch) {
      let name = propMatch[1];
      let typeStr = propMatch[2];
      let type = typeStr.replace(/\[.*\]/g, '').trim().replace(/[^a-zA-Z0-9_]/g, '_');
      if (type.length === 0) type = 'VARCHAR';
      if (type.toLowerCase() === 'objectid') type = 'VARCHAR';
      if (type.toLowerCase() === 'number') type = 'INT';
      
      let isPk = typeStr.includes('[primary key]') ? ' PRIMARY KEY' : '';
      tables[currentTable].push(`  ${name} ${type.toUpperCase()}${isPk}`);
    }
  }
}

for (let t in tables) {
  sql += `CREATE TABLE ${t} (\n`;
  sql += tables[t].join(',\n');
  sql += `\n);\n\n`;
}

fs.writeFileSync('drawio_sql_optimized.txt', sql);
