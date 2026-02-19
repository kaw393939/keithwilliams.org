import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import PostgresAdapter from '@auth/pg-adapter'
import { pool } from './lib/db'

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PostgresAdapter(pool),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
        session.user.role = user.role || 'user'
      }
      return session
    },
  },
  events: {
    /**
     * First user to sign up is automatically promoted to admin.
     * All subsequent users default to 'user' role.
     */
    async createUser({ user }) {
      const result = await pool.query('SELECT COUNT(*)::int AS n FROM users')
      if (result.rows[0].n <= 1) {
        await pool.query("UPDATE users SET role = 'admin' WHERE id = $1", [user.id])
      }
    },
  },
  trustHost: true,
})
