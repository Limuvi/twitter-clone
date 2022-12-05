import { UnsupportedMediaTypeException } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';

export function ImagesInterceptor(
  fieldName = 'images',
  maxSize = 1024 * 1024 * 10,
  maxCount = 10,
) {
  return FilesInterceptor(fieldName, maxCount, {
    limits: {
      fileSize: maxSize,
    },
    fileFilter: (req, file, callback) => {
      if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
        const err = new UnsupportedMediaTypeException(
          'Only image files are supported',
        );
        return callback(err, false);
      }
      callback(null, true);
    },
  });
}
