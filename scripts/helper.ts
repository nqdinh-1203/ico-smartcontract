// First, import the necessary libraries 
import * as fs from 'fs';
import * as path from 'path';

// Create a function to read the json file 
export function readJSONFile(fileName: string): any {
    // Get the full path of the file 
    const filePath = path.join(__dirname, fileName);

    // Read the file content and parse it into JSON object 
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
}
