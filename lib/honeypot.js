/**
 * Honeypot anti-spam utilities.
 *
 * Two-layer protection without CAPTCHA:
 * 1. Hidden "website_url" field — bots auto-fill it, humans never see it.
 * 2. Timing check — form submitted faster than a human could type.
 */

/**
 * Validate honeypot fields in form data.
 * @param {FormData} formData
 * @param {object} opts
 * @param {number} opts.minTimeMs - Minimum ms between render and submit (default 2000)
 * @returns {{ ok: boolean, reason?: string }}
 */
export function validateHoneypot(formData, { minTimeMs = 2000 } = {}) {
  // Layer 1: Hidden field should be empty
  const honeypotValue = formData.get('website_url') || ''
  if (honeypotValue.toString().trim()) {
    return { ok: false, reason: 'honeypot_filled' }
  }

  // Layer 2: Timing check
  const renderTimestamp = Number(formData.get('_hp_t') || 0)
  if (renderTimestamp > 0) {
    const elapsed = Date.now() - renderTimestamp
    if (elapsed < minTimeMs) {
      return { ok: false, reason: 'too_fast' }
    }
  }

  return { ok: true }
}

/**
 * React server component that renders honeypot form fields.
 * Include this inside any <form> you want to protect.
 */
export function HoneypotFields() {
  return (
    <>
      {/* Hidden field — bots fill this, humans never see it */}
      <div
        style={{
          position: 'absolute',
          left: '-9999px',
          opacity: 0,
          height: 0,
          overflow: 'hidden',
          pointerEvents: 'none',
        }}
        aria-hidden="true"
      >
        <label htmlFor="website_url">Website</label>
        <input
          type="text"
          name="website_url"
          id="website_url"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>
      {/* Timestamp for timing check */}
      <input type="hidden" name="_hp_t" value={Date.now()} />
    </>
  )
}
