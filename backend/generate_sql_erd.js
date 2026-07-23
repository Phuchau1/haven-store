const fs = require('fs');

const content = fs.readFileSync('erd_full.dbml', 'utf-8');
const lines = content.split('\n');

let sql = '';
let currentTable = null;
let relationships = [];
let firstCol = true;

for (const line of lines) {
  const tableMatch = line.match(/^Table\s+(\w+)\s+\{/);
  if (tableMatch) {
    currentTable = tableMatch[1];
    sql += `CREATE TABLE ${currentTable} (\n`;
    firstCol = true;
    continue;
  }
  
  if (line.trim() === '}') {
    sql += `\n);\n\n`;
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
      
      if (!firstCol) {
        sql += ',\n';
      }
      sql += `  ${name} ${type.toUpperCase()}${isPk}`;
      firstCol = false;
    }
  }
  
  const refMatch = line.match(/^Ref:\s*(\w+)\.(\w+)\s*>\s*(\w+)\.(\w+)/);
  if (refMatch) {
    let childTable = refMatch[1];
    let childCol = refMatch[2];
    let parentTable = refMatch[3];
    let parentCol = refMatch[4];
    relationships.push(`ALTER TABLE ${childTable} ADD FOREIGN KEY (${childCol}) REFERENCES ${parentTable}(${parentCol});`);
  }
}

sql += '\n' + relationships.join('\n') + '\n';
fs.writeFileSync('erd_schema.sql', sql);
