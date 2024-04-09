import { FileType } from "./FileType";

export const map = new Map<FileType, string>([
    [FileType.app, "app.png"],
    [FileType.audio, "audio.png"],
    [FileType.archive, "archive.png"],
    [FileType.image, "image.png"],
    [FileType.install, "install.png"],
    [FileType.lib, "lib.png"],
    [FileType.text, "text.png"],
    [FileType.video, "video.png"],
    [FileType.other, "other.png"]
]);