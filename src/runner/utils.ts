import { ContentInfo } from '../models/app.interfaces';

export function toContentPath(path: string): ContentInfo {
  let lastSlash = Math.max(path.lastIndexOf('/'), 0);
  const folder = lastSlash > 0 ? path.substring(0, lastSlash) : '';

  let name = path.substring(lastSlash);
  if (name[0] === '/') {
    name = name.replace('/', '');
  }

  let contentType = '';
  if (path.endsWith('app.xml')) {
    contentType = 'app.xml';
    name = '';
  } else if (path.endsWith('component.xml')) {
    contentType = 'component.xml';
    name = name.replace('.component.xml', '');
  } else if (path.endsWith('page.xml')) {
    contentType = 'page.xml';
    name = name.replace('.page.xml', '');
  } else {
    const lastDot = name.lastIndexOf('.');

    if (lastDot < 0) {
      throw new Error('Incorrect path' + path);
    }

    contentType = name.substring(lastDot + 1);
    name = name.substring(0, lastDot);
  }
  return { folder, name, contentType };
}
