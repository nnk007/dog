import { LoaderFunctionArgs, redirect, redirectDocument } from "@remix-run/node";

export function loader({request}:LoaderFunctionArgs){
    const sp = new URL(request.url).searchParams;
    if(!sp.has("path")) return redirect("/view");
    return redirectDocument("/file?path="+encodeURIComponent(decodeURIComponent(sp.get("path")!)));
}