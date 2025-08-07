import React, { useEffect, useState } from 'react';
import { codeToHtml } from 'shiki';

interface CodeBlockProps {
  code: string;
  language: string;
}

export function CodeBlock({ code, language }: CodeBlockProps) {
  const [htmlCode, setHtmlCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const highlightCode = async () => {
      try {
        const html = await codeToHtml(code.trim(), {
          lang: language,
          theme: 'github-dark',
        });
        setHtmlCode(html);
      } catch (error) {
        console.warn('Failed to highlight code:', error);
        // Fallback to plain text
        setHtmlCode(`<pre><code>${code}</code></pre>`);
      } finally {
        setIsLoading(false);
      }
    };

    highlightCode();
  }, [code, language]);

  if (isLoading) {
    return (
      <div className="code-block-loading">
        <pre className="code-block">{code}</pre>
      </div>
    );
  }

  return (
    <div
      className="code-block-container"
      dangerouslySetInnerHTML={{ __html: htmlCode }}
    />
  );
}
