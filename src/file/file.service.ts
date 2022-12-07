import { Injectable } from '@nestjs/common';
import * as path from 'path';
import * as uuid from 'uuid';
import { ConfigService } from '@nestjs/config';
import { mkdir, rm, stat, writeFile } from 'fs/promises';

@Injectable()
export class FileService {
  private folderName: string;

  constructor(private configService: ConfigService) {
    this.folderName = path.resolve(
      process.cwd(),
      this.configService.get('STATIC_FILES_FOLDER_NAME'),
    );
  }

  async create(files: Array<Express.Multer.File>): Promise<string[]> {
    await mkdir(this.folderName, { recursive: true });
    const fileNames: string[] = [];

    for (const file of files) {
      const extension = file.originalname.split('.').pop();
      const fileName = `${uuid.v4()}.${extension}`;

      await writeFile(path.join(this.folderName, fileName), file.buffer);
      fileNames.push(fileName);
    }

    return fileNames;
  }

  async delete(fileNames: string[]): Promise<void> {
    for (const fileName of fileNames) {
      await rm(path.join(this.folderName, fileName), { force: true });
    }
  }

  async replace(
    newFiles: Array<Express.Multer.File>,
    prevFileNames: string[],
  ): Promise<string[]> {
    const existed = [];

    if (prevFileNames.length) {
      const deleted = [];
      for (const prevName of prevFileNames) {
        const prevSize = (await stat(path.join(this.folderName, prevName)))
          .size;
        const index = newFiles.findIndex(
          ({ originalname, size }) =>
            originalname === prevName && size === prevSize,
        );

        if (index === -1) {
          deleted.push(prevName);
        } else {
          existed.push(newFiles[index].originalname);
          newFiles.splice(index, 1);
        }
      }

      await this.delete(deleted);
    }

    const created = await this.create(newFiles);
    return [...created, ...existed];
  }
}
