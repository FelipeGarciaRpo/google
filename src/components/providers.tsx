"use client";

import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";
import { Authenticated, AuthLoading, ConvexReactClient, Unauthenticated } from "convex/react";
import { ConvexProviderWithClerk} from "convex/react-clerk";
import { ThemeProvider } from "./theme-provider";
import { UnauthenticatedView } from "@/features/auth/components/unathenticated-view";
import { AuthLoadingView } from "@/features/auth/components/auth-loading-view";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Clerk modals (sign in, user profile) follow the app theme
const ThemedClerkProvider = ({children}: {children: React.ReactNode})=>{
    const { resolvedTheme } = useTheme();

    return (
        <ClerkProvider
            appearance={{ baseTheme: resolvedTheme === "dark" ? dark : undefined }}
        >
            {children}
        </ClerkProvider>
    )
}

export const Providers = ({children}: {children: React.ReactNode})=>{
    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
        >
            <ThemedClerkProvider>
                <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
                    <Authenticated>
                        {children}
                    </Authenticated>
                    <Unauthenticated>
                        <UnauthenticatedView/>
                    </Unauthenticated>
                    <AuthLoading>
                        <AuthLoadingView/>
                    </AuthLoading>
                </ConvexProviderWithClerk>
            </ThemedClerkProvider>
        </ThemeProvider>
    )
}
