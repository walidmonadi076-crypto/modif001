// A simple markdown to HTML converter
export function markdownToHtml(text: string): string {
  // Escape basic HTML characters to prevent XSS from code blocks
  const escapeHtml = (unsafe: string) => {
      return unsafe
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#039;");
  }

  // Process code blocks first to prevent further markdown processing inside them
  const parts = text.split(/(```[\s\S]*?```)/g);

  const processedParts = parts.map(part => {
    if (part.startsWith('```') && part.endsWith('```')) {
      const code = part.slice(3, -3).trim();
      return `<pre class="bg-gray-800 text-white p-4 rounded-md overflow-x-auto my-2"><code class="font-mono text-sm">${escapeHtml(code)}</code></pre>`;
    }

    // Process other markdown for non-code parts, ensuring not to double-process list items
    let processedPart = part
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
    
    // Handle lists carefully
    if (processedPart.includes('- ')) {
        processedPart = processedPart.replace(/^- (.*)/gm, '<li>$1</li>')
        processedPart = `<ul>${processedPart}</ul>`.replace(/<\/ul>\s*<ul>/g, '');
    }
    
    // Finally, replace newlines with <br />, avoiding tags
    return processedPart.replace(/\n/g, '<br />');
  });

  return processedParts.join('');
}
