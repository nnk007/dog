import { LoaderFunctionArgs } from "@remix-run/node";
import { MetaFunction, useLoaderData } from "@remix-run/react";
import { useState } from "react"
import { json } from "react-router";
import fs from "fs";
import path from "path";

export const meta: MetaFunction = () => {
    return [
        { title: "Text preview" },
        { name: "description", content: "Preview text files" },
    ];
};

export async function loader({request}:LoaderFunctionArgs){
    const sp = new URL(request.url).searchParams;
    if(!sp.has("path")) return json("");
    const encoded_path = sp.get("path")!;
    const decoded_path = decodeURIComponent(encoded_path);
    try {
        const text = await fs.promises.readFile(path.join(process.env["DATA_DIR"]!,decoded_path),"utf8");
        return json(text);
    } catch(err){
        throw new Error("File not found");
    }
}

export default function Route(){
    const text = useLoaderData<string>();
    const [textContent,setTextContent] = useState(text);
    return (
        <div className="h-full py-4">
            <textarea name="" id="" placeholder="Text preview" className="bg-black/10 w-full h-full resize-none" value={textContent} onChange={ev=>setTextContent(ev.currentTarget.value)}></textarea>
        </div>
    )
}