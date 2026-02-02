/**
 * XSS Test Payloads for CodeViewer Component
 *
 * These payloads test various XSS attack vectors to ensure
 * the CodeViewer component properly sanitizes all inputs.
 *
 * SECURITY NOTE: These are intentionally malicious payloads
 * used for testing purposes only. They should NEVER execute
 * when properly sanitized.
 */

export const XSS_TEST_PAYLOADS = [
  // Basic script injection
  {
    name: 'Basic Script Tag',
    payload: '<script>alert("XSS")</script>',
    expected: 'Script tags should be completely removed or escaped',
  },

  // Image with onerror
  {
    name: 'Image onerror Handler',
    payload: '<img src=x onerror=alert(1)>',
    expected: 'Image tags and event handlers should be removed',
  },

  // SVG with script
  {
    name: 'SVG with Embedded Script',
    payload: '<svg/onload=alert(1)>',
    expected: 'SVG tags and event handlers should be removed',
  },

  // JavaScript protocol
  {
    name: 'JavaScript Protocol in Link',
    payload: '<a href="javascript:alert(1)">click</a>',
    expected: 'JavaScript protocol should be neutralized',
  },

  // Data URI
  {
    name: 'Data URI with Script',
    payload: '<a href="data:text/html,<script>alert(1)</script>">click</a>',
    expected: 'Data URIs with scripts should be blocked',
  },

  // Event handlers
  {
    name: 'Various Event Handlers',
    payload: '<div onclick=alert(1) onmouseover=alert(2) onfocus=alert(3)>hover me</div>',
    expected: 'All event handlers should be removed',
  },

  // Style injection
  {
    name: 'Style with Expression',
    payload: '<style>body{background:expression(alert(1))}</style>',
    expected: 'Style tags should be removed',
  },

  // Object/Embed tags
  {
    name: 'Object Tag Injection',
    payload: '<object data="javascript:alert(1)">',
    expected: 'Object tags should be removed',
  },

  // Iframe injection
  {
    name: 'Iframe Injection',
    payload: '<iframe src="javascript:alert(1)">',
    expected: 'Iframe tags should be removed',
  },

  // Meta refresh
  {
    name: 'Meta Refresh Redirect',
    payload: '<meta http-equiv="refresh" content="0;url=javascript:alert(1)">',
    expected: 'Meta tags should be removed',
  },

  // Form with action
  {
    name: 'Form with JavaScript Action',
    payload: '<form action="javascript:alert(1)"><input type="submit"></form>',
    expected: 'Forms and JavaScript actions should be neutralized',
  },

  // Base tag
  {
    name: 'Base Tag Injection',
    payload: '<base href="javascript:alert(1)//">',
    expected: 'Base tags should be removed',
  },

  // Polyglot payload
  {
    name: 'Polyglot XSS',
    payload: 'javascript:/*--></title></style></textarea></script></xmp><svg/onload=\'+/"/+/onmouseover=1/+/[*/[]/+alert(1)//\'>',
    expected: 'Complex polyglot should be fully sanitized',
  },

  // Case variation
  {
    name: 'Case Variation Script',
    payload: '<ScRiPt>alert(1)</ScRiPt>',
    expected: 'Script tags regardless of case should be removed',
  },

  // Null byte injection
  {
    name: 'Null Byte in Script',
    payload: '<script\x00>alert(1)</script>',
    expected: 'Script tags with null bytes should be removed',
  },

  // HTML entities
  {
    name: 'HTML Entity Encoded Script',
    payload: '&lt;script&gt;alert(1)&lt;/script&gt;',
    expected: 'Already encoded entities should remain safe',
  },

  // Nested tags
  {
    name: 'Nested Script Tags',
    payload: '<<script>script>alert(1)<</script>/script>',
    expected: 'Nested script tags should be removed',
  },

  // Background attribute
  {
    name: 'Background Attribute',
    payload: '<table background="javascript:alert(1)">',
    expected: 'JavaScript in attributes should be removed',
  },

  // Link with vbscript
  {
    name: 'VBScript Protocol',
    payload: '<a href="vbscript:msgbox(1)">click</a>',
    expected: 'VBScript protocol should be neutralized',
  },

  // Markdown injection (if markdown is processed)
  {
    name: 'Markdown JavaScript Link',
    payload: '[click me](javascript:alert(1))',
    expected: 'JavaScript in markdown links should be blocked',
  },
];

/**
 * Test utility to verify XSS protection
 * Returns true if the payload was properly sanitized
 */
export function isPayloadSanitized(sanitized: string): boolean {
  const dangerousPatterns = [
    /<script[\s\S]*?>[\s\S]*?<\/script>/gi, // Script tags
    /javascript:/gi, // JavaScript protocol
    /on\w+\s*=/gi, // Event handlers (onclick, onerror, etc.)
    /vbscript:/gi, // VBScript protocol
    /data:text\/html/gi, // Data URI with HTML
    /<iframe/gi, // Iframe tags
    /<object/gi, // Object tags
    /<embed/gi, // Embed tags
    /<form/gi, // Form tags
    /<base/gi, // Base tags
    /<meta/gi, // Meta tags
    /<svg[\s\S]*?on\w+/gi, // SVG with event handlers
  ];

  // Check if any dangerous patterns remain in the sanitized output
  for (const pattern of dangerousPatterns) {
    if (pattern.test(sanitized)) {
      return false; // Dangerous pattern found - NOT sanitized
    }
  }

  return true; // No dangerous patterns found - appears sanitized
}

/**
 * Expected safe output patterns
 * The sanitized output should only contain these safe elements
 */
export const SAFE_PATTERNS = {
  ALLOWED_TAGS: ['span', 'br'],
  ALLOWED_ATTRIBUTES: ['class'],
  DANGEROUS_TAGS_TO_STRIP: [
    'script', 'iframe', 'object', 'embed', 'form', 'input',
    'button', 'textarea', 'select', 'base', 'meta', 'link',
    'style', 'img', 'video', 'audio', 'svg', 'canvas',
  ],
  DANGEROUS_ATTRIBUTES_TO_STRIP: [
    'onclick', 'onerror', 'onload', 'onmouseover', 'onfocus',
    'onblur', 'onchange', 'onsubmit', 'onkeydown', 'onkeyup',
    'onkeypress', 'onmousedown', 'onmouseup', 'ondblclick',
    'oncontextmenu', 'oninput', 'onwheel', 'ondrag', 'ondrop',
  ],
  DANGEROUS_PROTOCOLS_TO_STRIP: [
    'javascript:', 'data:', 'vbscript:', 'file:', 'about:',
  ],
};

export default XSS_TEST_PAYLOADS;
