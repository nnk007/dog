//app/root.tsx
import {
    Link,
    Links,
    LiveReload,
    Meta,
    Outlet,
    Scripts,
    ScrollRestoration,
    useRouteError,
} from "@remix-run/react";

import type { LinksFunction } from "@remix-run/node";
import { ReactNode } from "react";

export const links: LinksFunction = () => [
    { rel: "stylesheet", href: "/style.css" },
];

export function Layout({ children }: { children: ReactNode }) {
    return (
        <html lang="en">
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                {/* <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link href="https://fonts.googleapis.com/css2?family=Comfortaa:wght@300..700&display=swap" rel="stylesheet" />
          <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap" rel="stylesheet" />
          <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet" /> */}
                <Meta />
                <Links />
            </head>
            <body className="h-screen w-screen flex justify-center items-center">
                {children}
                <ScrollRestoration />
                <Scripts />
                <LiveReload />
            </body>
        </html>
    );
}


export default function App() {
    return (
        <Outlet />
    );
}


export function ErrorBoundary() {
    const error = useRouteError();
    console.error(error);
    return (
      <html lang="en">
        <head>
          <title>UI render error!</title>
          <Meta />
          <Links />
        </head>
        <body className="w-screen h-screen">
          <div className="flex flex-col gap-2 items-center justify-center w-full h-full">
            <div className="text-red-500 text-3xl font-semibold">Unexpected UI Error !</div>
            <Link to="/" className="text-xl hover:underline">Return to index</Link>
          </div>
          <Scripts />
        </body>
      </html>
    );
  }