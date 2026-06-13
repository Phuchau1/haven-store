import fs from 'fs';
import path from 'path';

const DATA_DIR = fs.existsSync(path.join(process.cwd(), 'data'))
    ? path.join(process.cwd(), 'data')
    : path.join(process.cwd(), 'src', 'data');

export function readData<T>(fileName: string): T {
    const filePath = path.join(DATA_DIR, fileName);
    if (!fs.existsSync(filePath)) {
        return [] as unknown as T;
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as T;
}

export function writeData<T>(fileName: string, data: T): void {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const filePath = path.join(DATA_DIR, fileName);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}
