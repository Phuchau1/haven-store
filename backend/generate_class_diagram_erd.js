const fs = require('fs');

const content = fs.readFileSync('erd_full.dbml', 'utf-8');
const lines = content.split('\n');

let mermaid = 'classDiagram\n';
let currentTable = null;
let relationships = [];

for (const line of lines) {
  const tableMatch = line.match(/^Table\s+(\w+)\s+\{/);
  if (tableMatch) {
    currentTable = tableMatch[1];
    mermaid += `    class ${currentTable} {\n`;
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
      let typeStr = propMatch[2];
      let type = typeStr.replace(/\[.*\]/g, '').trim().replace(/[^a-zA-Z0-9_]/g, '_');
      if (type.length === 0) type = 'varchar';
      // In classDiagram, properties are written as: type name
      mermaid += `        +${type} ${name}\n`;
    }
  }
  
  const refMatch = line.match(/^Ref:\s*(\w+)\.(\w+)\s*>\s*(\w+)\.(\w+)/);
  if (refMatch) {
    let childTable = refMatch[1];
    let parentTable = refMatch[3];
    // In classDiagram: Parent "1" --> "*" Child : relationship
    relationships.push(`    ${parentTable} "1" --> "*" ${childTable} : "has"`);
  }
}

mermaid += '\n' + relationships.join('\n') + '\n';
fs.writeFileSync('class_diagram_erd.txt', mermaid);
