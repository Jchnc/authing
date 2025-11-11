import * as path from 'path';
import * as fs from 'fs';
import { BadRequestException, NotFoundException } from '@nestjs/common';

// Cache templates in memory after first load
const templateCache = new Map<string, string>();

export function loadTemplate(file: string, vars?: Record<string, string>): string {
  // Validate file path to prevent directory traversal
  if (file.includes('..') || path.isAbsolute(file)) {
    throw new BadRequestException('Invalid template file path');
  }

  const filePath = path.join(__dirname, '..', '..', 'templates', file);

  // Validate allowed file extensions
  const allowedExtensions = ['.html', '.txt', '.template'];
  const ext = path.extname(filePath);
  if (!allowedExtensions.includes(ext)) {
    throw new BadRequestException('Invalid template file type');
  }

  // Check if file exists and is within allowed directory
  if (
    !fs.existsSync(filePath)
    || !filePath.startsWith(path.join(__dirname, '..', '..', 'templates'))
  ) {
    throw new NotFoundException('Template not found');
  }

  // Use cached version if available
  let content = templateCache.get(filePath);
  if (!content) {
    content = fs.readFileSync(filePath, 'utf8');
    templateCache.set(filePath, content);
  }

  // Replace template variables
  let result = content;
  for (const [key, val] of Object.entries(vars || {})) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, val);
  }

  return result;
}
