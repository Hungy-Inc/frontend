// Helper function to convert HTML to plain text
export function htmlToPlainText(html: string): string {
  if (!html) return '';
  
  // Create a temporary div element
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  // Get the text content and clean it up
  let text = tempDiv.textContent || tempDiv.innerText || '';
  
  // Clean up extra whitespace
  text = text.replace(/\s+/g, ' ').trim();
  
  return text;
}

// Helper function to strip HTML tags for plain text
export function stripHtmlTags(html: string): string {
  if (!html) return '';
  
  // First, convert styled variable tags back to {{variable}} format
  let result = html.replace(
    /<span[^>]*class="email-variable-tag"[^>]*data-variable="([^"]+)"[^>]*>.*?<\/span>/g,
    (match, variable) => variable
  );
  
  // Remove HTML tags but preserve line breaks
  return result
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]*>/g, '')
    .replace(/\n\s*\n/g, '\n\n')
    .trim();
}
