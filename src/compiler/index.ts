import { CompilerOptions, CompilerContext, ComponentMeta } from './interfaces';
import { Logger, BuildError } from './logger';
import { transformTsFiles } from './transformer';
import { emptyDir, writeFile } from './util';
import * as path from 'path';


export function compileComponents(opts: CompilerOptions, ctx: CompilerContext = {}) {
  const logger = new Logger(ctx, `compile`);

  return transpile(opts, ctx)
    .then(() => {
      // congrats, we did it!  (•_•) / ( •_•)>⌐■-■ / (⌐■_■)
      logger.finish();
    })
    .catch(err => {
      if (err.isFatal) { throw err; }
      throw logger.fail(err);
    });
}


export function transpile(opts: CompilerOptions, ctx: CompilerContext) {
  if (!opts.srcDir) {
    throw new BuildError(`srcDir required`);
  } else if (!path.isAbsolute(opts.srcDir)) {
    throw new BuildError(`srcDir must be an absolute path`);
  }

  if (!opts.destDir) {
    throw new BuildError(`destDir required`);
  } else if (!path.isAbsolute(opts.destDir)) {
    throw new BuildError(`destDir must be an absolute path`);
  }

  return emptyDir(opts.destDir)
    .then(() => {
      return transformTsFiles(opts, ctx)
    .then(files => {
      return generateManifest(opts, ctx);
    });
  });
}


function generateManifest(opts: CompilerOptions, ctx: CompilerContext) {
  const manifestPath = path.join(opts.destDir, 'manifest.json');
  const manifest: { components: ComponentMeta[] } = {
    components: []
  };

  ctx.files.forEach(f => {
    f.components.forEach(c => {
      delete c.preprocessStyles;
      manifest.components.push(c);
    });
  });

  return writeFile(manifestPath, JSON.stringify(manifest, null, 2));
}
