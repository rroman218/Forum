import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const { handlers } = NextAuth({
    session: {
        strategy: "jwt",
        maxAge: 30 * 24,
    },

    pages: {
        signIn: '/login'
    },

    providers: [
        Credentials({
            credentials: {

            }
        })
    ],

    callbacks: {
        // async jwt({params}) {
            
        // },
        // async session(params) {
            
        // },
    }
});
