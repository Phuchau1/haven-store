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
      // Force all types to VARCHAR or INT so Draw.io SQL parser doesn't crash on ARRAY/JSON
      let type = 'VARCHAR';
      if (typeStr.toLowerCase().includes('number') || typeStr.toLowerCase().includes('int')) type = 'INT';
      
      let isPk = typeStr.includes('[primary key]') ? ' PRIMARY KEY' : '';
      tables[currentTable].push(`  ${name} ${type}${isPk}`);
    }
  }
}

for (let t in tables) {
  sql += `CREATE TABLE ${t} (\n`;
  sql += tables[t].join(',\n');
  sql += `\n);\n\n`;
}

fs.writeFileSync('drawio_sql_superclean.txt', sql);
