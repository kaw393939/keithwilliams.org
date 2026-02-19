/**
 * Input validation utilities.
 * All user input is validated server-side before touching the database.
 */

/** Maximum lengths for text inputs */
export const LIMITS = {
  POST_TITLE: 200,
  POST_BODY: 50_000,
  COMMENT_BODY: 5_000,
}

/**
 * Sanitize a string: trim whitespace and convert to string.
 */
export function sanitize(value) {
  return String(value ?? '').trim()
}

/**
 * Validate a new post.
 * @returns {string[]} Array of error messages (empty = valid)
 */
export function validatePost(title, body) {
  const errors = []
  if (!title) errors.push('Title is required.')
  else if (title.length > LIMITS.POST_TITLE)
    errors.push(`Title must be ${LIMITS.POST_TITLE} characters or fewer.`)

  if (!body) errors.push('Body is required.')
  else if (body.length > LIMITS.POST_BODY)
    errors.push(`Body must be ${LIMITS.POST_BODY.toLocaleString()} characters or fewer.`)

  return errors
}

/**
 * Validate a new comment.
 * @returns {string[]} Array of error messages (empty = valid)
 */
export function validateComment(body) {
  const errors = []
  if (!body) errors.push('Comment cannot be empty.')
  else if (body.length > LIMITS.COMMENT_BODY)
    errors.push(`Comment must be ${LIMITS.COMMENT_BODY.toLocaleString()} characters or fewer.`)

  return errors
}
