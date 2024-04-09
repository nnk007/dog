import type { MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";

// export const meta: MetaFunction = () => {
//     return [
//       { title: "Files" },
//       { name: "description", content: "Rope now" },
//     ];
//   };

export default function Route() {
    return (
        <div className="bg-black w-screen h-screen">
            <Link to={"/view?path="} className="text-white underline">Go to View</Link>
        </div>)
}