import { readdirSync } from "fs";
import { join } from "path";

/** Returns a list of Files of root ${source} */
export const getFiles = (source: string) =>
  readdirSync(source, { withFileTypes: true })
    .filter(dirent => dirent.isFile());

/** Returns a list of Directories of root ${source} */
export const getDirectories = (source: string) =>
  readdirSync(source, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory());

/** Returns name of parent directory of file with name ${fileName} of root ${source} */
export const getDirByFile = (source: string, fileName: string) => {
	for (const directory of getDirectories(source))
		for (const file of getFiles(join(source, directory.name)))
			if (file.name === fileName) return directory.name
}

/** Returns a fuction to pass values of TemplateString to */
export const reuse = (strings: TemplateStringsArray, ...others: number[]) =>
	(...vals: string[]) =>
    strings.map((s, i) =>
      `${s}${vals[i] || ""}`
    ).join("");

export const randomInt = (max: number) =>
   Math.floor(Math.random() * max) + 1