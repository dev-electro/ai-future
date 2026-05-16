import { Playfair_Display, Sora, JetBrains_Mono } from "next/font/google";
import Script from "next/script";

const GA_ID = "G-44VTD4FB7M";

const playfair = Playfair_Display({
    subsets: ["latin"],
    variable: "--font-pf",
    display: "swap",
    weight: ["400", "500", "600", "700", "800", "900"],
});

const sora = Sora({
    subsets: ["latin"],
    variable: "--font-sora",
    display: "swap",
    weight: ["300", "400", "500", "600", "700"],
});

const jetbrains = JetBrains_Mono({
    subsets: ["latin"],
    variable: "--font-jb",
    display: "swap",
    weight: ["400", "500", "600"],
});

export default function MyApp({ Component, pageProps }) {
    return (
        <>
            {/* Google Analytics — loads after page is interactive (afterInteractive = best practice) */}
            <Script
                src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
                strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
                {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', { page_path: window.location.pathname });
        `}
            </Script>

            <main className={`${playfair.variable} ${sora.variable} ${jetbrains.variable}`}>
                <Component {...pageProps} />
            </main>
        </>
    );
}
