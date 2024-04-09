import { LoaderFunctionArgs, json } from "@remix-run/node";
import { map } from "config/FileIcons";
export function loader({}:LoaderFunctionArgs){
    return json([...map.entries()]);
}