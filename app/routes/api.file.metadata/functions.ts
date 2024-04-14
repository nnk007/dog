import cp from "child_process";

interface FFProbeFormatRaw {
    filename: string,
    nb_streams: number,
    nb_programs: number,
    format_name: string,
    format_long_name: string,
    start_time: string,
    duration: string,
    size: string,
    bit_rate: string,
    probe_score: number,
    tags: {
        minor_version: string,
        major_brand: string,
        compatible_brands: string,
        Hw: string,
        LvMetaInfo: string,
        bitrate: string,
        maxrate: string,
        te_is_reencode: string,
        encoder: string
    }
}
export interface FFProbeFormat {
    filename: string,
    nb_streams: number,
    nb_programs: number,
    format_name: string[],
    format_long_name: string,
    start_time: number,
    duration: number,
    size: number,
    bit_rate: number,
    probe_score: number,
}
const tasks = new Map<string, number>();
export async function getMetadata(pathIn: string):Promise<{format:FFProbeFormat}> {
    return new Promise((res, rej) => {
        const ffprobe = cp.spawn("ffprobe", [
            "-v", "quiet",
            "-print_format", "json",
            "-show_format",
            "-i", pathIn
        ]);
        ffprobe.on("spawn", () => {
            console.log("[FFPROBE] START");
        })
        ffprobe.on("error", (err) => {
            rej(err);
        });
        ffprobe.on("exit", () => {
            console.log("[FFPROBE] END");
            const buffer = Buffer.from(ffprobe.stdout.read());
            const _json = JSON.parse(buffer.toString()) as { format: FFProbeFormatRaw };
            const _format = _json.format;
            const json: { format: FFProbeFormat } = {
                format: {
                    ..._format,
                    bit_rate: Number.parseInt(_format.bit_rate),
                    duration: Number.parseFloat(_format.duration),
                    format_name: _format.format_name.split(","),
                    start_time: Number.parseFloat(_format.start_time),
                    size: Number.parseInt(_format.size),
                }
            }
            res(json);
        })
    })
}
