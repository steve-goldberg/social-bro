#!/usr/bin/env node

/**
 * Parses a markdown file by headings and prepends a compact table of contents.
 * Each TOC entry shows the line number so an LLM can jump directly to a section.
 *
 * Strategy for compact TOC:
 * - h1: always indexed with line number
 * - h2: listed inline under their parent h1 (name only, no line number)
 *        grouped on a single line for compactness
 * - h3+: collapsed as count
 *
 * Usage: node build-doc-index.js <input.md> [output.md]
 * Idempotent — strips any existing TOC before regenerating.
 */

import { readFileSync, writeFileSync } from 'fs';

const inputPath = process.argv[2];
const outputPath = process.argv[3] || inputPath;

if (!inputPath) {
	console.error('Usage: node build-doc-index.js <input.md> [output.md]');
	process.exit(1);
}

const content = readFileSync(inputPath, 'utf-8');
const lines = content.split('\n');

// Strip existing TOC if re-running
const tocMarkerStart = '<!-- TOC:START -->';
const tocMarkerEnd = '<!-- TOC:END -->';
let contentLines = lines;
const existingStart = lines.findIndex((l) => l.trim() === tocMarkerStart);
const existingEnd = lines.findIndex((l) => l.trim() === tocMarkerEnd);
if (existingStart !== -1 && existingEnd !== -1) {
	contentLines = [...lines.slice(0, existingStart), ...lines.slice(existingEnd + 1)];
	while (contentLines.length > 0 && contentLines[0].trim() === '') {
		contentLines.shift();
	}
}

// Parse ALL headings
const allHeadings = [];
let inCodeBlock = false;
for (let i = 0; i < contentLines.length; i++) {
	const line = contentLines[i];
	if (line.startsWith('```')) {
		inCodeBlock = !inCodeBlock;
		continue;
	}
	if (inCodeBlock) continue;

	const match = line.match(/^(#{1,6})\s+(.+)$/);
	if (match) {
		allHeadings.push({
			level: match[1].length,
			text: match[2].trim(),
			contentLineIndex: i
		});
	}
}

// Group headings into h1 sections
const sections = []; // {h1, h2s: [{text, contentLineIndex}], subCount}
let current = null;

for (const h of allHeadings) {
	if (h.level === 1) {
		if (current) sections.push(current);
		current = { h1: h, h2s: [], subCount: 0 };
	} else if (h.level === 2) {
		if (current) current.h2s.push(h);
		else sections.push({ h1: null, h2s: [h], subCount: 0 });
	} else {
		if (current) current.subCount++;
	}
}
if (current) sections.push(current);

// Build TOC lines (without final line numbers yet — need to know TOC size first)
// We'll do two passes: first build structure, then calculate size and line numbers.

// Pass 1: build raw TOC structure
const rawToc = [];
for (const sec of sections) {
	if (sec.h1) {
		rawToc.push({ type: 'h1', heading: sec.h1 });
	}
	if (sec.h2s.length > 0) {
		// Group h2s into lines of ~100 chars each for readability
		const h2Names = sec.h2s.map((h) => h.text);
		const chunked = [];
		let currentLine = [];
		let currentLen = 0;
		for (const name of h2Names) {
			if (currentLen + name.length + 4 > 100 && currentLine.length > 0) {
				chunked.push(currentLine);
				currentLine = [];
				currentLen = 0;
			}
			currentLine.push(name);
			currentLen += name.length + 4; // " | " separator
		}
		if (currentLine.length > 0) chunked.push(currentLine);

		for (const chunk of chunked) {
			rawToc.push({ type: 'h2list', text: '    ' + chunk.join(' · ') });
		}
	}
	if (sec.subCount > 0) {
		rawToc.push({ type: 'sub', count: sec.subCount });
	}
}

// Pass 2: calculate TOC size and final line numbers
const tocHeader = [
	tocMarkerStart,
	'# Document Index — Svelte & SvelteKit Reference',
	'',
	'> LLM INSTRUCTIONS:',
	'> 1. Read this index to find the section you need',
	'> 2. Use Read(file, offset=LINE_NUMBER, limit=100) to jump to that section',
	'> 3. For specific h2/h3 topics, use Grep(pattern="## topic", path=file)',
	''
];
const tocFooter = ['', tocMarkerEnd, ''];
const tocSize = tocHeader.length + rawToc.length + tocFooter.length;

const finalTocLines = [...tocHeader];
for (const item of rawToc) {
	if (item.type === 'h1') {
		const finalLine = tocSize + item.heading.contentLineIndex + 1;
		const padded = String(finalLine).padStart(5, ' ');
		finalTocLines.push(`L${padded} | # ${item.heading.text}`);
	} else if (item.type === 'h2list') {
		finalTocLines.push(item.text);
	} else if (item.type === 'sub') {
		finalTocLines.push(`        (+${item.count} sub-sections)`);
	}
}
finalTocLines.push(...tocFooter);

const output = [...finalTocLines, ...contentLines].join('\n');
writeFileSync(outputPath, output, 'utf-8');

const h1Count = sections.filter((s) => s.h1).length;
const h2Count = allHeadings.filter((h) => h.level === 2).length;
console.log(`Done. ${h1Count} sections (h1), ${h2Count} topics (h2) listed inline.`);
console.log(`TOC: ${finalTocLines.length} lines. Total file: ${finalTocLines.length + contentLines.length} lines.`);
console.log(`Written to: ${outputPath}`);
