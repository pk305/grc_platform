'use client';

import { useState } from 'react';
import { Button, Flex, Text } from '@radix-ui/themes';

/**
 * The one-time MFA recovery codes, shown immediately after they are issued.
 * They are hashed server-side and can never be retrieved again (A.8.5), so
 * this is the only opportunity to copy them.
 */
export function RecoveryCodesGrid({ codes }: { codes: string[] }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(codes.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be blocked — the codes stay readable on screen.
      setCopied(false);
    }
  }

  return (
    <div>
      <div className="bg-100 rounded p-3 mb-2">
        <div className="row row-cols-2 g-2">
          {codes.map(code => (
            <div key={code} className="col">
              <Text
                size="2"
                style={{ fontFamily: 'var(--code-font-family, monospace)' }}
              >
                {code}
              </Text>
            </div>
          ))}
        </div>
      </div>
      <Flex align="center" gap="2">
        <Button
          type="button"
          size="1"
          variant="soft"
          color="gray"
          onClick={handleCopy}
        >
          <span className="far fa-copy" aria-hidden="true" />
          Copy codes
        </Button>
        <Text size="1" color="gray" aria-live="polite">
          {copied ? 'Copied to clipboard' : `${codes.length} single-use codes`}
        </Text>
      </Flex>
    </div>
  );
}
