import { FSDescriptor } from './filemanager.component';
import textExtensions from './textextensions';
import { getMimeType } from './mimetype';
import * as MIT from 'material-icon-theme/dist/material-icons.json';

Object.keys(MIT).forEach(k => {
    console.log(k, MIT[k])
})

const folderNames = MIT['default'].folderNames;
const fileNames = MIT['default'].fileNames;
const fileExtensions = MIT['default'].fileExtensions;
// const { folderNames, fileExtensions, fileNames } = MIT;
/**
 * TODO: support `VirtualBox VMs` `Videos` `Templates` `Public` `Music` `Downloads` `Documents` `Desktop` `Applications`
 */

let folderIconNameList = [];
let fileIconNameList = [];
let fileIconExtensionList = [];

Object.entries(fileNames).forEach(([name, icon]) => {
    fileIconNameList.push({
        val: name,
        iconName: icon
    });
})
Object.entries(fileExtensions).forEach(([name, icon]) => {
    fileIconExtensionList.push({
        val: name,
        iconName: icon
    });
})

Object.entries(folderNames).forEach(([name, icon]) => {
    folderIconNameList.push({
        val: name,
        iconName: icon,
    });
})


function isText(path: string) {
    const ext = path.split('.').pop();
    return textExtensions.includes(ext);
}

function getFallbackIcon(path: string) {
    const ext = path.split('.').pop();
    // "textExtensions" has some entries that we're going to override:

    let v = {
        so: "/assets/file-icons/exts/exe.svg",
        pak: "/assets/file-icons/compressed.svg",
        dat: {
            path: "/assets/lib/icons/hex.svg",
            needsBackdrop: true
        }
    }[ext];

    if (!v) return null;

    return typeof v == "string" ?
        {
            path: v,
            needsBackdrop: false
        } : v;
}

const builtinIcons = [
    "7z",
    "apk",
    "arc",
    "bash",
    "bat",
    "bz",
    "cpp",
    "c",
    "dcr",
    "deb",
    "exe",
    "go",
    "gz",
    "h",
    "html",
    "jar",
    "java",
    "md",
    "pdf",
    "php",
    "py",
    "rar",
    "rb",
    "rpm",
    "rs",
    "r",
    "rust",
    "sh",
    "swf",
    "sys",
    "tar",
    "xar",
    "xz",
    "zip"
];

const getBestMatch = (data: { val: string, iconName: string; }[], filename) => {
    return data
        .filter(d => filename.endsWith(d.val)) // filter to all match results
        .sort((a, b) => b.val.length - a.val.length) // sort longest string first
    [0]?.iconName; // Return the first result.
};

// TODO: resolve dynamic thumbnails for media documents
export const resolveIcon = (file: FSDescriptor): { path: string, needsBackdrop: boolean; } => {

    if (file.kind == "directory") {
        return resolveDirIcon(file);
    }

    return resolveFileIcon(file);
};

const resolveDirIcon = (file: FSDescriptor) => {
    const dirnameMatch = getBestMatch(folderIconNameList, file.name);
    // VS Code Material Icon Theme pack

    // TODO: default to a clear icon that doesn't have decoration
    return {
        path: dirnameMatch ? `assets/lib/icons/${dirnameMatch}.svg` : "assets/lib/icons/folder.svg",
        needsBackdrop: false
    };
};

const resolveFileIcon = (file: FSDescriptor) => {
    // Folders always use the material-icon-theme

    const baseExt = builtinIcons.find(ext => file.name.endsWith('.' + ext));
    if (baseExt) {
        return {
            path: `assets/file-icons/exts/${baseExt}.svg`,
            needsBackdrop: false
        };
    }

    // Resolve a base MIME type via path extension
    const base2Ext = getMimeType(file.name);

    // If we get a path extension, we can easily map the icon
    if (base2Ext) {
        return {
            path: `assets/file-icons/${base2Ext}.svg`,
            needsBackdrop: false
        };
    }

    // Lookup a filename from material-icon-theme
    const filename = fileIconNameList
        .filter(d => file.name.toLowerCase() == d.val.toLowerCase())
        .sort((a, b) => b.val.length - a.val.length)
        [0]?.iconName;

    if (filename) {
        return {
            path: `assets/lib/icons/${filename}.svg`,
            needsBackdrop: true
        };
    }

    // foo.log.1 foo.log.123 should be treated clearly as log files.
    if (/\.log\.\d+$/.test(filename)) {
        return {
            path: `assets/lib/icons/log.svg`,
            needsBackdrop: true
        };
    }

    // Check the file's extension -- we may
    const fileext = fileIconExtensionList
        .filter(d => file.name.toLowerCase().endsWith('.' + d.val.toLowerCase()))
        .sort((a, b) => b.val.length - a.val.length)
        [0]?.iconName;

    if (fileext) return {
        path: `assets/lib/icons/${fileext}.svg`,
        needsBackdrop: true
    };


    let fallback = getFallbackIcon(file.name);
    if (fallback)
        return fallback;

    // If the file doesn't have a text extension, we're going to assume it's binary data.
    const isFileBinary = !isText(file.path);


    return {
        path: isFileBinary ? 'assets/file-icons/text.svg' : 'assets/file-icons/binary.svg',
        needsBackdrop: false
    };
};
